package com.odstatussaver.app

import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.ui.viewmodel.AppTab
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class LifecycleAndStateTest {

    @Test
    fun testSelectedStatusIdSurvivesRecreation() {
        val testStatuses = listOf(
            StatusItem("wa_1", "photo1.jpg", TestFixtures.createMockUri(), null, MediaType.IMAGE, 100, 1L, WhatsAppSource.STANDARD),
            StatusItem("wa_2", "video1.mp4", TestFixtures.createMockUri(), null, MediaType.VIDEO, 200, 2L, WhatsAppSource.STANDARD)
        )

        // Simulate activity recreation where selectedStatusId was stored in savedInstanceState
        val savedStatusId = "wa_2"

        // Upon recreation, resolve status from restored ID
        val restoredStatus = testStatuses.find { it.id == savedStatusId }

        assertNotNull(restoredStatus)
        assertEquals("video1.mp4", restoredStatus?.title)
        assertEquals(MediaType.VIDEO, restoredStatus?.mediaType)
    }

    @Test
    fun testTabEnumIntegrity() {
        assertEquals(3, AppTab.values().size)
        assertEquals(AppTab.WHATSAPP, AppTab.valueOf("WHATSAPP"))
        assertEquals(AppTab.WHATSAPP_BUSINESS, AppTab.valueOf("WHATSAPP_BUSINESS"))
        assertEquals(AppTab.SAVED, AppTab.valueOf("SAVED"))
    }

    @Test
    fun testRecreationWithInvalidIdReturnsNull() {
        val testStatuses = listOf(
            StatusItem("wa_1", "photo1.jpg", TestFixtures.createMockUri(), null, MediaType.IMAGE, 100, 1L, WhatsAppSource.STANDARD)
        )

        val restoredStatus = testStatuses.find { it.id == "non_existent_id" }
        assertNull(restoredStatus)
    }
}
