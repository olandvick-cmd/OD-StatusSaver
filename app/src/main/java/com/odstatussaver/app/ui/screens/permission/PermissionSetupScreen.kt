package com.odstatussaver.app.ui.screens.permission

import android.Manifest
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import com.odstatussaver.app.R
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.odstatussaver.app.data.preferences.SafPrefStore
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.repository.StatusRepository
import kotlinx.coroutines.launch

@Composable
fun PermissionSetupScreen(
    repository: StatusRepository,
    prefStore: SafPrefStore,
    onSetupComplete: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var checking by remember { mutableStateOf(true) }
    var whatsappInstalled by remember { mutableStateOf(false) }
    var businessInstalled by remember { mutableStateOf(false) }
    var whatsappGranted by remember { mutableStateOf(false) }
    var businessGranted by remember { mutableStateOf(false) }
    var notificationsGranted by remember { mutableStateOf(false) }
    var notificationSkipped by remember { mutableStateOf(false) }
    var pendingSource by remember { mutableStateOf<WhatsAppSource?>(null) }

    fun isNotificationPermissionGranted(): Boolean {
        val enabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
        return enabled && (Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED)
    }

    suspend fun refreshPermissionState() {
        whatsappInstalled = repository.isPackageInstalled(WhatsAppSource.STANDARD)
        businessInstalled = repository.isPackageInstalled(WhatsAppSource.BUSINESS)
        whatsappGranted = !whatsappInstalled || repository.hasPermission(WhatsAppSource.STANDARD)
        businessGranted = !businessInstalled || repository.hasPermission(WhatsAppSource.BUSINESS)
        notificationsGranted = isNotificationPermissionGranted()
        notificationSkipped = prefStore.isNotificationPromptDismissed()
        checking = false
        if (whatsappGranted && businessGranted &&
            (notificationsGranted || notificationSkipped || Build.VERSION.SDK_INT < 33)
        ) {
            onSetupComplete()
        }
    }

    LaunchedEffect(Unit) {
        refreshPermissionState()
    }

    val notificationLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        notificationsGranted = granted && isNotificationPermissionGranted()
        scope.launch {
            prefStore.setNotificationPromptDismissed(!notificationsGranted)
            notificationSkipped = !notificationsGranted
            if (whatsappGranted && businessGranted) onSetupComplete()
        }
    }

    if (pendingSource != null) {
        SafGuideDialog(
            source = pendingSource!!,
            onDismiss = { pendingSource = null },
            onUriGranted = { uri ->
                val source = pendingSource ?: return@SafGuideDialog
                pendingSource = null
                scope.launch {
                    repository.saveGrantedTreeUri(source, uri)
                    refreshPermissionState()
                }
            }
        )
    }

    if (checking) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text("Preparing your app…", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 28.dp),
        verticalArrangement = Arrangement.Center
    ) {
        IconHeader()
        Text(
            text = "Let's get you set up",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "OD Status Saver needs access to the status folders you want to use. Set these up once and you're ready to go.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(24.dp))

        if (whatsappInstalled) {
            AccessRow(
                title = "WhatsApp",
                description = "Access statuses from your personal WhatsApp account.",
                granted = whatsappGranted,
                onClick = { pendingSource = WhatsAppSource.STANDARD }
            )
            Spacer(Modifier.height(12.dp))
        }
        if (businessInstalled) {
            AccessRow(
                title = "WhatsApp Business",
                description = "A separate folder permission for your Business account.",
                granted = businessGranted,
                onClick = { pendingSource = WhatsAppSource.BUSINESS }
            )
            Spacer(Modifier.height(12.dp))
        }
        AccessRow(
            title = "Notifications",
            description = if (notificationsGranted) {
                "Notifications are enabled on this device."
            } else {
                "Allow notifications so OD Status Saver can alert you when it has something useful to share."
            },
            granted = notificationsGranted,
            onClick = {
                if (Build.VERSION.SDK_INT >= 33) {
                    notificationLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                } else {
                    context.startActivity(
                        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                            .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    )
                }
            },
            optional = true
        )

        Spacer(Modifier.height(24.dp))
        val requiredFoldersGranted = whatsappGranted && businessGranted
        Button(
            onClick = onSetupComplete,
            enabled = requiredFoldersGranted && (notificationsGranted || notificationSkipped || Build.VERSION.SDK_INT < 33),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Continue to OD Status Saver")
        }
        if (!notificationsGranted && !notificationSkipped) {
            OutlinedButton(
                onClick = {
                    scope.launch {
                        prefStore.setNotificationPromptDismissed(true)
                        notificationSkipped = true
                        if (requiredFoldersGranted) onSetupComplete()
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Not now")
            }
        }
        Text(
            text = if (requiredFoldersGranted) {
                "Folder access is ready. Notifications are optional and can be enabled later in Android settings."
            } else {
                "Grant access to each installed WhatsApp app to continue. The two folders are kept separate."
            },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 12.dp)
        )
    }
}

@Composable
private fun IconHeader() {
    Image(
        painter = painterResource(R.mipmap.ic_launcher),
        contentDescription = "OD Status Saver",
        modifier = Modifier.padding(bottom = 18.dp).size(58.dp)
    )
}

@Composable
private fun AccessRow(
    title: String,
    description: String,
    granted: Boolean,
    onClick: () -> Unit,
    optional: Boolean = false
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            androidx.compose.material3.Icon(
                imageVector = when (title) {
                    "Notifications" -> Icons.Default.Notifications
                    else -> Icons.Default.Folder
                },
                contentDescription = null,
                tint = if (granted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(28.dp)
            )
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 12.dp)
            ) {
                Text(title, fontWeight = FontWeight.SemiBold)
                Text(
                    description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (granted) {
                androidx.compose.material3.Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Granted",
                    tint = MaterialTheme.colorScheme.primary
                )
            } else {
                OutlinedButton(onClick = onClick) {
                    Text(if (optional) "Enable" else "Grant")
                }
            }
        }
    }
}
