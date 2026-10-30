package com.odstatussaver.app.core.crashlytics

/**
 * Crash and non-fatal technical issue reporting interface.
 * Strictly avoids logging personal identifiers, phone numbers,
 * contact names, media contents, or private file paths.
 */
interface CrashReporter {
    fun recordNonFatal(tag: String, throwable: Throwable)
    fun setCustomKey(key: String, value: String)
    fun setCrashlyticsCollectionEnabled(enabled: Boolean)
}
