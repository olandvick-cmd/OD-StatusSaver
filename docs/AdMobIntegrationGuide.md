# Google AdMob Integration & Production Deployment Guide
**Application**: OD Status Saver (`com.odstatussaver.app`)  
**Target Platform**: Android 8.0+ (API 26+)  
**Framework**: Jetpack Compose, Material 3, Google Mobile Ads SDK (v23.5.0), Google UMP (v3.0.0)

---

## 1. Google AdMob Console Registration

### Step 1: Create or Sign in to AdMob
1. Visit [https://admob.google.com/](https://admob.google.com/) and sign in with your Google Developer account.
2. Ensure your account billing and payment profiles are verified.

### Step 2: Register OD Status Saver
1. In the left navigation, click **Apps** > **Add App**.
2. **Platform**: Select **Android**.
3. **Is the app listed on a supported app store?**:
   - If not yet published, select **No**. (You can link your Google Play store listing URL later once approved).
4. **App Name**: Enter `OD Status Saver`.
5. **User Metrics**: Ensure **User Metrics** is checked (**Enabled**). This unlocks retention, session duration, and automated LTV metrics.
6. Click **Add App**. AdMob will assign your unique **AdMob App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`).

---

## 2. Creating Ad Units

In the AdMob Console, navigate to **Apps** > **OD Status Saver** > **Ad Units** > **Add Ad Unit**:

### 1. Adaptive Banner
- **Format**: Banner
- **Ad unit name**: `banner_home_bottom`
- **Advanced settings**: Keep standard Google optimized refresh rate (30–120s).
- Click **Create Ad Unit** and copy the Unit ID (`ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`).

### 2. Interstitial (Save Transition)
- **Format**: Interstitial
- **Ad unit name**: `interstitial_save_milestone`
- **Frequency Capping in Console**: Set to *No Cap* here, or match the app-level guard of 1 impression per 60 seconds (the app enforces a strict local client cap of 1 impression per 4 completed saves and 60s cooldown in `AdsManager.kt`).
- Click **Create Ad Unit** and copy the Unit ID.

### 3. Rewarded Ad (Optional Premium Bulk Actions)
- **Format**: Rewarded
- **Ad unit name**: `rewarded_bulk_export`
- **Reward settings**: Amount `1`, Item `Bulk Save Access`.
- Click **Create Ad Unit** and copy the Unit ID.

---

## 3. Linking AdMob to Firebase Project

Linking AdMob with Firebase enables unified analytics, ad revenue attribution (ROAS/LTV calculation per user cohort), and DebugView ad events.

1. In the AdMob Console, navigate to **Settings** (gear icon) > **Linked Services**.
2. Locate **OD Status Saver** and click **Link to Firebase**.
3. Select your existing Firebase project: `od-status-saver` (Project Number: `421596270212`).
4. Select the Android package: `com.odstatussaver.app`.
5. Ensure **Conversion tracking** and **Ad revenue data sharing** are enabled.
6. In the **Firebase Console** ([https://console.firebase.google.com/](https://console.firebase.google.com/)):
   - Open Project **od-status-saver** > **Project Settings** > **Integrations** > **Google AdMob**.
   - Verify that the link status shows as **Active**.

---

## 4. Enabling User Metrics & Privacy (UMP)

1. **AdMob User Metrics**:
   - Navigate to AdMob > **Apps** > **OD Status Saver** > **App Settings**.
   - Confirm **User metrics** toggle is **ON**.
2. **European Regulations & US State Privacy (GDPR / CCPA / UMP)**:
   - Navigate to AdMob > **Privacy & messaging**.
   - Under **GDPR**, click **Create message**. Configure your app name (`OD Status Saver`), upload your app logo, and specify your Privacy Policy URL.
   - Under **US State Regulations**, create a California/US state opt-out message if serving US traffic.
   - The app's `ConsentManager.kt` automatically requests and renders these forms before loading ads, and exposes a user-accessible "Ad Privacy Choices" button in **Settings** (`ConsentManager.showPrivacyOptionsForm()`).

---

## 5. Setting up `app-ads.txt` (Brand Safety & Revenue Protection)

To prevent unauthorized ad inventory spoofing and preserve ad fill rates:
1. Navigate to AdMob > **Apps** > **app-ads.txt**.
2. Copy your publisher snippet:
   ```text
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
3. Host this file at the root of your developer website registered on Google Play:
   `https://www.yourdomain.com/app-ads.txt`.
4. AdMob will crawl the URL within 24 hours and mark your app as verified.

---

## 6. Configuring Production Ad IDs (Zero-Risk Secrets Strategy)

During development and testing, OD Status Saver uses Google's official, guaranteed test IDs. **Never hardcode live production AdMob IDs in git or test builds**, as accidental clicks on live ads during QA will lead to account suspension.

### Local Development / Production Builds
Provide the production IDs in your local `gradle.properties` (or as CI environment variables):

```properties
# ~/.gradle/gradle.properties or project gradle.properties (gitignored)
ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/1111111111
ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/2222222222
ADMOB_REWARDED_ID=ca-app-pub-XXXXXXXXXXXXXXXX/3333333333
```

In `app/build.gradle.kts`, these properties are automatically injected into `BuildConfig` and `AndroidManifest.xml`:

```kotlin
val admobAppId = project.findProperty("ADMOB_APP_ID") as? String 
    ?: "ca-app-pub-3940256099942544~3347511713" // Google Official Test App ID

manifestPlaceholders["admobAppId"] = admobAppId

buildConfigField("String", "ADMOB_BANNER_ID", "\"${project.findProperty("ADMOB_BANNER_ID") ?: "ca-app-pub-3940256099942544/6300978111"}\"")
buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"${project.findProperty("ADMOB_INTERSTITIAL_ID") ?: "ca-app-pub-3940256099942544/1033173712"}\"")
buildConfigField("String", "ADMOB_REWARDED_ID", "\"${project.findProperty("ADMOB_REWARDED_ID") ?: "ca-app-pub-3940256099942544/5224354917"}\"")
```

### In Continuous Integration (GitHub Actions / GitLab CI)
Pass them as secure build flags:
```bash
./gradlew assembleRelease \
  -PADMOB_APP_ID="$PROD_ADMOB_APP_ID" \
  -PADMOB_BANNER_ID="$PROD_BANNER_ID" \
  -PADMOB_INTERSTITIAL_ID="$PROD_INTERSTITIAL_ID" \
  -PADMOB_REWARDED_ID="$PROD_REWARDED_ID"
```

---

## 7. Policy & Quality Verification Checklist

| Policy Requirement | Implementation in OD Status Saver | Verification Status |
| :--- | :--- | :--- |
| **No Accidental Clicks** | Bottom banner is clearly isolated in a dedicated card with "SPONSORED" label, distinct border, and padding away from save/repost buttons. | Passed |
| **Non-Blocking Invariant** | If ads fail to load, timeout, or encounter network errors, `onDismissed()` immediately triggers. Saving operations and UI actions are **never** blocked. | Verified in `AdsManagerTest` |
| **Frequency Capping** | Interstitial ad triggers at most once every 4 saved statuses, and enforces a mandatory 60-second cooldown between impressions. | Verified in `AdsManagerTest` |
| **Child-Directed Treatment** | Tagged as `TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE` (general audience utility 13+). | Verified in `AdsManagerTest` |
| **Consent & Privacy** | Google UMP SDK v3 checks consent status before requesting ads. Privacy choices form accessible at any time in Settings. | Verified in `ConsentManager` |
| **Zero PII in Analytics** | Ad impression events log only sanitized names (`interstitial_impression`), with no file paths, contact info, or phone numbers. | Verified in `AnalyticsTrackerTest` |
