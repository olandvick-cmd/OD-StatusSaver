package com.odstatussaver.app.data.source

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource

class SafDocumentScanner(private val context: Context) {

    /**
     * Checks if the persisted tree URI is still valid and readable by the application.
     */
    fun isUriAccessible(treeUri: Uri): Boolean {
        return try {
            val root = DocumentFile.fromTreeUri(context, treeUri)
            root != null && root.exists() && root.canRead()
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Traverses the DocumentFile tree and extracts valid image and video statuses.
     */
    fun scan(treeUri: Uri, source: WhatsAppSource): List<StatusItem> {
        val root = DocumentFile.fromTreeUri(context, treeUri) ?: return emptyList()
        if (!root.exists() || !root.canRead()) return emptyList()

        val documentFiles = root.listFiles()
        val items = mutableListOf<StatusItem>()

        for (doc in documentFiles) {
            if (!doc.isFile) continue
            val name = doc.name ?: continue
            if (name.startsWith(".nomedia") || name.startsWith(".")) continue

            val mimeType = doc.type ?: ""
            val ext = name.substringAfterLast('.', "").lowercase()

            val isImage = mimeType.startsWith(AppConstants.MIME_TYPE_IMAGE_PREFIX) ||
                    AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains(ext)
            val isVideo = mimeType.startsWith(AppConstants.MIME_TYPE_VIDEO_PREFIX) ||
                    AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)

            if (!isImage && !isVideo) continue

            val mediaType = if (isVideo) MediaType.VIDEO else MediaType.IMAGE
            val size = doc.length()
            val lastModified = doc.lastModified()

            items.add(
                StatusItem(
                    id = doc.uri.toString(),
                    title = name,
                    uri = doc.uri,
                    file = null,
                    mediaType = mediaType,
                    sizeBytes = size,
                    lastModified = if (lastModified > 0) lastModified else System.currentTimeMillis(),
                    source = source
                )
            )
        }

        return items.sortedByDescending { it.lastModified }
    }
}
