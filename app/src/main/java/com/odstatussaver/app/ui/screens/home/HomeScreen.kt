package com.odstatussaver.app.ui.screens.home

import android.content.Intent
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import com.odstatussaver.app.R
import com.odstatussaver.app.domain.model.StatusItem
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
        viewModel.eventFlow.collectLatest { message -> snackbarHostState.showSnackbar(message) }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Image(
                            painter = painterResource(R.mipmap.ic_launcher),
                            contentDescription = "OD Status Saver",
                            modifier = Modifier.size(34.dp).clip(CircleShape)
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
                            Text("OD Status Saver", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text(
                                "Save • View • Share",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh statuses")
                    }
                    IconButton(onClick = onSettingsClick) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(innerPadding)
        ) {
            PrimaryTabRow(
                selectedTabIndex = selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = MaterialTheme.colorScheme.primary,
                divider = {}
            ) {
                Tab(
                    selected = selectedTab == AppTab.WHATSAPP,
                    onClick = { viewModel.selectTab(AppTab.WHATSAPP) },
                    text = { Text("WhatsApp", fontWeight = if (selectedTab == AppTab.WHATSAPP) FontWeight.SemiBold else FontWeight.Normal) }
                )
                Tab(
                    selected = selectedTab == AppTab.WHATSAPP_BUSINESS,
                    onClick = { viewModel.selectTab(AppTab.WHATSAPP_BUSINESS) },
                    text = { Text("Business", fontWeight = if (selectedTab == AppTab.WHATSAPP_BUSINESS) FontWeight.SemiBold else FontWeight.Normal) }
                )
                Tab(
                    selected = selectedTab == AppTab.SAVED,
                    onClick = { viewModel.selectTab(AppTab.SAVED) },
                    text = { Text("Saved", fontWeight = if (selectedTab == AppTab.SAVED) FontWeight.SemiBold else FontWeight.Normal) }
                )
            }

            StatusGridScreen(
                uiState = uiState,
                currentFilter = mediaFilter,
                selectedIds = selectedIds,
                bulkProgress = bulkProgress,
                onFilterChanged = { viewModel.setMediaFilter(it) },
                onStatusClick = { status ->
                    viewModel.logMediaPreview(status)
                    onStatusClick(status)
                },
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
                onSafUriGranted = { source, uri -> viewModel.onSafUriGranted(source, uri) },
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.weight(1f)
            )
            AdMobBanner()
        }
    }
}
