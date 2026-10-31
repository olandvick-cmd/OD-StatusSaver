package com.odstatussaver.app

import com.odstatussaver.app.data.source.SaveError
import com.odstatussaver.app.data.source.SaveStatusOutcome
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.FileNotFoundException

class ErrorHandlingTest {

    @Test
    fun testExpiredStatusClassification() {
        val exception = FileNotFoundException("Status file no longer exists")
        val errorOutcome = SaveStatusOutcome.Failure(
            SaveError.EXPIRED_OR_NOT_FOUND,
            "This status has expired or was removed by WhatsApp."
        )

        assertEquals(SaveError.EXPIRED_OR_NOT_FOUND, errorOutcome.error)
        assertTrue(errorOutcome.message.contains("expired"))
    }

    @Test
    fun testInsufficientStorageClassification() {
        val errorOutcome = SaveStatusOutcome.Failure(
            SaveError.INSUFFICIENT_STORAGE,
            "Not enough free storage space on device."
        )

        assertEquals(SaveError.INSUFFICIENT_STORAGE, errorOutcome.error)
        assertTrue(errorOutcome.message.contains("storage space"))
    }

    @Test
    fun testBulkSaveAccumulatesFailuresGracefully() {
        val total = 5
        val successes = 4
        val failures = listOf(
            Pair(
                StatusItem("id_expired", "expired.jpg", TestFixtures.createMockUri(), null, MediaType.IMAGE, 100, 1L, WhatsAppSource.STANDARD),
                "This status has expired or was removed by WhatsApp."
            )
        )

        val report = com.odstatussaver.app.domain.repository.BulkSaveReport(
            totalCount = total,
            successCount = successes,
            failureCount = failures.size,
            duplicateCount = 0,
            failures = failures
        )

        assertEquals(5, report.totalCount)
        assertEquals(4, report.successCount)
        assertEquals(1, report.failureCount)
        assertEquals("expired.jpg", report.failures.first().first.title)
    }
}
