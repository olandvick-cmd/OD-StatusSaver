package com.odstatussaver.app.core.analytics

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics

class FirebaseAnalyticsTracker(private val context: Context) : AnalyticsTracker {

    private val firebaseAnalytics: FirebaseAnalytics? by lazy {
        try {
            FirebaseAnalytics.getInstance(context)
        } catch (e: Throwable) {
            // Graceful fallback if Google Play Services / Firebase is unconfigured or unavailable
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

    override fun logStatusListViewed(source: String, itemCount: Int, filter: String) {
        try {
            val bundle = Bundle().apply {
                putString("source", sanitizeSource(source))
                putInt("item_count", itemCount)
                putString("media_filter", filter.lowercase())
            }
            firebaseAnalytics?.logEvent("status_list_viewed", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun logMediaPreviewed(mediaType: String, source: String) {
        try {
            val bundle = Bundle().apply {
                putString("media_type", mediaType.lowercase())
                putString("source", sanitizeSource(source))
            }
            firebaseAnalytics?.logEvent("media_previewed", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun logSaveStarted(mediaType: String, source: String) {
        try {
            val bundle = Bundle().apply {
                putString("media_type", mediaType.lowercase())
                putString("source", sanitizeSource(source))
            }
            firebaseAnalytics?.logEvent("save_started", bundle)
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

    override fun logBulkSaveCompleted(totalCount: Int, successCount: Int, failureCount: Int, source: String) {
        try {
            val bundle = Bundle().apply {
                putInt("total_count", totalCount)
                putInt("success_count", successCount)
                putInt("failure_count", failureCount)
                putString("source", sanitizeSource(source))
            }
            firebaseAnalytics?.logEvent("bulk_save_completed", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun logPermissionFlowCompleted(source: String, granted: Boolean) {
        try {
            val bundle = Bundle().apply {
                putString("source", sanitizeSource(source))
                putBoolean("permission_granted", granted)
            }
            firebaseAnalytics?.logEvent("permission_flow_completed", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun logHelpOpened(screen: String) {
        try {
            val bundle = Bundle().apply {
                putString("screen_name", screen.lowercase())
            }
            firebaseAnalytics?.logEvent("help_opened", bundle)
        } catch (ignored: Throwable) {}
    }

    override fun setAnalyticsCollectionEnabled(enabled: Boolean) {
        try {
            firebaseAnalytics?.setAnalyticsCollectionEnabled(enabled)
        } catch (ignored: Throwable) {}
    }
}
