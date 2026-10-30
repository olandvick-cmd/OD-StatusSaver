package com.odstatussaver.app.ui.screens.home

import android.content.Intent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.ui.components.AdMobBanner
import com.odstatussaver.app.ui.screens.status.StatusGridScreen
import com.odstatussaver.app.ui.viewmodel.AppTab
import com.odstatussaver.app.ui.viewmodel.StatusViewModel
import kotlinx.coroutines.flow.collectLatest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: StatusViewModel,
    onStatusClick: (StatusItem) -> Unit,
    onSettingsClick: () -> Unit
) {
    val context = LocalContext.current
    val selectedTab by viewModel.selectedTab.collectAsState()
    val mediaFilter by viewModel.mediaFilter.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val selectedIds by viewModel.selectedStatusIds.collectAsState()
    val bulkProgress by viewModel.bulkProgress.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        viewModel.eventFlow.collectLatest { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "OD Status Saver",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    IconButton(onClick = onSettingsClick) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Source Tabs: WhatsApp, WhatsApp Business, Saved
            PrimaryTabRow(
                selectedTabIndex = selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                Tab(
                    selected = selectedTab == AppTab.WHATSAPP,
                    onClick = { viewModel.selectTab(AppTab.WHATSAPP) },
                    text = { Text("WhatsApp") },
                    icon = { Icon(Icons.Default.Chat, contentDescription = null) }
                )
                Tab(
                    selected = selectedTab == AppTab.WHATSAPP_BUSINESS,
                    onClick = { viewModel.selectTab(AppTab.WHATSAPP_BUSINESS) },
                    text = { Text("WA Business") },
                    icon = { Icon(Icons.Default.Business, contentDescription = null) }
                )
                Tab(
                    selected = selectedTab == AppTab.SAVED,
                    onClick = { viewModel.selectTab(AppTab.SAVED) },
                    text = { Text("Saved") },
                    icon = { Icon(Icons.Default.Bookmark, contentDescription = null) }
                )
            }

            // Grid Content (weight 1f keeps banner cleanly separated at bottom)
            StatusGridScreen(
                uiState = uiState,
                currentFilter = mediaFilter,
                selectedIds = selectedIds,
                bulkProgress = bulkProgress,
                onFilterChanged = { viewModel.setMediaFilter(it) },
                onStatusClick = onStatusClick,
                onStatusLongClick = { status -> viewModel.toggleSelection(status.id) },
                onToggleSelect = { id -> viewModel.toggleSelection(id) },
                onSelectAll = { list -> viewModel.selectAll(list) },
                onClearSelection = { viewModel.clearSelection() },
                onSaveStatus = { viewModel.saveStatus(it) },
                onSaveSelected = { list -> viewModel.saveSelectedStatuses(list) },
                onShareStatus = { status ->
                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                        type = if (status.isVideo) "video/*" else "image/*"
                        putExtra(Intent.EXTRA_STREAM, status.uri)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                    context.startActivity(Intent.createChooser(shareIntent, "Share Status"))
                },
                onDeleteStatus = if (selectedTab == AppTab.SAVED) {
                    { status -> viewModel.deleteSavedStatus(status) }
                } else null,
                onSafUriGranted = { source, uri ->
                    viewModel.onSafUriGranted(source, uri)
                },
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.weight(1f)
            )

            // Policy-Compliant Bottom Banner Placement
            AdMobBanner()
        }
    }
}
