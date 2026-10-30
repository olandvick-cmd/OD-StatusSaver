package com.odstatussaver.app.core.crashlytics

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
            // Strip any accidental absolute paths
            val sanitizedValue = if (value.contains("/")) value.substringAfterLast("/") else value
            crashlytics?.setCustomKey(key, sanitizedValue.take(40))
        } catch (ignored: Throwable) {}
    }

    override fun setCrashlyticsCollectionEnabled(enabled: Boolean) {
        try {
            crashlytics?.setCrashlyticsCollectionEnabled(enabled)
        } catch (ignored: Throwable) {}
    }
}
