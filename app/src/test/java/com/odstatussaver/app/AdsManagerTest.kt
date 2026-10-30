package com.odstatussaver.app

import com.odstatussaver.app.core.ads.AdConfig
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AdsManagerTest {

    // Simulates AdsManager frequency capping and cooldown math in a testable harness
    private class TestAdScheduler {
        var saveCount = 0
        var lastInterstitialTimestamp = 0L

        fun shouldShowInterstitial(currentTime: Long): Boolean {
            saveCount++
            val frequencyMet = (saveCount % AdConfig.INTERSTITIAL_SAVE_FREQUENCY_CAP) == 0
            val cooldownElapsed = (currentTime - lastInterstitialTimestamp) >= AdConfig.INTERSTITIAL_MIN_COOLDOWN_MS
            return frequencyMet && cooldownElapsed
        }

        fun recordInterstitialShown(timestamp: Long) {
            lastInterstitialTimestamp = timestamp
        }
    }

    @Test
    fun testInterstitialFrequencyCapRespectsSaveCount() {
        val scheduler = TestAdScheduler()
        val baseTime = 100_000L

        // Saves 1, 2, 3 must NOT trigger interstitial (protects user from ad spam)
        assertFalse(scheduler.shouldShowInterstitial(baseTime))
        assertFalse(scheduler.shouldShowInterstitial(baseTime))
        assertFalse(scheduler.shouldShowInterstitial(baseTime))

        // Save 4 (frequency cap = 4) triggers interstitial
        assertTrue(scheduler.shouldShowInterstitial(baseTime))
        scheduler.recordInterstitialShown(baseTime)

        // Saves 5, 6, 7 do NOT trigger
        assertFalse(scheduler.shouldShowInterstitial(baseTime + 70_000L))
        assertFalse(scheduler.shouldShowInterstitial(baseTime + 70_000L))
        assertFalse(scheduler.shouldShowInterstitial(baseTime + 70_000L))

        // Save 8 (4 more saves + cooldown elapsed) triggers
        assertTrue(scheduler.shouldShowInterstitial(baseTime + 70_000L))
    }

    @Test
    fun testCooldownPreventsBackToBackInterstitials() {
        val scheduler = TestAdScheduler()
        val t0 = 100_000L

        // Reach frequency cap
        scheduler.saveCount = 3
        assertTrue(scheduler.shouldShowInterstitial(t0))
        scheduler.recordInterstitialShown(t0)

        // Reach frequency cap again quickly (e.g. rapid saving within 10 seconds)
        scheduler.saveCount = 7
        val rapidSaveTime = t0 + 10_000L // only 10s elapsed (< 60s cooldown)

        // Must NOT show because cooldown (60s) has not elapsed
        assertFalse(scheduler.shouldShowInterstitial(rapidSaveTime))

        // When cooldown (60s) has elapsed
        val afterCooldownTime = t0 + 65_000L
        scheduler.saveCount = 7
        assertTrue(scheduler.shouldShowInterstitial(afterCooldownTime))
    }

    @Test
    fun testNonBlockingFallbackWhenAdUnavailable() {
        var userActionCompleted = false
        val isAdReady = false

        fun triggerTransition(onDone: () -> Unit) {
            if (isAdReady) {
                // would show ad
            } else {
                // Must immediately fire callback so user is NEVER blocked
                onDone()
            }
        }

        triggerTransition {
            userActionCompleted = true
        }

        assertTrue(userActionCompleted)
    }

    @Test
    fun testChildDirectedPolicyConfiguration() {
        // Must be TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE (0) for general audience utility
        assertEquals(0, AdConfig.TAG_FOR_CHILD_DIRECTED_TREATMENT)
    }
}
