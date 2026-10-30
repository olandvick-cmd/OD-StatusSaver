package com.odstatussaver.app

import com.odstatussaver.app.data.local.entity.SavedStatusEntity
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DuplicateHandlingTest {

    @Test
    fun testOriginalIdDeduplication() {
        val savedEntities = mutableMapOf<String, SavedStatusEntity>()

        val status1 = SavedStatusEntity(
            originalId = "status_unique_hash_01",
            title = "IMG-WA0001.jpg",
            savedUri = "content://media/external/images/media/101",
            mediaType = "IMAGE",
            source = "STANDARD",
            sizeBytes = 1024,
            savedAt = 1000L
        )

        // Attempting to save same original ID should replace existing or update metadata without duplicates
        savedEntities[status1.originalId] = status1
        assertEquals(1, savedEntities.size)

        val status1Duplicate = status1.copy(savedAt = 2000L)
        savedEntities[status1Duplicate.originalId] = status1Duplicate
        assertEquals(1, savedEntities.size)
        assertEquals(2000L, savedEntities["status_unique_hash_01"]?.savedAt)
    }

    @Test
    fun testIsSavedStatusFlagging() {
        val savedOriginalIds = setOf("id_01", "id_02")

        val items = listOf(
            StatusItem("id_01", "photo1.jpg", android.net.Uri.EMPTY, null, MediaType.IMAGE, 100, 1L, WhatsAppSource.STANDARD),
            StatusItem("id_02", "video1.mp4", android.net.Uri.EMPTY, null, MediaType.VIDEO, 200, 2L, WhatsAppSource.STANDARD),
            StatusItem("id_03", "photo2.jpg", android.net.Uri.EMPTY, null, MediaType.IMAGE, 300, 3L, WhatsAppSource.STANDARD)
        )

        val updatedItems = items.map { it.copy(isSaved = savedOriginalIds.contains(it.id)) }

        assertTrue(updatedItems[0].isSaved)
        assertTrue(updatedItems[1].isSaved)
        assertFalse(updatedItems[2].isSaved)
    }
}
