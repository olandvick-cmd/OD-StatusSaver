package com.odstatussaver.app.ui.screens.settings

import android.content.Intent
import android.provider.Settings as AndroidSettings
import com.odstatussaver.app.BuildConfig
import androidx.compose.ui.platform.LocalContext

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.ui.screens.permission.SafGuideDialog
import com.odstatussaver.app.ui.viewmodel.StatusViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: StatusViewModel,
    onBack: () -> Unit,
    onShowAdPrivacyOptions: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var hasWhatsAppAccess by remember { mutableStateOf(false) }
    var hasBusinessAccess by remember { mutableStateOf(false) }
    var pendingSafSource by remember { mutableStateOf<WhatsAppSource?>(null) }
    val isAnalyticsEnabled by viewModel.isAnalyticsEnabled.collectAsState()

    LaunchedEffect(Unit) {
        hasWhatsAppAccess = viewModel.repository.hasPermission(WhatsAppSource.STANDARD)
        hasBusinessAccess = viewModel.repository.hasPermission(WhatsAppSource.BUSINESS)
    }

    if (pendingSafSource != null) {
        SafGuideDialog(
            source = pendingSafSource!!,
            onDismiss = {
                viewModel.onSafUriDenied(pendingSafSource!!)
                pendingSafSource = null
            },
            onUriGranted = { uri ->
                viewModel.onSafUriGranted(pendingSafSource!!, uri)
                coroutineScope.launch {
                    hasWhatsAppAccess = viewModel.repository.hasPermission(WhatsAppSource.STANDARD)
                    hasBusinessAccess = viewModel.repository.hasPermission(WhatsAppSource.BUSINESS)
                }
                pendingSafSource = null
            }
        )
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Settings & Privacy",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Privacy Assurance Card
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "100% On-Device & Privacy Guaranteed",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "OD Status Saver operates strictly on your local device. No phone numbers, contacts, media files, or file paths are ever uploaded to any server.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f),
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            // User Privacy & Analytics Consent Toggle
            Text(
                text = "Privacy & Diagnostics",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.primary
            )

            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Analytics,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Anonymous Analytics & Crash Reports",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                        }

                        Switch(
                            checked = isAnalyticsEnabled,
                            onCheckedChange = { viewModel.setAnalyticsEnabled(it) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = MaterialTheme.colorScheme.primary,
                                checkedTrackColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        )
                    }

                    Text(
                        text = "Shares anonymous operational metrics and crash dumps to help fix bugs across Android versions. No phone numbers, contacts, media filenames, or file paths are ever collected.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 16.sp
                    )

                    // Google UMP Ad Privacy Options Button
                    if (onShowAdPrivacyOptions != null) {
                        OutlinedButton(
                            onClick = onShowAdPrivacyOptions,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PrivacyTip,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Ad Privacy & Consent Choices (UMP)", fontSize = 12.sp)
                        }
                    }
                }
            }

            // Section: Independent Media Sources Configuration
            Text(
                text = "Media Sources & Folder Permissions",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.primary
            )

            // Standard WhatsApp Source
            SourceConfigCard(
                title = "Standard WhatsApp",
                icon = Icons.Default.Chat,
                isInstalled = viewModel.repository.isPackageInstalled(WhatsAppSource.STANDARD),
                hasAccess = hasWhatsAppAccess,
                candidatePaths = viewModel.getCandidateDirectories(WhatsAppSource.STANDARD).map { it.absolutePath },
                onGrantClick = { pendingSafSource = WhatsAppSource.STANDARD },
                onResetClick = {
                    viewModel.resetFolderPermission(WhatsAppSource.STANDARD)
                    coroutineScope.launch {
                        hasWhatsAppAccess = viewModel.repository.hasPermission(WhatsAppSource.STANDARD)
                    }
                }
            )

            // WhatsApp Business Source
            SourceConfigCard(
                title = "WhatsApp Business",
                icon = Icons.Default.Business,
                isInstalled = viewModel.repository.isPackageInstalled(WhatsAppSource.BUSINESS),
                hasAccess = hasBusinessAccess,
                candidatePaths = viewModel.getCandidateDirectories(WhatsAppSource.BUSINESS).map { it.absolutePath },
                onGrantClick = { pendingSafSource = WhatsAppSource.BUSINESS },
                onResetClick = {
                    viewModel.resetFolderPermission(WhatsAppSource.BUSINESS)
                    coroutineScope.launch {
                        hasBusinessAccess = viewModel.repository.hasPermission(WhatsAppSource.BUSINESS)
                    }
                }
            )

            // Save Destination Info
            Text(
                text = "Storage Save Destinations",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.primary
            )

            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Public Gallery Albums",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                    Text(
                        text = "• Photos: Pictures/ODStatusSaver\n• Videos: Movies/ODStatusSaver",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Saved files are indexed immediately and visible in Google Photos, Samsung Gallery, and File Managers.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Text(
                text = "Notifications & Downloads",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.primary
            )
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("New status notifications", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Text(
                        "Manage whether Android allows OD Status Saver to send notifications. New-status alerts are not active yet.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedButton(
                        onClick = {
                            context.startActivity(
                                Intent(AndroidSettings.ACTION_APP_NOTIFICATION_SETTINGS)
                                    .putExtra(AndroidSettings.EXTRA_APP_PACKAGE, context.packageName)
                            )
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Open notification settings", fontSize = 12.sp)
                    }
                    androidx.compose.material3.HorizontalDivider()
                    Text("Auto-download statuses", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Text(
                        "Automatic background downloads are not available yet. Your manual save and bulk-save features remain unchanged.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Text(
                text = "About",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.primary
            )
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("OD Status Saver", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Text("Version ${BuildConfig.VERSION_NAME}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
fun SourceConfigCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isInstalled: Boolean,
    hasAccess: Boolean,
    candidatePaths: List<String>,
    onGrantClick: () -> Unit,
    onResetClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }

                if (hasAccess) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "Connected", fontSize = 12.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Medium)
                    }
                } else {
                    Text(
                        text = if (isInstalled) "Permission Needed" else "Not Installed",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Text(
                text = "Probed Candidate Paths on This Device:",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                candidatePaths.take(2).forEach { path ->
                    Text(
                        text = "• $path",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (hasAccess) {
                    OutlinedButton(
                        onClick = onResetClick,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Reset Folder", fontSize = 12.sp)
                    }
                } else if (isInstalled) {
                    Button(
                        onClick = onGrantClick,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Grant Access", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
