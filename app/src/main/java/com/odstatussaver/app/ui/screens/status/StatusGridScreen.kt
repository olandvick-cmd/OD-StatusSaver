package com.odstatussaver.app.ui.screens.status

import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.SelectAll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.ui.components.StatusCard
import com.odstatussaver.app.ui.screens.permission.SafGuideDialog
import com.odstatussaver.app.ui.viewmodel.BulkSaveProgress
import com.odstatussaver.app.ui.viewmodel.StatusUiState

@Composable
fun StatusGridScreen(
    uiState: StatusUiState,
    currentFilter: String,
    selectedIds: Set<String>,
    bulkProgress: BulkSaveProgress?,
    onFilterChanged: (String) -> Unit,
    onStatusClick: (StatusItem) -> Unit,
    onStatusLongClick: (StatusItem) -> Unit,
    onToggleSelect: (String) -> Unit,
    onSelectAll: (List<StatusItem>) -> Unit,
    onClearSelection: () -> Unit,
    onSaveStatus: (StatusItem) -> Unit,
    onSaveSelected: (List<StatusItem>) -> Unit,
    onShareStatus: (StatusItem) -> Unit,
    onDeleteStatus: ((StatusItem) -> Unit)? = null,
    onSafUriGranted: (WhatsAppSource, Uri) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    var pendingPermissionSource by remember { mutableStateOf<WhatsAppSource?>(null) }
    val isSelectionMode = selectedIds.isNotEmpty()

    if (pendingPermissionSource != null) {
        SafGuideDialog(
            source = pendingPermissionSource!!,
            onDismiss = { pendingPermissionSource = null },
            onUriGranted = { uri ->
                onSafUriGranted(pendingPermissionSource!!, uri)
                pendingPermissionSource = null
            }
        )
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Bulk progress indicator if saving multiple items
        if (bulkProgress != null && bulkProgress.isRunning) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.primaryContainer)
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Saving to Gallery...",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = "${bulkProgress.current} / ${bulkProgress.total}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                LinearProgressIndicator(
                    progress = { if (bulkProgress.total > 0) bulkProgress.current.toFloat() / bulkProgress.total else 0f },
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        // Filter Chips Row (or Multi-Select Bar)
        if (isSelectionMode) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onClearSelection, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(18.dp))
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${selectedIds.size} Selected",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (uiState is StatusUiState.Success) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { onSelectAll(uiState.statuses) },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Select All", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
                        }

                        Button(
                            onClick = { onSaveSelected(uiState.statuses) },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Save (${selectedIds.size})", fontSize = 11.sp)
                        }
                    }
                }
            }
        } else {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = currentFilter == "ALL",
                    onClick = { onFilterChanged("ALL") },
                    label = { Text("All Media") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
                FilterChip(
                    selected = currentFilter == "IMAGES",
                    onClick = { onFilterChanged("IMAGES") },
                    label = { Text("Images") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
                FilterChip(
                    selected = currentFilter == "VIDEOS",
                    onClick = { onFilterChanged("VIDEOS") },
                    label = { Text("Videos") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
            }
        }

        // Screen Body State
        Box(modifier = Modifier.fillMaxSize()) {
            when (uiState) {
                is StatusUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
                is StatusUiState.PackageNotInstalled -> {
                    EmptyMessageView(
                        icon = Icons.Default.Info,
                        title = "${uiState.source.displayName} is Not Installed",
                        description = "Please install ${uiState.source.displayName} from Google Play to view and save contact statuses.",
                        buttonText = "Check Again",
                        onButtonClick = onRefresh
                    )
                }
                is StatusUiState.PermissionRequired -> {
                    EmptyMessageView(
                        icon = Icons.Default.FolderOpen,
                        title = "Storage Permission Required",
                        description = "Grant folder permission to load statuses from ${uiState.source.displayName} via the Android document picker.",
                        buttonText = "Grant Folder Access",
                        onButtonClick = { pendingPermissionSource = uiState.source }
                    )
                }
                is StatusUiState.Error -> {
                    EmptyMessageView(
                        icon = Icons.Default.Info,
                        title = "Unable to load statuses",
                        description = uiState.message,
                        buttonText = "Try Again",
                        onButtonClick = onRefresh
                    )
                }
                is StatusUiState.Success -> {
                    if (uiState.statuses.isEmpty()) {
                        EmptyMessageView(
                            icon = Icons.Default.PhotoLibrary,
                            title = "No Statuses Found",
                            description = "Open WhatsApp, view your contacts' statuses, then refresh this screen to save them.",
                            buttonText = "Refresh Gallery",
                            onButtonClick = onRefresh
                        )
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Adaptive(minSize = 150.dp),
                            contentPadding = PaddingValues(16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(
                                items = uiState.statuses,
                                key = { it.id }
                            ) { status ->
                                val isSelected = selectedIds.contains(status.id)
                                StatusCard(
                                    status = status,
                                    isSelected = isSelected,
                                    isSelectionMode = isSelectionMode,
                                    onClick = {
                                        if (isSelectionMode) {
                                            onToggleSelect(status.id)
                                        } else {
                                            onStatusClick(status)
                                        }
                                    },
                                    onLongClick = {
                                        onToggleSelect(status.id)
                                    },
                                    onSaveClick = { onSaveStatus(status) },
                                    onShareClick = { onShareStatus(status) },
                                    onDeleteClick = onDeleteStatus?.let { callback -> { callback(status) } }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
