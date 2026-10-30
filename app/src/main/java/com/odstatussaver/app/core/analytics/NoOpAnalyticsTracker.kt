package com.odstatussaver.app.core.analytics

class NoOpAnalyticsTracker : AnalyticsTracker {
    override fun logSourceSelected(source: String) {}
    override fun logStatusListViewed(source: String, itemCount: Int, filter: String) {}
    override fun logMediaPreviewed(mediaType: String, source: String) {}
    override fun logSaveStarted(mediaType: String, source: String) {}
    override fun logSaveCompleted(mediaType: String, source: String, isDuplicate: Boolean) {}
    override fun logSaveFailed(mediaType: String, source: String, errorType: String) {}
    override fun logBulkSaveCompleted(totalCount: Int, successCount: Int, failureCount: Int, source: String) {}
    override fun logPermissionFlowCompleted(source: String, granted: Boolean) {}
    override fun logHelpOpened(screen: String) {}
    override fun setAnalyticsCollectionEnabled(enabled: Boolean) {}
}
