package com.odstatussaver.app.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.ump.ConsentDebugSettings
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform

/**
 * Handles Google User Messaging Platform (UMP) consent flow.
 * Ensures privacy compliance (GDPR/ePrivacy/CCPA) before requesting ads.
 */
class ConsentManager(private val context: Context) {

    private val consentInformation: ConsentInformation by lazy {
        UserMessagingPlatform.getConsentInformation(context)
    }

    val canRequestAds: Boolean
        get() = consentInformation.canRequestAds()

    val isPrivacyOptionsRequired: Boolean
        get() = consentInformation.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED

    /**
     * Gathers user consent. If consent is required, shows the UMP consent form.
     */
    fun requestConsent(activity: Activity, onConsentCompleted: (canRequestAds: Boolean) -> Unit) {
        val params = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(false)
            .build()

        consentInformation.requestConsentInfoUpdate(
            activity,
            params,
            {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                    // Form dismissed or not required
                    onConsentCompleted(consentInformation.canRequestAds())
                }
            },
            { requestConsentError ->
                // Fallback to current canRequestAds status on network/request failure
                onConsentCompleted(consentInformation.canRequestAds())
            }
        )
    }

    /**
     * Opens the privacy options form so users can review or change their ad consent choices later.
     */
    fun showPrivacyOptionsForm(activity: Activity, onDismiss: () -> Unit) {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) {
            onDismiss()
        }
    }

    /**
     * Resets consent state for debug testing.
     */
    fun resetConsentForTesting() {
        consentInformation.reset()
    }
}
