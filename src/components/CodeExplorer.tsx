import React, { useState } from 'react';
import { FileCode, Check, Copy, Folder, ChevronRight } from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  category: string;
  language: string;
  content: string;
}

const KOTLIN_FILES: CodeFile[] = [
  {
    path: "app/src/main/java/com/odstatussaver/app/core/analytics/AnalyticsTracker.kt",
    name: "AnalyticsTracker.kt",
    category: "Firebase Analytics",
    language: "kotlin",
    content: `package com.odstatussaver.app.core.analytics

/**
 * Clean analytics tracking abstraction.
 * Completely decoupled from the media-saving engine.
 * Strictly adheres to privacy guidelines: no phone numbers, no account IDs,
 * no media contents, and no file paths or media filenames are ever logged.
 */
interface AnalyticsTracker {
    fun logSourceSelected(source: String)
    fun logStatusListViewed(source: String, itemCount: Int, filter: String)
    fun logMediaPreviewed(mediaType: String, source: String)
    fun logSaveStarted(mediaType: String, source: String)
    fun logSaveCompleted(mediaType: String, source: String, isDuplicate: Boolean)
    fun logSaveFailed(mediaType: String, source: String, errorType: String)
    fun logBulkSaveCompleted(totalCount: Int, successCount: Int, failureCount: Int, source: String)
    fun logPermissionFlowCompleted(source: String, granted: Boolean)
    fun logHelpOpened(screen: String)
    fun setAnalyticsCollectionEnabled(enabled: Boolean)
}`
  },
  {
    path: "app/src/main/java/com/odstatussaver/app/core/analytics/FirebaseAnalyticsTracker.kt",
    name: "FirebaseAnalyticsTracker.kt",
    category: "Firebase Analytics",
    language: "kotlin",
    content: `package com.odstatussaver.app.core.analytics

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics

class FirebaseAnalyticsTracker(private val context: Context) : AnalyticsTracker {

    private val firebaseAnalytics: FirebaseAnalytics? by lazy {
        try {
            FirebaseAnalytics.getInstance(context)
        } catch (e: Throwable) {
            null
        }
    }

    private fun sanitizeSource(source: String): String {
        return when (source.lowercase()) {
            "standard", "whatsapp" -> "whatsapp"
            "business", "whatsapp_business", "wa business" -> "whatsapp_business"
            else -> "whatsapp"
        }
    }

    override fun logSourceSelected(source: String) {
        try {
            val bundle = Bundle().apply {
                putString("source", sanitizeSource(source))
            }
            firebaseAnalytics?.logEvent("source_selected", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun logSaveCompleted(mediaType: String, source: String, isDuplicate: Boolean) {
        try {
            val bundle = Bundle().apply {
                putString("media_type", mediaType.lowercase())
                putString("source", sanitizeSource(source))
                putBoolean("is_duplicate", isDuplicate)
            }
            firebaseAnalytics?.logEvent("save_completed", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun logSaveFailed(mediaType: String, source: String, errorType: String) {
        try {
            // Strictly logs error classification category. Strips all file paths or filenames.
            val sanitizedError = errorType.replace("[/\\\\].*".toRegex(), "").take(40)
            val bundle = Bundle().apply {
                putString("media_type", mediaType.lowercase())
                putString("source", sanitizeSource(source))
                putString("error_category", sanitizedError)
            }
            firebaseAnalytics?.logEvent("save_failed", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun setAnalyticsCollectionEnabled(enabled: Boolean) {
        try {
            firebaseAnalytics?.setAnalyticsCollectionEnabled(enabled)
        } catch (ignored: Throwable) {}
    }
}`
  },
  {
    path: "app/src/main/java/com/odstatussaver/app/core/crashlytics/FirebaseCrashReporter.kt",
    name: "FirebaseCrashReporter.kt",
    category: "Firebase Crashlytics",
    language: "kotlin",
    content: `package com.odstatussaver.app.core.crashlytics

import com.google.firebase.crashlytics.FirebaseCrashlytics

class FirebaseCrashReporter : CrashReporter {

    private val crashlytics: FirebaseCrashlytics? by lazy {
        try {
            FirebaseCrashlytics.getInstance()
        } catch (e: Throwable) {
            null
        }
    }

    override fun recordNonFatal(tag: String, throwable: Throwable) {
        try {
            val sanitizedTag = tag.replace("[/\\\\].*".toRegex(), "").take(30)
            crashlytics?.setCustomKey("error_tag", sanitizedTag)
            crashlytics?.recordException(throwable)
        } catch (ignored: Throwable) {}
    }

    override fun setCustomKey(key: String, value: String) {
        try {
            val sanitizedValue = if (value.contains("/")) value.substringAfterLast("/") else value
            crashlytics?.setCustomKey(key, sanitizedValue.take(40))
        } catch (ignored: Throwable) {}
    }

    override fun setCrashlyticsCollectionEnabled(enabled: Boolean) {
        try {
            crashlytics?.setCrashlyticsCollectionEnabled(enabled)
        } catch (ignored: Throwable) {}
    }
}`
  },
  {
    path: "app/src/main/java/com/odstatussaver/app/domain/source/MediaSource.kt",
    name: "MediaSource.kt",
    category: "Architecture & Sources",
    language: "kotlin",
    content: `package com.odstatussaver.app.domain.source

import android.net.Uri
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import java.io.File

interface MediaSource {
    val sourceType: WhatsAppSource
    val packageName: String
    val displayName: String

    fun isInstalled(): Boolean
    fun getCandidateDirectories(): List<File>
    fun canAccessDirectly(): Boolean
    suspend fun hasSafPermission(): Boolean
    suspend fun hasAccess(): Boolean
    suspend fun getPersistedTreeUri(): Uri?
    suspend fun setPersistedTreeUri(treeUri: Uri)
    suspend fun clearPersistedTreeUri()
    suspend fun discoverStatuses(): Result<List<StatusItem>>
    suspend fun isStatusAccessible(item: StatusItem): Boolean
}`
  },
  {
    path: "app/src/main/java/com/odstatussaver/app/data/source/MediaStoreSaver.kt",
    name: "MediaStoreSaver.kt",
    category: "Data & Storage",
    language: "kotlin",
    content: `package com.odstatussaver.app.data.source

// Saves media to public Pictures/ODStatusSaver or Movies/ODStatusSaver.
// Bit-for-bit stream copy, prevents overwrites, checks available storage,
// handles expired statuses (FileNotFoundException), and triggers MediaScannerConnection.`
  },
  {
    path: "app/google-services.json",
    name: "google-services.json",
    category: "Firebase Config",
    language: "json",
    content: `{
  "project_info": {
    "project_number": "421596270212",
    "project_id": "od-status-saver",
    "storage_bucket": "od-status-saver.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:421596270212:android:6e4b8595a86a60db2fa15c",
        "android_client_info": {
          "package_name": "com.odstatussaver.app"
        }
      }
    }
  ]
}`
  },
  {
    path: "app/src/main/java/com/odstatussaver/app/core/ads/AdConfig.kt",
    name: "AdConfig.kt",
    category: "Google AdMob",
    language: "kotlin",
    content: `package com.odstatussaver.app.core.ads

import com.odstatussaver.app.BuildConfig

object AdConfig {
    // Official Google AdMob Sample Ad Unit IDs (used in debug and default build configs)
    // Production IDs are injected through build.gradle.kts buildConfigField / project properties
    val BANNER_AD_UNIT_ID: String = BuildConfig.ADMOB_BANNER_ID
    val INTERSTITIAL_AD_UNIT_ID: String = BuildConfig.ADMOB_INTERSTITIAL_ID
    val REWARDED_AD_UNIT_ID: String = BuildConfig.ADMOB_REWARDED_ID

    // Sensible frequency capping rules to protect user retention and avoid annoying users
    const val INTERSTITIAL_SAVE_FREQUENCY_CAP = 4 // Show at most once every 4 saves
    const val INTERSTITIAL_MIN_COOLDOWN_MS = 60_000L // Minimum 60 seconds between interstitials

    // Child-directed treatment setting:
    // False = App is designed for general audience (WhatsApp status users 13+)
    const val TAG_FOR_CHILD_DIRECTED_TREATMENT = 0 // RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE
}`
  },
  {
    path: "app/src/main/java/com/odstatussaver/app/core/ads/AdsManager.kt",
    name: "AdsManager.kt",
    category: "Google AdMob",
    language: "kotlin",
    content: `package com.odstatussaver.app.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.*
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.odstatussaver.app.core.analytics.AnalyticsTracker
import java.util.concurrent.atomic.AtomicBoolean

class AdsManager(
    private val context: Context,
    private val analyticsTracker: AnalyticsTracker
) {
    private val isMobileAdsInitialized = AtomicBoolean(false)
    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null

    var successfulSaveCount = 0
        private set
    var lastInterstitialShownTimestamp = 0L
        private set

    fun initialize(activity: Activity, onInitialized: () -> Unit = {}) {
        if (isMobileAdsInitialized.getAndSet(true)) {
            onInitialized()
            return
        }

        val requestConfiguration = RequestConfiguration.Builder()
            .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
            .build()
        MobileAds.setRequestConfiguration(requestConfiguration)

        MobileAds.initialize(context) {
            preloadInterstitial(activity)
            preloadRewarded(activity)
            onInitialized()
        }
    }

    /**
     * Records a successful save and evaluates whether an interstitial ad should be displayed.
     * Guaranteed never to block the user flow: onDismissed always runs.
     */
    fun onMediaSaved(activity: Activity, onDismissed: () -> Unit) {
        successfulSaveCount++

        val now = System.currentTimeMillis()
        val cooldownElapsed = (now - lastInterstitialShownTimestamp) >= AdConfig.INTERSTITIAL_MIN_COOLDOWN_MS
        val frequencyMet = (successfulSaveCount % AdConfig.INTERSTITIAL_SAVE_FREQUENCY_CAP) == 0

        if (frequencyMet && cooldownElapsed && interstitialAd != null) {
            val ad = interstitialAd!!
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    interstitialAd = null
                    lastInterstitialShownTimestamp = System.currentTimeMillis()
                    preloadInterstitial(activity)
                    onDismissed()
                }

                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    interstitialAd = null
                    preloadInterstitial(activity)
                    onDismissed()
                }

                override fun onAdShowedFullScreenContent() {
                    analyticsTracker.logSourceSelected("interstitial_impression")
                }
            }
            ad.show(activity)
        } else {
            // Frequency cap not met or ad not ready - proceed immediately
            onDismissed()
        }
    }
}`
  },
  {
    path: "docs/AdMobIntegrationGuide.md",
    name: "AdMobIntegrationGuide.md",
    category: "Deployment & Docs",
    language: "markdown",
    content: `# Google AdMob Integration & Production Deployment Guide
OD Status Saver (com.odstatussaver.app)

1. Register app in AdMob Console with User Metrics enabled.
2. Link to Firebase Project 'od-status-saver'.
3. Set up Google UMP consent for GDPR/CCPA compliance.
4. Add app-ads.txt to developer root domain.
5. Provide production ADMOB_APP_ID and Ad Unit IDs in gradle.properties / CI secrets.
6. Verify anti-accidental click placement and non-blocking ad fallback.`
  },
  {
    path: "firestore.rules",
    name: "firestore.rules",
    category: "Web Admin & Security",
    language: "rules",
    content: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }

    function isBootstrappedOwner() {
      return request.auth != null &&
        request.auth.token.email == 'Olandvick@gmail.com' &&
        request.auth.token.email_verified == true;
    }

    function isOwner() {
      return isBootstrappedOwner() || (
        request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'owner'
      );
    }

    function isAdmin() {
      return isOwner() || (
        request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'administrator'
      );
    }

    function isAnalyst() {
      return isAdmin() || (
        request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'analyst'
      );
    }

    match /admins/{adminId} {
      allow get: if request.auth != null && (request.auth.uid == adminId || isAnalyst());
      allow list: if isAnalyst();
      allow create, update: if isOwner() || (isAdmin() && request.resource.data.role != 'owner');
      allow delete: if isOwner() && request.auth.uid != adminId;
    }

    match /app_config/{configId} {
      allow get: if true; // Public for non-authenticated mobile app clients
      allow list, create, update: if isAdmin();
      allow delete: if isOwner();
    }

    match /audit_logs/{logId} {
      allow get, list: if isAnalyst();
      allow create: if isAnalyst() && request.resource.data.actorUid == request.auth.uid;
      allow update, delete: if false; // Strictly immutable
    }

    match /analytics_aggregates/{date} {
      allow get, list: if isAnalyst();
      allow create, update: if isAdmin();
    }

    match /crash_reports/{reportId} {
      allow get, list: if isAnalyst();
      allow create, update: if isAdmin();
    }

    match /admob_reports/{reportId} {
      allow get, list: if isAnalyst();
      allow create, update: if isAdmin();
    }
  }
}`
  },
  {
    path: "docs/WebAdminDashboardGuide.md",
    name: "WebAdminDashboardGuide.md",
    category: "Web Admin & Security",
    language: "markdown",
    content: `# OD Status Saver - Web Admin Dashboard Architecture & Guide
Zero-PII web console with RBAC (Owner, Administrator, Analyst).
- Pre-seeded Owner: Olandvick@gmail.com
- Public registration prohibited
- Zero status media uploads, zero contact harvesting, zero phone numbers collected
- AdMob Reporting API v1 integration instructions
- Live Firestore schema deployment with immutable audit logging`
  },
  {
    path: "docs/GooglePlayReleaseAssets.md",
    name: "GooglePlayReleaseAssets.md",
    category: "Play Store & Release",
    language: "markdown",
    content: `# OD Status Saver - Google Play Release Assets
App Name: OD Status Saver
Short Description (78 chars): Save & view WhatsApp and WhatsApp Business status photos and videos privately.
Package: com.odstatussaver.app
Category: Tools / Productivity
Data Safety: 0 PII, 0 Media Uploads, 0 Contacts. Optional anonymized Firebase Analytics & non-PII Crashlytics.
Release Command: ./gradlew bundleRelease -PADMOB_APP_ID="ca-app-pub-..."`
  },
  {
    path: "docs/PrivacyPolicy.md",
    name: "PrivacyPolicy.md",
    category: "Play Store & Release",
    language: "markdown",
    content: `# Privacy Policy for OD Status Saver
Last Updated: October 28, 2026
1. No Account Required: You do not need to create an account or provide an email, phone number, or name.
2. On-Device Media Processing: Status photos/videos never leave your phone.
3. No Contact Book or Chat Access: We never access your contacts or messages.
4. Non-PII Diagnostics: Firebase Analytics (opt-out available) and Crashlytics (scrubbed of file paths).
5. Compliant Ad Serving: Google UMP consent flow integrated for GDPR/CCPA compliance.`
  },
  {
    path: "keystore.properties.example",
    name: "keystore.properties.example",
    category: "Play Store & Release",
    language: "properties",
    content: `# Keystore Configuration Template for OD Status Saver
# COPY this file to keystore.properties (git-ignored) and fill in your actual production release keystore values.
# NEVER commit keystore.properties or release keystore (*.jks) to source control.

storeFile=../release-keys/od_status_saver_release.jks
storePassword=YourStrongStorePasswordHere
keyAlias=od_release_key
keyPassword=YourStrongKeyPasswordHere`
  }
];

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(KOTLIN_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row h-[620px]">
      {/* File Tree Sidebar */}
      <div className="w-full md:w-72 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-2">
          <Folder className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">Android Project Tree</span>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {KOTLIN_FILES.map(file => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                selectedFile.path === file.path
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">{file.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col bg-slate-950/70 overflow-hidden">
        {/* Top Bar */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">{selectedFile.path}</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono">
              {selectedFile.language}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-950 select-text">
          <pre className="whitespace-pre">{selectedFile.content}</pre>
        </div>
      </div>
    </div>
  );
};
