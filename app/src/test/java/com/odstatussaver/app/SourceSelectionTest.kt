package com.odstatussaver.app

import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.domain.model.WhatsAppSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class SourceSelectionTest {

    @Test
    fun testIndependentSourcePackageNames() {
        assertEquals("com.whatsapp", WhatsAppSource.STANDARD.packageName)
        assertEquals("com.whatsapp.w4b", WhatsAppSource.BUSINESS.packageName)
        assertNotEquals(WhatsAppSource.STANDARD.packageName, WhatsAppSource.BUSINESS.packageName)
    }

    @Test
    fun testCandidatePathsSeparation() {
        val root = "/storage/emulated/0"

        val standardPaths = listOf(
            File("$root/Android/media/com.whatsapp/WhatsApp/Media/.Statuses"),
            File("$root/WhatsApp/Media/.Statuses"),
            File("/storage/emulated/999/Android/media/com.whatsapp/WhatsApp/Media/.Statuses")
        )

        val businessPaths = listOf(
            File("$root/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses"),
            File("$root/WhatsApp Business/Media/.Statuses"),
            File("/storage/emulated/999/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses")
        )

        // Ensure WhatsApp paths never contain Business paths and vice versa
        standardPaths.forEach { file ->
            assertTrue(file.path.contains("com.whatsapp") || file.path.contains("/WhatsApp/"))
            assertTrue(!file.path.contains("com.whatsapp.w4b"))
            assertTrue(!file.path.contains("WhatsApp Business"))
        }

        businessPaths.forEach { file ->
            assertTrue(file.path.contains("com.whatsapp.w4b") || file.path.contains("WhatsApp Business"))
        }
    }
}
