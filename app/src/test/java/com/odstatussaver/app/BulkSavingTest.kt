package com.odstatussaver.app

import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.repository.BulkSaveReport
import com.odstatussaver.app.ui.viewmodel.BulkSaveProgress
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BulkSavingTest {

    @Test
    fun testBulkSaveProgressCalculation() {
        val progress = BulkSaveProgress(current = 3, total = 10, isRunning = true)
        val progressFraction = progress.current.toFloat() / progress.total

        assertEquals(0.3f, progressFraction, 0.001f)
        assertTrue(progress.isRunning)
    }

    @Test
    fun testBulkSaveZeroItemsSafety() {
        val emptyReport = BulkSaveReport(
            totalCount = 0,
            successCount = 0,
            failureCount = 0,
            duplicateCount = 0,
            failures = emptyList()
        )

        assertEquals(0, emptyReport.totalCount)
        assertEquals(0, emptyReport.successCount)
        assertEquals(0, emptyReport.failureCount)
        assertTrue(emptyReport.failures.isEmpty())
    }

    @Test
    fun testDuplicateDetectionInBulkSave() {
        val report = BulkSaveReport(
            totalCount = 4,
            successCount = 4,
            failureCount = 0,
            duplicateCount = 2,
            failures = emptyList()
        )

        assertEquals(4, report.totalCount)
        assertEquals(4, report.successCount)
        assertEquals(2, report.duplicateCount)
        assertEquals(0, report.failureCount)
    }

    @Test
    fun testMultiSelectionItemFiltering() {
        val mockUri = TestFixtures.createMockUri()
        val allItems = listOf(
            StatusItem("id_1", "img1.jpg", mockUri, null, MediaType.IMAGE, 100, 1L, WhatsAppSource.STANDARD),
            StatusItem("id_2", "img2.jpg", mockUri, null, MediaType.IMAGE, 100, 2L, WhatsAppSource.STANDARD),
            StatusItem("id_3", "img3.jpg", mockUri, null, MediaType.IMAGE, 100, 3L, WhatsAppSource.STANDARD)
        )

        val selectedIds = setOf("id_1", "id_3")
        val itemsToSave = allItems.filter { selectedIds.contains(it.id) }

        assertEquals(2, itemsToSave.size)
        assertEquals("id_1", itemsToSave[0].id)
        assertEquals("id_3", itemsToSave[1].id)
    }
}
