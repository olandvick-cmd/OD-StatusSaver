package com.odstatussaver.app.domain.repository

import android.net.Uri
import com.odstatussaver.app.data.source.SaveStatusOutcome
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.source.MediaSource
import kotlinx.coroutines.flow.Flow
import java.io.File

data class BulkSaveReport(
    val totalCount: Int,
    val successCount: Int,
    val failureCount: Int,
    val duplicateCount: Int,
    val failures: List<Pair<StatusItem, String>>
)

interface StatusRepository {
    /**
     * Gets the MediaSource abstraction for a specific messaging flavor.
     */
    fun getMediaSource(source: WhatsAppSource): MediaSource

    fun isPackageInstalled(source: WhatsAppSource): Boolean

    suspend fun hasPermission(source: WhatsAppSource): Boolean

    suspend fun saveGrantedTreeUri(source: WhatsAppSource, uri: Uri)

    suspend fun revokeFolderAccess(source: WhatsAppSource)

    fun getCandidateDirectories(source: WhatsAppSource): List<File>

    /**
     * Observes live statuses from WhatsApp / WhatsApp Business.
     */
    fun getStatuses(source: WhatsAppSource): Flow<List<StatusItem>>

    /**
     * Observes locally saved statuses from Room database, optionally filtered by source.
     */
    fun getSavedStatuses(sourceFilter: WhatsAppSource? = null): Flow<List<StatusItem>>

    /**
     * Saves an individual status.
     */
    suspend fun saveStatus(item: StatusItem): SaveStatusOutcome

    /**
     * Multi-select bulk saving with incremental progress reporting.
     */
    suspend fun saveStatuses(
        items: List<StatusItem>,
        onProgress: suspend (savedCount: Int, totalCount: Int, currentItem: StatusItem) -> Unit
    ): BulkSaveReport

    /**
     * Deletes a saved status from local database and Android public storage.
     */
    suspend fun deleteSavedStatus(item: StatusItem): Result<Unit>
}
