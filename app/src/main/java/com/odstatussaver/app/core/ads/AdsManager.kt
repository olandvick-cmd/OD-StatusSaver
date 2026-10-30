package com.odstatussaver.app.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.odstatussaver.app.core.analytics.AnalyticsTracker
import com.odstatussaver.app.core.analytics.NoOpAnalyticsTracker
import java.util.concurrent.atomic.AtomicBoolean

class AdsManager(
    private val context: Context,
    private val analyticsTracker: AnalyticsTracker = NoOpAnalyticsTracker()
) {
    private val isMobileAdsInitialized = AtomicBoolean(false)
    private var interstitialAd: InterstitialAd? = null
    private var isInterstitialLoading = false

    private var rewardedAd: RewardedAd? = null
    private var isRewardedLoading = false

    // Frequency capping state
    var successfulSaveCount = 0
        private set
    var lastInterstitialShownTimestamp = 0L
        private set

    /**
     * Initializes Google Mobile Ads SDK with child-directed treatment tags.
     */
    fun initialize(activity: Activity, onInitialized: () -> Unit = {}) {
        if (isMobileAdsInitialized.getAndSet(true)) {
            onInitialized()
            return
        }

        // Configure child-directed treatment policy (General Audience)
        val requestConfiguration = RequestConfiguration.Builder()
            .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
            .build()
        MobileAds.setRequestConfiguration(requestConfiguration)

        try {
            MobileAds.initialize(context) { status ->
                preloadInterstitial(activity)
                preloadRewarded(activity)
                onInitialized()
            }
        } catch (e: Throwable) {
            // Gracefully handle missing Google Play services
            onInitialized()
        }
    }

    /**
     * Preloads the next interstitial ad in the background.
     */
    fun preloadInterstitial(context: Context) {
        if (interstitialAd != null || isInterstitialLoading) return
        isInterstitialLoading = true

        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(
            context,
            AdConfig.INTERSTITIAL_AD_UNIT_ID,
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    isInterstitialLoading = false
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                    isInterstitialLoading = false
                }
            }
        )
    }

    /**
     * Preloads the next rewarded ad.
     */
    fun preloadRewarded(context: Context) {
        if (rewardedAd != null || isRewardedLoading) return
        isRewardedLoading = true

        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            context,
            AdConfig.REWARDED_AD_UNIT_ID,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    isRewardedLoading = false
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                    isRewardedLoading = false
                }
            }
        )
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

    /**
     * Shows a rewarded ad for unlocking premium batch features.
     */
    fun showRewardedAd(
        activity: Activity,
        onRewardEarned: () -> Unit,
        onDismissed: () -> Unit
    ) {
        val ad = rewardedAd
        if (ad == null) {
            // If ad is not ready, grant benefit or proceed gracefully without blocking user
            onRewardEarned()
            onDismissed()
            preloadRewarded(activity)
            return
        }

        var rewardGranted = false
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                rewardedAd = null
                preloadRewarded(activity)
                if (rewardGranted) onRewardEarned()
                onDismissed()
            }

            override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                rewardedAd = null
                preloadRewarded(activity)
                onRewardEarned()
                onDismissed()
            }
        }

        ad.show(activity) { rewardItem ->
            rewardGranted = true
        }
    }
}
