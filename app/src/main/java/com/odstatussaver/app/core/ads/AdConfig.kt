package com.odstatussaver.app.core.ads

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
}
