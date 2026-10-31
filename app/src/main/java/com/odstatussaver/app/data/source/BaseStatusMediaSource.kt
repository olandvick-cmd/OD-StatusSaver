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
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    /**
     * A non-null File.listFiles() result is not proof of access on Android 11+.
     * Scoped storage can expose the directory but return an empty listing.
     * Only treat direct access as usable when actual status media is visible.
     */
    override fun canAccessDirectly(): Boolean {
        return try {
            getCandidateDirectories().asSequence()
                .filter { it.exists() && it.isDirectory && it.canRead() }
                .mapNotNull { it.listFiles() }
                .any { files -> files.any { isValidMediaFile(it.name, it.length()) } }
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
        // On modern Android, an empty direct listing is ambiguous because of
        // scoped storage. Require either visible media or an explicit SAF grant.
        return canAccessDirectly() || hasSafPermission()
    }

    override suspend fun getPersistedTreeUri(): Uri? = prefStore.getTreeUri(sourceType)

    override suspend fun setPersistedTreeUri(treeUri: Uri) {
        try {
            context.contentResolver.takePersistableUriPermission(
                treeUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
        } catch (e: Exception) {
            // The grant may already be held or the provider may not support persistence.
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
                context.contentResolver.openInputStream(item.uri)?.use { it.read() != -1 } ?: false
            }
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun discoverStatuses(): Result<List<StatusItem>> = withContext(Dispatchers.IO) {
        runCatching {
            // 1. Try direct paths, but only accept the scan if it actually finds
            // supported media. An empty/restricted listing must fall through to SAF.
            for (directory in getCandidateDirectories()) {
                if (!directory.exists() || !directory.isDirectory || !directory.canRead()) continue

                val files = try {
                    directory.listFiles()
                } catch (e: SecurityException) {
                    null
                } ?: continue

                val directItems = files.mapNotNull { file ->
                    if (!file.isFile || !isValidMediaFile(file.name, file.length())) return@mapNotNull null
                    val ext = file.extension.lowercase()
                    val isVideo = AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)
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
                }

                if (directItems.isNotEmpty()) {
                    return@runCatching directItems.sortedByDescending { it.lastModified }
                }
            }

            // 2. SAF is the reliable route on Android 11+ and the fallback when
            // direct file access is restricted or the directory listing is empty.
            val treeUri = getPersistedTreeUri()
                ?: throw SecurityException("Folder access required for ${sourceType.displayName}. Tap Grant Folder Access and select its .Statuses folder.")

            try {
                val rootDoc = DocumentFile.fromTreeUri(context, treeUri)
                if (rootDoc == null || !rootDoc.exists() || !rootDoc.canRead()) {
                    clearPersistedTreeUri()
                    throw SecurityException("Folder permission for ${sourceType.displayName} is no longer accessible. Please grant access again.")
                }

                val targetFolder = if (rootDoc.name == ".Statuses" || rootDoc.name == "Statuses") {
                    rootDoc
                } else {
                    rootDoc.findFile(".Statuses") ?: rootDoc.findFile("Statuses") ?: rootDoc
                }

                val items = targetFolder.listFiles().mapNotNull { doc ->
                    if (!doc.isFile) return@mapNotNull null
                    val name = doc.name ?: return@mapNotNull null
                    val size = doc.length()
                    if (!isValidMediaFile(name, size)) return@mapNotNull null

                    val ext = name.substringAfterLast('.', "").lowercase()
                    val isVideo = (doc.type ?: "").startsWith("video/") ||
                        AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)
                    val modified = doc.lastModified()

                    StatusItem(
                        id = doc.uri.toString(),
                        title = name,
                        uri = doc.uri,
                        file = null,
                        mediaType = if (isVideo) MediaType.VIDEO else MediaType.IMAGE,
                        sizeBytes = size,
                        lastModified = if (modified > 0) modified else System.currentTimeMillis(),
                        source = sourceType
                    )
                }
                items.sortedByDescending { it.lastModified }
            } catch (e: SecurityException) {
                clearPersistedTreeUri()
                throw e
            }
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
