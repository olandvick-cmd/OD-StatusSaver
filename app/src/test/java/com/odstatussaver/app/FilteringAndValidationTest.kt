package com.odstatussaver.app

import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class FilteringAndValidationTest {

    private fun isAcceptedMedia(name: String, sizeBytes: Long): Boolean {
        if (sizeBytes <= 0) return false
        if (name.startsWith(".") || name.startsWith(".nomedia")) return false
        val ext = name.substringAfterLast('.', "").lowercase()
        return AppConstants.SUPPORTED_IMAGE_EXTENSIONS.contains(ext) ||
                AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)
    }

    @Test
    fun testValidImageAndVideoExtensions() {
        assertTrue(isAcceptedMedia("IMG-20261028-WA0001.jpg", 102400))
        assertTrue(isAcceptedMedia("IMG-20261028-WA0002.jpeg", 204800))
        assertTrue(isAcceptedMedia("IMG-20261028-WA0003.png", 512000))
        assertTrue(isAcceptedMedia("IMG-20261028-WA0004.webp", 89000))
        assertTrue(isAcceptedMedia("VID-20261028-WA0005.mp4", 5120000))
        assertTrue(isAcceptedMedia("VID-20261028-WA0006.3gp", 1240000))
    }

    @Test
    fun testRejectsHiddenAndNoMediaFiles() {
        assertFalse(isAcceptedMedia(".nomedia", 0))
        assertFalse(isAcceptedMedia(".nomedia", 100))
        assertFalse(isAcceptedMedia(".hidden_status.jpg", 102400))
        assertFalse(isAcceptedMedia(".temp_media.mp4", 5120000))
    }

    @Test
    fun testRejectsZeroByteCorruptFiles() {
        assertFalse(isAcceptedMedia("IMG-20261028-EMPTY.jpg", 0))
        assertFalse(isAcceptedMedia("VID-20261028-EMPTY.mp4", 0))
    }

    @Test
    fun testRejectsUnsupportedFileTypes() {
        assertFalse(isAcceptedMedia("document.pdf", 50000))
        assertFalse(isAcceptedMedia("script.sh", 2000))
        assertFalse(isAcceptedMedia("backup.apk", 15000000))
        assertFalse(isAcceptedMedia("archive.zip", 2000000))
        assertFalse(isAcceptedMedia("notes.txt", 1000))
    }

    @Test
    fun testMediaTypeClassification() {
        val jpgItem = StatusItem(
            id = "1", title = "photo.jpg", uri = TestFixtures.createMockUri(),
            mediaType = MediaType.IMAGE, sizeBytes = 100, lastModified = 1L, source = WhatsAppSource.STANDARD
        )
        val mp4Item = StatusItem(
            id = "2", title = "video.mp4", uri = TestFixtures.createMockUri(),
            mediaType = MediaType.VIDEO, sizeBytes = 200, lastModified = 2L, source = WhatsAppSource.BUSINESS
        )

        assertEquals(MediaType.IMAGE, jpgItem.mediaType)
        assertFalse(jpgItem.isVideo)

        assertEquals(MediaType.VIDEO, mp4Item.mediaType)
        assertTrue(mp4Item.isVideo)
    }
}
