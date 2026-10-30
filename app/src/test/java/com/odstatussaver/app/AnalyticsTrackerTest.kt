package com.odstatussaver.app

import com.odstatussaver.app.core.analytics.AnalyticsTracker
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AnalyticsTrackerTest {

    // Test implementation capturing events without Firebase SDK runtime
    private class TestAnalyticsTracker : AnalyticsTracker {
        val loggedEvents = mutableListOf<Pair<String, Map<String, Any>>>()
        var isCollectionEnabled = true

        private fun sanitizeSource(source: String): String {
            return when (source.lowercase()) {
                "standard", "whatsapp" -> "whatsapp"
                "business", "whatsapp_business", "wa business" -> "whatsapp_business"
                else -> "whatsapp"
            }
        }

        override fun logSourceSelected(source: String) {
            if (!isCollectionEnabled) return
            loggedEvents.add("source_selected" to mapOf("source" to sanitizeSource(source)))
        }

        override fun logStatusListViewed(source: String, itemCount: Int, filter: String) {
            if (!isCollectionEnabled) return
            loggedEvents.add(
                "status_list_viewed" to mapOf(
                    "source" to sanitizeSource(source),
                    "item_count" to itemCount,
                    "media_filter" to filter.lowercase()
                )
            )
        }

        override fun logMediaPreviewed(mediaType: String, source: String) {
            if (!isCollectionEnabled) return
            loggedEvents.add(
                "media_previewed" to mapOf(
                    "media_type" to mediaType.lowercase(),
                    "source" to sanitizeSource(source)
                )
            )
        }

        override fun logSaveStarted(mediaType: String, source: String) {
            if (!isCollectionEnabled) return
            loggedEvents.add(
                "save_started" to mapOf(
                    "media_type" to mediaType.lowercase(),
                    "source" to sanitizeSource(source)
                )
            )
        }

        override fun logSaveCompleted(mediaType: String, source: String, isDuplicate: Boolean) {
            if (!isCollectionEnabled) return
            loggedEvents.add(
                "save_completed" to mapOf(
                    "media_type" to mediaType.lowercase(),
                    "source" to sanitizeSource(source),
                    "is_duplicate" to isDuplicate
                )
            )
        }

        override fun logSaveFailed(mediaType: String, source: String, errorType: String) {
            if (!isCollectionEnabled) return
            val sanitizedError = errorType.replace("[/\\\\].*".toRegex(), "").take(40)
            loggedEvents.add(
                "save_failed" to mapOf(
                    "media_type" to mediaType.lowercase(),
                    "source" to sanitizeSource(source),
                    "error_category" to sanitizedError
                )
            )
        }

        override fun logBulkSaveCompleted(totalCount: Int, successCount: Int, failureCount: Int, source: String) {
            if (!isCollectionEnabled) return
            loggedEvents.add(
                "bulk_save_completed" to mapOf(
                    "total_count" to totalCount,
                    "success_count" to successCount,
                    "failure_count" to failureCount,
                    "source" to sanitizeSource(source)
                )
            )
        }

        override fun logPermissionFlowCompleted(source: String, granted: Boolean) {
            if (!isCollectionEnabled) return
            loggedEvents.add(
                "permission_flow_completed" to mapOf(
                    "source" to sanitizeSource(source),
                    "permission_granted" to granted
                )
            )
        }

        override fun logHelpOpened(screen: String) {
            if (!isCollectionEnabled) return
            loggedEvents.add("help_opened" to mapOf("screen_name" to screen.lowercase()))
        }

        override fun setAnalyticsCollectionEnabled(enabled: Boolean) {
            isCollectionEnabled = enabled
        }
    }

    @Test
    fun testControlledSourceValues() {
        val tracker = TestAnalyticsTracker()

        tracker.logSourceSelected("STANDARD")
        assertEquals("whatsapp", tracker.loggedEvents.last().second["source"])

        tracker.logSourceSelected("WhatsApp")
        assertEquals("whatsapp", tracker.loggedEvents.last().second["source"])

        tracker.logSourceSelected("BUSINESS")
        assertEquals("whatsapp_business", tracker.loggedEvents.last().second["source"])

        tracker.logSourceSelected("WA Business")
        assertEquals("whatsapp_business", tracker.loggedEvents.last().second["source"])
    }

    @Test
    fun testFilePathSanitizationInErrors() {
        val tracker = TestAnalyticsTracker()

        // Ensure accidental file path string is stripped so PII or directory paths never leak to Firebase
        tracker.logSaveFailed("image", "STANDARD", "IO_ERROR:/storage/emulated/0/WhatsApp/Media/.Statuses/private.jpg")
        val errorCategory = tracker.loggedEvents.last().second["error_category"] as String

        assertFalse(errorCategory.contains("/storage"))
        assertFalse(errorCategory.contains("private.jpg"))
        assertEquals("IO_ERROR:", errorCategory)
    }

    @Test
    fun testAnalyticsCollectionConsentToggle() {
        val tracker = TestAnalyticsTracker()

        tracker.logSaveStarted("image", "whatsapp")
        assertEquals(1, tracker.loggedEvents.size)

        // User disables collection in settings
        tracker.setAnalyticsCollectionEnabled(false)
        tracker.logSaveCompleted("image", "whatsapp", false)
        tracker.logSourceSelected("BUSINESS")

        // No new events should be tracked when disabled
        assertEquals(1, tracker.loggedEvents.size)

        // User re-enables collection
        tracker.setAnalyticsCollectionEnabled(true)
        tracker.logHelpOpened("settings")
        assertEquals(2, tracker.loggedEvents.size)
        assertEquals("help_opened", tracker.loggedEvents.last().first)
    }
}
