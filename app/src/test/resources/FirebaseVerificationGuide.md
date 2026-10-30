# Firebase Analytics & Crashlytics Verification Guide

This guide details how to configure Firebase Console, position `google-services.json`, inspect live events in DebugView, view engagement metrics, and verify Crashlytics reports without risking PII exposure.

---

## 1. Firebase Console Setup & Credentials

1. Navigate to the **Firebase Console** (https://console.firebase.google.com/).
2. Create or open the Firebase project: `od-status-saver`.
3. Add an Android App with the exact Application ID:
   * **Android package name**: `com.odstatussaver.app`
   * **App nickname**: `OD Status Saver`
   * **Debug signing certificate SHA-1**: Optional for Analytics/Crashlytics, required if testing Google Sign-in or App Check.
4. Download the generated `google-services.json` file.
5. Place the file at:
   ```
   app/google-services.json
   ```
   *(Note: The build system merges this file into Android assets during compilation. If the file is missing or invalid, our `FirebaseAnalyticsTracker` and `FirebaseCrashReporter` gracefully fall back without causing app crashes).*

---

## 2. Real-Time Verification with Firebase DebugView

Normally, Firebase Analytics batches events and uploads them periodically (approximately once per hour) to conserve device battery and network bandwidth. To verify events immediately during development, use **DebugView**:

### Step-by-Step DebugView Activation:
1. Connect your Android test device via USB with USB Debugging enabled.
2. Enable debug logging in `adb`:
   ```bash
   adb shell setprop debug.firebase.analytics.app com.odstatussaver.app
   ```
3. Open **Firebase Console > Analytics > DebugView**.
4. Launch **OD Status Saver** on the device and perform standard user flows:
   * Switch between **WhatsApp** and **WA Business** tabs -> observe `source_selected` event.
   * View the status media grid -> observe `status_list_viewed` event with `item_count` and `media_filter`.
   * Tap on a status to preview full-screen -> observe `media_previewed` event.
   * Save a single status or multiple statuses -> observe `save_started`, `save_completed`, and `bulk_save_completed` events.
   * Open Settings -> observe `help_opened` with `screen_name: "settings"`.
5. Check event parameters in the DebugView timeline to ensure that **no filenames, private paths, or contact numbers** are present.
6. When testing is complete, disable debug mode:
   ```bash
   adb shell setprop debug.firebase.analytics.app .none.
   ```

---

## 3. Crashlytics Verification & Testing

Crashlytics batches crash reports and sends them upon subsequent app launches.

### Verification Steps:
1. Verify Crashlytics is initialized: Check Logcat for `FirebaseCrashlytics` initialization logs.
2. Trigger a controlled test exception in a debug build:
   ```kotlin
   FirebaseCrashReporter().recordNonFatal("TEST_NONFATAL", RuntimeException("Controlled QA Verification Exception"))
   ```
3. Close the app and re-open it to allow Crashlytics to upload the report over network.
4. Open **Firebase Console > Quality > Crashlytics**.
5. Within 5 minutes, verify that the non-fatal issue appears with:
   * Custom Key: `error_tag = TEST_NONFATAL`
   * Stack trace pointing to the sanitized Kotlin method.
   * Ensure no private file paths or device usernames appear in custom keys or logs.

---

## 4. Viewing Console Reports in Production

* **Active Users & Engagement**: Navigate to **Analytics > Dashboard** to review Daily Active Users (DAU), Monthly Active Users (MAU), average engagement time per session, and top user countries.
* **Source Popularity**: Go to **Analytics > Events > source_selected**. Inspect the `source` parameter distribution to see the ratio of standard WhatsApp vs WhatsApp Business users.
* **Saving Success vs Failure**: Go to **Analytics > Events > save_failed**. Inspect `error_category` values (e.g. `INSUFFICIENT_STORAGE`, `EXPIRED_OR_NOT_FOUND`) to prioritize stability fixes for specific Android OS versions.
* **User Retention**: Go to **Analytics > Retention** to analyze Day 1, Day 7, and Day 30 retention cohorts.
