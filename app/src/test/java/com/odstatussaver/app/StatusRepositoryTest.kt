package com.odstatussaver.app

import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StatusRepositoryTest {

    @Test
    fun testSupportedMediaExtensions() {
        // Verify only valid images and videos are allowed
        assertTrue(AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains("jpg"))
        assertTrue(AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains("jpeg"))
        assertTrue(AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains("png"))
        assertTrue(AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains("webp"))
        assertTrue(AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains("mp4"))
        assertTrue(AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains("3gp"))

        // Verify invalid or hidden files are rejected
        assertFalse(AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains("nomedia"))
        assertFalse(AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains("txt"))
        assertFalse(AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains("apk"))
    }

    @Test
    fun testStatusItemVideoDetection() {
        val imageItem = StatusItem(
            id = "test_image",
            title = "status_1.jpg",
            uri = TestFixtures.createMockUri(),
            mediaType = MediaType.IMAGE,
            sizeBytes = 1024,
            lastModified = 1000L,
            source = WhatsAppSource.STANDARD
        )

        val videoItem = StatusItem(
            id = "test_video",
            title = "status_video.mp4",
            uri = TestFixtures.createMockUri(),
            mediaType = MediaType.VIDEO,
            sizeBytes = 20480,
            lastModified = 2000L,
            source = WhatsAppSource.BUSINESS
        )

        assertFalse(imageItem.isVideo)
        assertTrue(videoItem.isVideo)
        assertEquals("jpg", imageItem.extension)
        assertEquals("mp4", videoItem.extension)
    }

    @Test
    fun testWhatsAppSourceIsolation() {
        assertEquals("com.whatsapp", WhatsAppSource.STANDARD.packageName)
        assertEquals("com.whatsapp.w4b", WhatsAppSource.BUSINESS.packageName)
        assertEquals("WhatsApp", WhatsAppSource.STANDARD.displayName)
        assertEquals("WA Business", WhatsAppSource.BUSINESS.displayName)
    }
}
