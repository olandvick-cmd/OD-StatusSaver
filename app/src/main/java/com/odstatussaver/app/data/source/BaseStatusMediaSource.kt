package com.odstatussaver.app.data.source

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.net.toUri
import androidx.documentfile.provider.DocumentFile
import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.data.preferences.SafPrefStore
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.source.MediaSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

abstract class BaseStatusMediaSource(
    protected val context: Context,
    protected val prefStore: SafPrefStore,
    override val sourceType: WhatsAppSource
) : MediaSource {

    override val displayName: String = sourceType.displayName
    override val packageName: String = sourceType.packageName

    override fun isInstalled(): Boolean {
        return try {
            val pm = context.packageManager
            pm.getPackageInfo(packageName, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    override fun canAccessDirectly(): Boolean {
        return try {
            val candidates = getCandidateDirectories()
            val existingDir = candidates.firstOrNull { it.exists() && it.canRead() }
            val files = existingDir?.listFiles()
            files != null
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun hasSafPermission(): Boolean {
        val uri = getPersistedTreeUri() ?: return false
        return try {
            val doc = DocumentFile.fromTreeUri(context, uri)
            doc != null && doc.exists() && doc.canRead()
        } catch (e: SecurityException) {
            clearPersistedTreeUri()
            false
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun hasAccess(): Boolean {
        return canAccessDirectly() || hasSafPermission()
    }

    override suspend fun getPersistedTreeUri(): Uri? {
        return prefStore.getTreeUri(sourceType)
    }

    override suspend fun setPersistedTreeUri(treeUri: Uri) {
        try {
            val takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION
            context.contentResolver.takePersistableUriPermission(treeUri, takeFlags)
        } catch (e: Exception) {
            // Already held or not persistable
        }
        prefStore.saveTreeUri(sourceType, treeUri)
    }

    override suspend fun clearPersistedTreeUri() {
        prefStore.clearTreeUri(sourceType)
    }

    override suspend fun isStatusAccessible(item: StatusItem): Boolean = withContext(Dispatchers.IO) {
        try {
            if (item.file != null) {
                item.file.exists() && item.file.canRead() && item.file.length() > 0
            } else {
                context.contentResolver.openInputStream(item.uri)?.use { stream ->
                    stream.read() != -1
                } ?: false
            }
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun discoverStatuses(): Result<List<StatusItem>> = withContext(Dispatchers.IO) {
        runCatching {
            val items = mutableListOf<StatusItem>()

            // 1. First probe direct candidate paths
            val candidates = getCandidateDirectories()
            val directDir = candidates.firstOrNull { it.exists() && it.canRead() }

            if (directDir != null) {
                val files = directDir.listFiles()
                if (files != null) {
                    for (file in files) {
                        if (isValidMediaFile(file.name, file.length())) {
                            val ext = file.extension.lowercase()
                            val isVideo = AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)
                            items.add(
                                StatusItem(
                                    id = file.absolutePath,
                                    title = file.name,
                                    uri = file.toUri(),
                                    file = file,
                                    mediaType = if (isVideo) MediaType.VIDEO else MediaType.IMAGE,
                                    sizeBytes = file.length(),
                                    lastModified = file.lastModified(),
                                    source = sourceType
                                )
                            )
                        }
                    }
                    return@runCatching items.sortedByDescending { it.lastModified }
                }
            }

            // 2. Fallback to SAF DocumentFile tree
            val treeUri = getPersistedTreeUri()
            if (treeUri != null) {
                try {
                    val rootDoc = DocumentFile.fromTreeUri(context, treeUri)
                    if (rootDoc != null && rootDoc.exists() && rootDoc.canRead()) {
                        val childDocs = rootDoc.listFiles()
                        for (doc in childDocs) {
                            if (doc.isFile) {
                                val name = doc.name ?: continue
                                val size = doc.length()
                                if (isValidMediaFile(name, size)) {
                                    val ext = name.substringAfterLast('.', "").lowercase()
                                    val mimeType = doc.type ?: ""
                                    val isVideo = mimeType.startsWith("video/") || AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)
                                    val lastModified = doc.lastModified()

                                    items.add(
                                        StatusItem(
                                            id = doc.uri.toString(),
                                            title = name,
                                            uri = doc.uri,
                                            file = null,
                                            mediaType = if (isVideo) MediaType.VIDEO else MediaType.IMAGE,
                                            sizeBytes = size,
                                            lastModified = if (lastModified > 0) lastModified else System.currentTimeMillis(),
                                            source = sourceType
                                        )
                                    )
                                }
                            }
                        }
                        return@runCatching items.sortedByDescending { it.lastModified }
                    } else {
                        clearPersistedTreeUri()
                        throw IllegalStateException("Folder permission for ${sourceType.displayName} is no longer accessible.")
                    }
                } catch (e: SecurityException) {
                    clearPersistedTreeUri()
                    throw e
                }
            }

            throw SecurityException("Permission required to access ${sourceType.displayName} status folder.")
        }
    }

    protected fun isValidMediaFile(name: String, sizeBytes: Long): Boolean {
        if (sizeBytes <= 0) return false
        if (name.startsWith(".") || name.startsWith(".nomedia")) return false
        val ext = name.substringAfterLast('.', "").lowercase()
        return AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains(ext) ||
                AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)
    }
}
