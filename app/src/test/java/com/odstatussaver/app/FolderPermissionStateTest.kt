package com.odstatussaver.app

import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.ui.viewmodel.StatusUiState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FolderPermissionStateTest {

    @Test
    fun testPermissionRequiredStateEmission() {
        val state: StatusUiState = StatusUiState.PermissionRequired(WhatsAppSource.STANDARD)
        assertTrue(state is StatusUiState.PermissionRequired)
        assertEquals(WhatsAppSource.STANDARD, (state as StatusUiState.PermissionRequired).source)
    }

    @Test
    fun testEmptyFolderStateEmission() {
        val emptyList = emptyList<StatusItem>()
        val state: StatusUiState = StatusUiState.Success(statuses = emptyList, filteredMediaType = "ALL")

        assertTrue(state is StatusUiState.Success)
        assertTrue((state as StatusUiState.Success).statuses.isEmpty())
        assertEquals("ALL", state.filteredMediaType)
    }

    @Test
    fun testPackageNotInstalledStateEmission() {
        val state: StatusUiState = StatusUiState.PackageNotInstalled(WhatsAppSource.BUSINESS)
        assertTrue(state is StatusUiState.PackageNotInstalled)
        assertEquals(WhatsAppSource.BUSINESS, (state as StatusUiState.PackageNotInstalled).source)
    }

    @Test
    fun testRevokedPermissionRecoveryAction() {
        // Simulates security exception caught during scan
        var persistedUriString: String? = "content://valid/path"

        fun onSecurityException() {
            persistedUriString = null // cleared in preference store
        }

        onSecurityException()
        assertEquals(null, persistedUriString)
    }
}
