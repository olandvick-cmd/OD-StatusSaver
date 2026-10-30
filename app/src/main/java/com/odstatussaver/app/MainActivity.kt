package com.odstatussaver.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.odstatussaver.app.core.ads.AdsManager
import com.odstatussaver.app.core.ads.ConsentManager
import com.odstatussaver.app.core.theme.ODStatusSaverTheme
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.ui.screens.home.HomeScreen
import com.odstatussaver.app.ui.screens.settings.SettingsScreen
import com.odstatussaver.app.ui.screens.viewer.MediaViewerScreen
import com.odstatussaver.app.ui.viewmodel.StatusUiState
import com.odstatussaver.app.ui.viewmodel.StatusViewModel

class MainActivity : ComponentActivity() {

    lateinit var consentManager: ConsentManager
        private set

    lateinit var adsManager: AdsManager
        private set

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as ODStatusSaverApp
        val viewModel = StatusViewModel(
            repository = app.statusRepository,
            prefStore = app.safPrefStore,
            analyticsTracker = app.analyticsTracker,
            crashReporter = app.crashReporter
        )

        // Initialize Google UMP Consent & AdMob
        consentManager = ConsentManager(this)
        adsManager = AdsManager(this, app.analyticsTracker)

        consentManager.requestConsent(this) { canRequestAds ->
            if (canRequestAds) {
                adsManager.initialize(this)
            }
        }

        setContent {
            ODStatusSaverTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var selectedStatusId by rememberSaveable { mutableStateOf<String?>(null) }
                    var isSettingsOpen by rememberSaveable { mutableStateOf(false) }

                    val uiState by viewModel.uiState.collectAsState()

                    val activeStatusItem: StatusItem? = androidx.compose.runtime.remember(selectedStatusId, uiState) {
                        if (selectedStatusId != null && uiState is StatusUiState.Success) {
                            (uiState as StatusUiState.Success).statuses.find { it.id == selectedStatusId }
                        } else null
                    }

                    when {
                        isSettingsOpen -> {
                            SettingsScreen(
                                viewModel = viewModel,
                                onBack = { isSettingsOpen = false },
                                onShowAdPrivacyOptions = {
                                    consentManager.showPrivacyOptionsForm(this@MainActivity) {}
                                }
                            )
                        }
                        activeStatusItem != null -> {
                            val status = activeStatusItem
                            MediaViewerScreen(
                                status = status,
                                onBack = {
                                    // When closing viewer after saving, check sensible frequency cap
                                    adsManager.onMediaSaved(this@MainActivity) {
                                        selectedStatusId = null
                                    }
                                },
                                onSave = {
                                    viewModel.saveStatus(status)
                                },
                                onShare = {
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = if (status.isVideo) "video/*" else "image/*"
                                        putExtra(Intent.EXTRA_STREAM, status.uri)
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    }
                                    startActivity(Intent.createChooser(shareIntent, "Share Status"))
                                },
                                onRepost = {
                                    val repostIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = if (status.isVideo) "video/*" else "image/*"
                                        putExtra(Intent.EXTRA_STREAM, status.uri)
                                        setPackage(status.source.packageName)
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    }
                                    try {
                                        startActivity(repostIntent)
                                    } catch (e: Exception) {
                                        startActivity(Intent.createChooser(repostIntent, "Repost to ${status.source.displayName}"))
                                    }
                                }
                            )
                        }
                        else -> {
                            HomeScreen(
                                viewModel = viewModel,
                                onStatusClick = { status ->
                                    viewModel.logMediaPreview(status)
                                    selectedStatusId = status.id
                                },
                                onSettingsClick = {
                                    viewModel.logHelpView("settings")
                                    isSettingsOpen = true
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
