package com.odstatussaver.app.core.constants

import android.os.Environment

object AppConstants {
    // Official Package Names
    const val PACKAGE_WHATSAPP = "com.whatsapp"
    const val PACKAGE_WHATSAPP_BUSINESS = "com.whatsapp.w4b"

    // Storage Paths - Standard WhatsApp
    val LEGACY_PATH_WHATSAPP = "${Environment.getExternalStorageDirectory().absolutePath}/WhatsApp/Media/.Statuses"
    val MODERN_PATH_WHATSAPP = "${Environment.getExternalStorageDirectory().absolutePath}/Android/media/com.whatsapp/WhatsApp/Media/.Statuses"

    // Storage Paths - WhatsApp Business
    val LEGACY_PATH_WHATSAPP_BUSINESS = "${Environment.getExternalStorageDirectory().absolutePath}/WhatsApp Business/Media/.Statuses"
    val MODERN_PATH_WHATSAPP_BUSINESS = "${Environment.getExternalStorageDirectory().absolutePath}/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses"

    // MediaStore destination relative paths
    const val SAVE_DIR_PICTURES = "Pictures/ODStatusSaver"
    const val SAVE_DIR_MOVIES = "Movies/ODStatusSaver"

    // SAF Tree Document URI Segments for Deep Linking
    const val SAF_TREE_URI_WHATSAPP = "content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp%2FWhatsApp%2FMedia%2F.Statuses"
    const val SAF_TREE_URI_WHATSAPP_BUSINESS = "content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp.w4b%2FWhatsApp%20Business%2FMedia%2F.Statuses"

    // File Extensions & MIME Types
    val SUPPORTED_IMAGE_EXTENSIONS = setOf("jpg", "jpeg", "png", "webp")
    val SUPPORTED_VIDEO_EXTENSIONS = setOf("mp4", "3gp", "mkv")
    const val MIME_TYPE_IMAGE_PREFIX = "image/"
    const val MIME_TYPE_VIDEO_PREFIX = "video/"

    fun getMimeType(extension: String, isVideo: Boolean = false): String {
        return when (extension.lowercase()) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "webp" -> "image/webp"
            "mp4" -> "video/mp4"
            "3gp" -> "video/3gpp"
            "mkv" -> "video/x-matroska"
            else -> if (isVideo) "video/mp4" else "image/jpeg"
        }
    }

    // FileProvider Authority
    const val FILE_PROVIDER_AUTHORITY = "com.odstatussaver.app.fileprovider"
}
