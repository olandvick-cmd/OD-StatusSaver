package com.odstatussaver.app.ui.viewmodel

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.odstatussaver.app.core.analytics.AnalyticsTracker
import com.odstatussaver.app.core.analytics.NoOpAnalyticsTracker
import com.odstatussaver.app.core.crashlytics.CrashReporter
import com.odstatussaver.app.data.preferences.SafPrefStore
import com.odstatussaver.app.data.source.SaveStatusOutcome
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.repository.BulkSaveReport
import com.odstatussaver.app.domain.repository.StatusRepository
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.File

enum class AppTab {
    WHATSAPP,
    WHATSAPP_BUSINESS,
    SAVED
}

data class BulkSaveProgress(
    val current: Int,
    val total: Int,
    val isRunning: Boolean = false
)

class StatusViewModel(
    val repository: StatusRepository,
    val prefStore: SafPrefStore? = null,
    val analyticsTracker: AnalyticsTracker = NoOpAnalyticsTracker(),
    val crashReporter: CrashReporter? = null
) : ViewModel() {

    private val _selectedTab = MutableStateFlow(AppTab.WHATSAPP)
    val selectedTab: StateFlow<AppTab> = _selectedTab.asStateFlow()

    private val _mediaFilter = MutableStateFlow("ALL") // "ALL", "IMAGES", "VIDEOS"
    val mediaFilter: StateFlow<String> = _mediaFilter.asStateFlow()

    // Multi-selection state
    private val _selectedStatusIds = MutableStateFlow<Set<String>>(emptySet())
    val selectedStatusIds: StateFlow<Set<String>> = _selectedStatusIds.asStateFlow()

    private val _bulkProgress = MutableStateFlow<BulkSaveProgress?>(null)
    val bulkProgress: StateFlow<BulkSaveProgress?> = _bulkProgress.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _isAnalyticsEnabled = MutableStateFlow(true)
    val isAnalyticsEnabled: StateFlow<Boolean> = _isAnalyticsEnabled.asStateFlow()

    private val _eventChannel = Channel<String>()
    val eventFlow = _eventChannel.receiveAsFlow()

    init {
        // Load analytics preference
        if (prefStore != null) {
            viewModelScope.launch {
                _isAnalyticsEnabled.value = prefStore.isAnalyticsEnabled()
            }
        }
    }

    val uiState: StateFlow<StatusUiState> = combine(
        _selectedTab,
        _mediaFilter
    ) { tab, filter ->
        Pair(tab, filter)
    }.flatMapLatest { (tab, filter) ->
        when (tab) {
            AppTab.WHATSAPP -> createSourceFlow(WhatsAppSource.STANDARD, filter)
            AppTab.WHATSAPP_BUSINESS -> createSourceFlow(WhatsAppSource.BUSINESS, filter)
            AppTab.SAVED -> createSavedFlow(filter)
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = StatusUiState.Loading
    )

    private fun createSourceFlow(source: WhatsAppSource, filter: String) = kotlinx.coroutines.flow.flow {
        emit(StatusUiState.Loading)

        if (!repository.isPackageInstalled(source)) {
            emit(StatusUiState.PackageNotInstalled(source))
            return@flow
        }

        if (!repository.hasPermission(source)) {
            emit(StatusUiState.PermissionRequired(source))
            return@flow
        }

        try {
            repository.getStatuses(source).collect { list ->
                val filtered = filterStatuses(list, filter)
                // Track list view event
                val sourceName = if (source == WhatsAppSource.BUSINESS) "whatsapp_business" else "whatsapp"
                analyticsTracker.logStatusListViewed(sourceName, filtered.size, filter)
                emit(StatusUiState.Success(statuses = filtered, filteredMediaType = filter))
            }
        } catch (e: SecurityException) {
            emit(StatusUiState.PermissionRequired(source))
        } catch (e: Exception) {
            crashReporter?.recordNonFatal("DISCOVERY_FAILURE", e)
            emit(StatusUiState.Error(e.localizedMessage ?: "Failed to read statuses"))
        }
    }

    private fun createSavedFlow(filter: String) = kotlinx.coroutines.flow.flow {
        emit(StatusUiState.Loading)
        repository.getSavedStatuses().collect { list ->
            val filtered = filterStatuses(list, filter)
            analyticsTracker.logStatusListViewed("saved", filtered.size, filter)
            emit(StatusUiState.Success(statuses = filtered, filteredMediaType = filter))
        }
    }

    private fun filterStatuses(list: List<StatusItem>, filter: String): List<StatusItem> {
        return when (filter) {
            "IMAGES" -> list.filter { it.mediaType == MediaType.IMAGE }
            "VIDEOS" -> list.filter { it.mediaType == MediaType.VIDEO }
            else -> list
        }
    }

    fun selectTab(tab: AppTab) {
        _selectedTab.value = tab
        clearSelection()
        val sourceStr = when (tab) {
            AppTab.WHATSAPP -> "whatsapp"
            AppTab.WHATSAPP_BUSINESS -> "whatsapp_business"
            AppTab.SAVED -> "saved"
        }
        analyticsTracker.logSourceSelected(sourceStr)
    }

    fun setMediaFilter(filter: String) {
        _mediaFilter.value = filter
        clearSelection()
    }

    fun logMediaPreview(status: StatusItem) {
        val sourceStr = if (status.source == WhatsAppSource.BUSINESS) "whatsapp_business" else "whatsapp"
        analyticsTracker.logMediaPreviewed(status.mediaType.name.lowercase(), sourceStr)
    }

    fun logHelpView(screenName: String) {
        analyticsTracker.logHelpOpened(screenName)
    }

    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            clearSelection()
            val currentTab = _selectedTab.value
            _selectedTab.value = currentTab
            _isRefreshing.value = false
            _eventChannel.send("Status cache refreshed")
        }
    }

    fun onSafUriGranted(source: WhatsAppSource, uri: Uri) {
        viewModelScope.launch {
            repository.saveGrantedTreeUri(source, uri)
            val sourceStr = if (source == WhatsAppSource.BUSINESS) "whatsapp_business" else "whatsapp"
            analyticsTracker.logPermissionFlowCompleted(sourceStr, granted = true)
            refresh()
        }
    }

    fun onSafUriDenied(source: WhatsAppSource) {
        val sourceStr = if (source == WhatsAppSource.BUSINESS) "whatsapp_business" else "whatsapp"
        analyticsTracker.logPermissionFlowCompleted(sourceStr, granted = false)
    }

    fun resetFolderPermission(source: WhatsAppSource) {
        viewModelScope.launch {
            repository.revokeFolderAccess(source)
            refresh()
            _eventChannel.send("Reset folder permission for ${source.displayName}")
        }
    }

    fun getCandidateDirectories(source: WhatsAppSource): List<File> {
        return repository.getCandidateDirectories(source)
    }

    // --- User Privacy & Analytics Consent ---

    fun setAnalyticsEnabled(enabled: Boolean) {
        _isAnalyticsEnabled.value = enabled
        analyticsTracker.setAnalyticsCollectionEnabled(enabled)
        crashReporter?.setCrashlyticsCollectionEnabled(enabled)
        if (prefStore != null) {
            viewModelScope.launch {
                prefStore.setAnalyticsEnabled(enabled)
                _eventChannel.send(if (enabled) "Analytics enabled" else "Analytics disabled")
            }
        }
    }

    // --- Multi-Selection Actions ---

    fun toggleSelection(id: String) {
        val current = _selectedStatusIds.value
        _selectedStatusIds.value = if (current.contains(id)) {
            current - id
        } else {
            current + id
        }
    }

    fun selectAll(statuses: List<StatusItem>) {
        _selectedStatusIds.value = statuses.map { it.id }.toSet()
    }

    fun clearSelection() {
        _selectedStatusIds.value = emptySet()
    }

    // --- Saving Actions ---

    fun saveStatus(item: StatusItem) {
        val sourceStr = if (item.source == WhatsAppSource.BUSINESS) "whatsapp_business" else "whatsapp"
        val mediaTypeStr = item.mediaType.name.lowercase()

        analyticsTracker.logSaveStarted(mediaTypeStr, sourceStr)

        viewModelScope.launch {
            when (val outcome = repository.saveStatus(item)) {
                is SaveStatusOutcome.Success -> {
                    analyticsTracker.logSaveCompleted(mediaTypeStr, sourceStr, outcome.isDuplicate)
                    _eventChannel.send("Saved to Pictures/ODStatusSaver")
                }
                is SaveStatusOutcome.Failure -> {
                    analyticsTracker.logSaveFailed(mediaTypeStr, sourceStr, outcome.error.name)
                    _eventChannel.send("Error: ${outcome.message}")
                }
            }
        }
    }

    fun saveSelectedStatuses(allStatuses: List<StatusItem>) {
        val selectedIds = _selectedStatusIds.value
        val itemsToSave = allStatuses.filter { selectedIds.contains(it.id) }
        if (itemsToSave.isEmpty()) return

        val sourceStr = if (_selectedTab.value == AppTab.WHATSAPP_BUSINESS) "whatsapp_business" else "whatsapp"

        viewModelScope.launch {
            _bulkProgress.value = BulkSaveProgress(0, itemsToSave.size, isRunning = true)
            val report = repository.saveStatuses(itemsToSave) { current, total, _ ->
                _bulkProgress.value = BulkSaveProgress(current, total, isRunning = true)
            }
            _bulkProgress.value = null
            clearSelection()

            analyticsTracker.logBulkSaveCompleted(
                totalCount = report.totalCount,
                successCount = report.successCount,
                failureCount = report.failureCount,
                source = sourceStr
            )

            val msg = if (report.failureCount == 0) {
                "Successfully saved ${report.successCount} statuses!"
            } else {
                "Saved ${report.successCount} of ${report.totalCount} (${report.failureCount} failed)."
            }
            _eventChannel.send(msg)
        }
    }

    fun deleteSavedStatus(item: StatusItem) {
        viewModelScope.launch {
            val result = repository.deleteSavedStatus(item)
            if (result.isSuccess) {
                _eventChannel.send("Deleted from saved gallery")
            } else {
                _eventChannel.send("Failed to delete media")
            }
        }
    }
}
