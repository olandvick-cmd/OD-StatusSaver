package com.odstatussaver.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.odstatussaver.app.core.analytics.AnalyticsTracker
import com.odstatussaver.app.core.analytics.FirebaseAnalyticsTracker
import com.odstatussaver.app.core.crashlytics.CrashReporter
import com.odstatussaver.app.core.crashlytics.FirebaseCrashReporter
import com.odstatussaver.app.data.local.database.AppDatabase
import com.odstatussaver.app.data.preferences.SafPrefStore
import com.odstatussaver.app.data.repository.StatusRepositoryImpl
import com.odstatussaver.app.data.source.MediaStoreSaver
import com.odstatussaver.app.domain.repository.StatusRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * OD Status Saver Application instance.
 * Initializes local repositories, Room database, DataStore, and Firebase telemetry.
 */
class ODStatusSaverApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var safPrefStore: SafPrefStore
        private set

    lateinit var statusRepository: StatusRepository
        private set

    lateinit var analyticsTracker: AnalyticsTracker
        private set

    lateinit var crashReporter: CrashReporter
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()

        // Initialize local Room DB
        database = AppDatabase.getDatabase(this)

        // Initialize DataStore for SAF URI & Privacy preferences
        safPrefStore = SafPrefStore(this)

        // Initialize Telemetry Trackers
        analyticsTracker = FirebaseAnalyticsTracker(this)
        crashReporter = FirebaseCrashReporter()

        // Apply saved user analytics consent preference
        CoroutineScope(Dispatchers.IO).launch {
            val enabled = safPrefStore.isAnalyticsEnabled()
            analyticsTracker.setAnalyticsCollectionEnabled(enabled)
            crashReporter.setCrashlyticsCollectionEnabled(enabled)
        }

        // Initialize MediaStoreSaver
        val mediaStoreSaver = MediaStoreSaver(this)

        // Bind repository
        statusRepository = StatusRepositoryImpl(
            context = this,
            mediaStoreSaver = mediaStoreSaver,
            savedDao = database.savedStatusDao(),
            prefStore = safPrefStore
        )
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                STATUS_NOTIFICATION_CHANNEL_ID,
                "Status Saver Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Important updates from OD Status Saver"
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    companion object {
        const val STATUS_NOTIFICATION_CHANNEL_ID = "status_saver_updates"
        lateinit var instance: ODStatusSaverApp
            private set
    }
}
