package com.odstatussaver.app.domain.model

import android.net.Uri
import java.io.File

/**
 * Domain representation of a viewed WhatsApp status item.
 */
data class StatusItem(
    val id: String,
    val title: String,
    val uri: Uri,
    val file: File? = null,
    val mediaType: MediaType,
    val sizeBytes: Long,
    val lastModified: Long,
    val source: WhatsAppSource,
    val isSaved: Boolean = false,
    val savedUri: Uri? = null
) {
    val isVideo: Boolean
        get() = mediaType == MediaType.VIDEO

    val extension: String
        get() = title.substringAfterLast('.', "")
}
