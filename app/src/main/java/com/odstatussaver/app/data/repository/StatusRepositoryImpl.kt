package com.odstatussaver.app.data.repository

import android.content.Context
import android.net.Uri
import com.odstatussaver.app.data.local.dao.SavedStatusDao
import com.odstatussaver.app.data.local.entity.SavedStatusEntity
import com.odstatussaver.app.data.preferences.SafPrefStore
import com.odstatussaver.app.data.source.MediaStoreSaver
import com.odstatussaver.app.data.source.SaveStatusOutcome
import com.odstatussaver.app.data.source.WhatsAppBusinessMediaSource
import com.odstatussaver.app.data.source.WhatsAppMediaSource
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.repository.BulkSaveReport
import com.odstatussaver.app.domain.repository.StatusRepository
import com.odstatussaver.app.domain.source.MediaSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.io.File

class StatusRepositoryImpl(
    private val context: Context,
    private val mediaStoreSaver: MediaStoreSaver,
    private val savedDao: SavedStatusDao,
    private val prefStore: SafPrefStore
) : StatusRepository {

    private val whatsAppSource = WhatsAppMediaSource(context, prefStore)
    private val whatsAppBusinessSource = WhatsAppBusinessMediaSource(context, prefStore)

    override fun getMediaSource(source: WhatsAppSource): MediaSource {
        return when (source) {
            WhatsAppSource.STANDARD -> whatsAppSource
            WhatsAppSource.BUSINESS -> whatsAppBusinessSource
        }
    }

    override fun isPackageInstalled(source: WhatsAppSource): Boolean {
        return getMediaSource(source).isInstalled()
    }

    override suspend fun hasPermission(source: WhatsAppSource): Boolean {
        return getMediaSource(source).hasAccess()
    }

    override suspend fun saveGrantedTreeUri(source: WhatsAppSource, uri: Uri) {
        getMediaSource(source).setPersistedTreeUri(uri)
    }

    override suspend fun revokeFolderAccess(source: WhatsAppSource) {
        getMediaSource(source).clearPersistedTreeUri()
    }

    override fun getCandidateDirectories(source: WhatsAppSource): List<File> {
        return getMediaSource(source).getCandidateDirectories()
    }

    override fun getStatuses(source: WhatsAppSource): Flow<List<StatusItem>> {
        val rawStatusesFlow = flow {
            val mediaSource = getMediaSource(source)
            val result = mediaSource.discoverStatuses()
            val list = result.getOrElse { emptyList() }
            emit(list)
        }.flowOn(Dispatchers.IO)

        return combine(rawStatusesFlow, savedDao.getAllSavedOriginalIds()) { statuses, savedIds ->
            val savedSet = savedIds.toSet()
            statuses.map { it.copy(isSaved = savedSet.contains(it.id)) }
        }
    }

    override fun getSavedStatuses(sourceFilter: WhatsAppSource?): Flow<List<StatusItem>> {
        return savedDao.getAllSavedStatuses().map { entities ->
            val filtered = if (sourceFilter != null) {
                entities.filter { it.source == sourceFilter.name }
            } else {
                entities
            }
            filtered.map { entity ->
                val mediaType = if (entity.mediaType == "VIDEO") MediaType.VIDEO else MediaType.IMAGE
                val source = if (entity.source == "BUSINESS") WhatsAppSource.BUSINESS else WhatsAppSource.STANDARD
                val uri = Uri.parse(entity.savedUri)
                StatusItem(
                    id = entity.originalId,
                    title = entity.title,
                    uri = uri,
                    mediaType = mediaType,
                    sizeBytes = entity.sizeBytes,
                    lastModified = entity.savedAt,
                    source = source,
                    isSaved = true,
                    savedUri = uri
                )
            }
        }.flowOn(Dispatchers.IO)
    }

    override suspend fun saveStatus(item: StatusItem): SaveStatusOutcome = withContext(Dispatchers.IO) {
        // Prevent duplicate file creation if this status is already saved and accessible
        val existingSavedUriString = savedDao.getSavedUriForId(item.id)
        if (existingSavedUriString != null) {
            val existingUri = Uri.parse(existingSavedUriString)
            val isStillAccessible = try {
                context.contentResolver.openInputStream(existingUri)?.use { true } ?: false
            } catch (e: Exception) {
                false
            }
            if (isStillAccessible) {
                return@withContext SaveStatusOutcome.Success(savedUri = existingUri, isDuplicate = true)
            }
        }

        val outcome = mediaStoreSaver.save(item)
        if (outcome is SaveStatusOutcome.Success) {
            savedDao.insert(
                SavedStatusEntity(
                    originalId = item.id,
                    title = item.title,
                    savedUri = outcome.savedUri.toString(),
                    mediaType = item.mediaType.name,
                    source = item.source.name,
                    sizeBytes = item.sizeBytes,
                    savedAt = System.currentTimeMillis()
                )
            )
        }
        outcome
    }

    override suspend fun saveStatuses(
        items: List<StatusItem>,
        onProgress: suspend (savedCount: Int, totalCount: Int, currentItem: StatusItem) -> Unit
    ): BulkSaveReport = withContext(Dispatchers.IO) {
        var successCount = 0
        var failureCount = 0
        var duplicateCount = 0
        val failures = mutableListOf<Pair<StatusItem, String>>()

        for ((index, item) in items.withIndex()) {
            onProgress(index, items.size, item)
            when (val outcome = saveStatus(item)) {
                is SaveStatusOutcome.Success -> {
                    successCount++
                    if (outcome.isDuplicate) duplicateCount++
                }
                is SaveStatusOutcome.Failure -> {
                    failureCount++
                    failures.add(Pair(item, outcome.message))
                }
            }
        }
        if (items.isNotEmpty()) {
            onProgress(items.size, items.size, items.last())
        }

        BulkSaveReport(
            totalCount = items.size,
            successCount = successCount,
            failureCount = failureCount,
            duplicateCount = duplicateCount,
            failures = failures
        )
    }

    override suspend fun deleteSavedStatus(item: StatusItem): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val targetUri = item.savedUri ?: item.uri
            try {
                context.contentResolver.delete(targetUri, null, null)
            } catch (e: Exception) {
                // Ignore if already deleted on disk
            }
            savedDao.deleteByOriginalId(item.id)
            Unit
        }
    }
}
