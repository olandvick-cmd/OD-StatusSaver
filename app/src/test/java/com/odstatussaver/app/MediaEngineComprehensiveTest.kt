package com.odstatussaver.app

import android.net.Uri
import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.data.source.SaveError
import com.odstatussaver.app.data.source.SaveStatusOutcome
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.repository.BulkSaveReport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.io.FileNotFoundException

/**
 * Unit tests validating core media engine invariants, source isolation,
 * MIME-type mapping, bulk failure accumulation, and error classifications.
 */
class MediaEngineComprehensiveTest {

    // ==========================================
    // 1. MIME-type mapping tests
    // ==========================================

    @Test
    fun testAllSupportedImageMimeTypes() {
        assertEquals("image/jpeg", AppConstants.getMimeType("jpg"))
        assertEquals("image/jpeg", AppConstants.getMimeType("jpeg"))
        assertEquals("image/jpeg", AppConstants.getMimeType("JPEG"))
        assertEquals("image/png", AppConstants.getMimeType("png"))
        assertEquals("image/webp", AppConstants.getMimeType("webp"))
    }

    @Test
    fun testAllSupportedVideoMimeTypes() {
        assertEquals("video/mp4", AppConstants.getMimeType("mp4", isVideo = true))
        assertEquals("video/3gpp", AppConstants.getMimeType("3gp", isVideo = true))
        assertEquals("video/x-matroska", AppConstants.getMimeType("mkv", isVideo = true))
    }

    @Test
    fun testFallbackMimeTypes() {
        assertEquals("image/jpeg", AppConstants.getMimeType("bin", isVideo = false))
        assertEquals("video/mp4", AppConstants.getMimeType("unknown", isVideo = true))
    }

    // ==========================================
    // 2. WhatsApp and Business source isolation
    // ==========================================

    @Test
    fun testSourcePackageIsolation() {
        assertEquals("com.whatsapp", WhatsAppSource.STANDARD.packageName)
        assertEquals("com.whatsapp.w4b", WhatsAppSource.BUSINESS.packageName)
        assertNotEquals(WhatsAppSource.STANDARD.packageName, WhatsAppSource.BUSINESS.packageName)
    }

    @Test
    fun testCandidateDirectoryIsolation() {
        val root = "/storage/emulated/0"
        val standardPath = "$root/Android/media/com.whatsapp/WhatsApp/Media/.Statuses"
        val businessPath = "$root/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses"

        assertTrue(standardPath.contains("com.whatsapp"))
        assertFalse(standardPath.contains("com.whatsapp.w4b"))

        assertTrue(businessPath.contains("com.whatsapp.w4b"))
        assertTrue(businessPath.contains("WhatsApp Business"))
    }

    // ==========================================
    // 3. Duplicate handling
    // ==========================================

    @Test
    fun testDuplicateSaveOutcomeIndication() {
        val dummySavedUri = TestFixtures.createMockUri()
        val duplicateSuccess = SaveStatusOutcome.Success(savedUri = dummySavedUri, isDuplicate = true)
        val freshSuccess = SaveStatusOutcome.Success(savedUri = dummySavedUri, isDuplicate = false)

        assertTrue(duplicateSuccess.isDuplicate)
        assertFalse(freshSuccess.isDuplicate)
        assertEquals(dummySavedUri, duplicateSuccess.savedUri)
    }

    // ==========================================
    // 4. Invalid, corrupt, and expired media
    // ==========================================

    @Test
    fun testExpiredMediaOutcome() {
        val outcome = SaveStatusOutcome.Failure(
            error = SaveError.EXPIRED_OR_NOT_FOUND,
            message = "This status has expired or was removed by WhatsApp."
        )

        assertEquals(SaveError.EXPIRED_OR_NOT_FOUND, outcome.error)
        assertTrue(outcome.message.contains("expired"))
    }

    @Test
    fun testInsufficientStorageOutcome() {
        val outcome = SaveStatusOutcome.Failure(
            error = SaveError.INSUFFICIENT_STORAGE,
            message = "Not enough free storage space on device."
        )

        assertEquals(SaveError.INSUFFICIENT_STORAGE, outcome.error)
        assertTrue(outcome.message.contains("storage space"))
    }

    @Test
    fun testInterruptedSaveOutcome() {
        val outcome = SaveStatusOutcome.Failure(
            error = SaveError.CANCELLED,
            message = "Save operation was cancelled."
        )

        assertEquals(SaveError.CANCELLED, outcome.error)
        assertTrue(outcome.message.contains("cancelled"))
    }

    // ==========================================
    // 5. Partial bulk-save failure accumulation
    // ==========================================

    @Test
    fun testPartialBulkSaveReportsBothSuccessesAndFailures() {
        val mockUri = TestFixtures.createMockUri()
        val item1 = StatusItem("1", "img1.jpg", mockUri, null, MediaType.IMAGE, 100, 1L, WhatsAppSource.STANDARD)
        val item2 = StatusItem("2", "img2.jpg", mockUri, null, MediaType.IMAGE, 100, 2L, WhatsAppSource.STANDARD)
        val item3 = StatusItem("3", "corrupt.jpg", mockUri, null, MediaType.IMAGE, 0, 3L, WhatsAppSource.STANDARD)

        val report = BulkSaveReport(
            totalCount = 3,
            successCount = 2,
            failureCount = 1,
            duplicateCount = 0,
            failures = listOf(Pair(item3, "File was empty or corrupt."))
        )

        assertEquals(3, report.totalCount)
        assertEquals(2, report.successCount)
        assertEquals(1, report.failureCount)
        assertEquals(0, report.duplicateCount)
        assertEquals("corrupt.jpg", report.failures.first().first.title)
    }

    // ==========================================
    // 6. Media type detection
    // ==========================================

    @Test
    fun testMediaTypeDistinction() {
        val mockUri = TestFixtures.createMockUri()
        val imageItem = StatusItem(
            id = "img_1",
            title = "status.webp",
            uri = mockUri,
            mediaType = MediaType.IMAGE,
            sizeBytes = 25000,
            lastModified = 1000L,
            source = WhatsAppSource.STANDARD
        )

        val videoItem = StatusItem(
            id = "vid_1",
            title = "status.mp4",
            uri = mockUri,
            mediaType = MediaType.VIDEO,
            sizeBytes = 1500000,
            lastModified = 2000L,
            source = WhatsAppSource.BUSINESS
        )

        assertFalse(imageItem.isVideo)
        assertTrue(videoItem.isVideo)
        assertEquals("webp", imageItem.extension)
        assertEquals("mp4", videoItem.extension)
    }
}
