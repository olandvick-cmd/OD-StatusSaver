package com.odstatussaver.app.ui.viewmodel

import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource

sealed interface StatusUiState {
    object Loading : StatusUiState
    data class PackageNotInstalled(val source: WhatsAppSource) : StatusUiState
    data class PermissionRequired(val source: WhatsAppSource) : StatusUiState
    data class Success(
        val statuses: List<StatusItem>,
        val filteredMediaType: String = "ALL" // "ALL", "IMAGES", "VIDEOS"
    ) : StatusUiState
    data class Error(val message: String) : StatusUiState
}
