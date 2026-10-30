package com.odstatussaver.app.data.source

import android.content.Context
import androidx.core.net.toUri
import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import java.io.File

class DirectFileScanner(private val context: Context) {

    fun getCandidateDirectories(source: WhatsAppSource): List<File> {
        return when (source) {
            WhatsAppSource.STANDARD -> listOf(
                File(AppConstants.MODERN_PATH_WHATSAPP),
                File(AppConstants.LEGACY_PATH_WHATSAPP)
            )
            WhatsAppSource.BUSINESS -> listOf(
                File(AppConstants.MODERN_PATH_WHATSAPP_BUSINESS),
                File(AppConstants.LEGACY_PATH_WHATSAPP_BUSINESS)
            )
        }
    }

    /**
     * Checks if any direct status directory exists and can be listed directly.
     */
    fun canAccessDirectly(source: WhatsAppSource): Boolean {
        return try {
            val dir = getCandidateDirectories(source).firstOrNull { it.exists() && it.canRead() }
            val files = dir?.listFiles()
            files != null
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Scans direct files and maps them to StatusItem.
     */
    fun scan(source: WhatsAppSource): List<StatusItem> {
        val targetDir = getCandidateDirectories(source).firstOrNull { it.exists() && it.canRead() } ?: return emptyList()
        val files = targetDir.listFiles() ?: return emptyList()

        return files.filter { file ->
            file.isFile && !file.name.startsWith(".nomedia") && file.length() > 0 &&
                    (AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains(file.extension.lowercase()) ||
                            AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(file.extension.lowercase()))
        }.map { file ->
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
                source = source
            )
        }.sortedByDescending { it.lastModified }
    }
}
