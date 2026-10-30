package com.odstatussaver.app.core.analytics

/**
 * Clean analytics tracking abstraction.
 * Completely decoupled from the media-saving engine.
 * Strictly adheres to privacy guidelines: no phone numbers, no account IDs,
 * no media contents, and no file paths or media filenames are ever logged.
 */
interface AnalyticsTracker {

    /**
     * Track user switching between media sources (controlled values: "whatsapp", "whatsapp_business").
     */
    fun logSourceSelected(source: String)

    /**
     * Track status grid view presentation.
     */
    fun logStatusListViewed(source: String, itemCount: Int, filter: String)

    /**
     * Track when user enters full-screen preview.
     */
    fun logMediaPreviewed(mediaType: String, source: String)

    /**
     * Track when save is initiated.
     */
    fun logSaveStarted(mediaType: String, source: String)

    /**
     * Track when save finishes successfully.
     */
    fun logSaveCompleted(mediaType: String, source: String, isDuplicate: Boolean)

    /**
     * Track when save fails, using controlled error category (no file paths or private details).
     */
    fun logSaveFailed(mediaType: String, source: String, errorType: String)

    /**
     * Track multi-select bulk saving completion.
     */
    fun logBulkSaveCompleted(totalCount: Int, successCount: Int, failureCount: Int, source: String)

    /**
     * Track Storage Access Framework (SAF) permission flow outcome.
     */
    fun logPermissionFlowCompleted(source: String, granted: Boolean)

    /**
     * Track navigation into Settings or SAF guide.
     */
    fun logHelpOpened(screen: String)

    /**
     * Enable or disable analytics data collection per user consent.
     */
    fun setAnalyticsCollectionEnabled(enabled: Boolean)
}
