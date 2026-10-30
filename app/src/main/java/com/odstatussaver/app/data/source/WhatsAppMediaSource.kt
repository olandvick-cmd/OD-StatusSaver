package com.odstatussaver.app.data.source

import android.content.Context
import android.os.Environment
import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.data.preferences.SafPrefStore
import com.odstatussaver.app.domain.model.WhatsAppSource
import java.io.File

class WhatsAppMediaSource(
    context: Context,
    prefStore: SafPrefStore
) : BaseStatusMediaSource(context, prefStore, WhatsAppSource.STANDARD) {

    override fun getCandidateDirectories(): List<File> {
        val root = Environment.getExternalStorageDirectory().absolutePath
        return listOf(
            // Modern Scoped Storage path (Android 10+)
            File("$root/Android/media/com.whatsapp/WhatsApp/Media/.Statuses"),
            // Legacy internal storage path (Android 8 - 9)
            File("$root/WhatsApp/Media/.Statuses"),
            // Dual Messenger / Cloned Profiles (e.g. Samsung / Xiaomi)
            File("/storage/emulated/999/Android/media/com.whatsapp/WhatsApp/Media/.Statuses"),
            File("/storage/emulated/999/WhatsApp/Media/.Statuses"),
            File("$root/DualApp/WhatsApp/Media/.Statuses")
        )
    }
}
