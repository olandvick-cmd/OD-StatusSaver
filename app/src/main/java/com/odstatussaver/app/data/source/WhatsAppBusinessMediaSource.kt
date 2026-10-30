package com.odstatussaver.app.data.source

import android.content.Context
import android.os.Environment
import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.data.preferences.SafPrefStore
import com.odstatussaver.app.domain.model.WhatsAppSource
import java.io.File

class WhatsAppBusinessMediaSource(
    context: Context,
    prefStore: SafPrefStore
) : BaseStatusMediaSource(context, prefStore, WhatsAppSource.BUSINESS) {

    override fun getCandidateDirectories(): List<File> {
        val root = Environment.getExternalStorageDirectory().absolutePath
        return listOf(
            // Modern Scoped Storage path (Android 10+)
            File("$root/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses"),
            // Legacy internal storage path (Android 8 - 9)
            File("$root/WhatsApp Business/Media/.Statuses"),
            // Dual Messenger / Cloned Profiles
            File("/storage/emulated/999/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses"),
            File("/storage/emulated/999/WhatsApp Business/Media/.Statuses"),
            File("$root/DualApp/WhatsApp Business/Media/.Statuses")
        )
    }
}
