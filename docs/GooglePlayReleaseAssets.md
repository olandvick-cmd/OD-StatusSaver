# OD Status Saver - Google Play Release Assets & Data Safety Declarations

This document provides production-ready store listing copy, Play Console Data Safety questionnaire specifications, privacy disclosures, and release build instructions for **OD Status Saver** (`com.odstatussaver.app`).

---

## 1. Store Listing Information

### App Name
`OD Status Saver`

### Short Description (78 characters, max 80)
`Save & view WhatsApp and WhatsApp Business status photos and videos privately.`

### Category
`Tools` / `Productivity`

### Tags / Keywords
`Status Saver, WhatsApp Status, WhatsApp Business, Story Saver, Video Status, Photo Saver, Media Status`

---

## 2. Full Store Description

```markdown
OD Status Saver allows you to view, play, and save photo and video statuses from both WhatsApp and WhatsApp Business directly to your device storage in high quality.

Designed with a privacy-first mindset, OD Status Saver operates 100% on-device. Your personal media never leaves your phone, no account registration is needed, and no contact lists or phone numbers are ever accessed.

KEY FEATURES:

✓ Dual Source Support: Independent discovery for both standard WhatsApp and WhatsApp Business.
✓ High-Definition Quality: Saves statuses directly byte-for-byte with zero lossy recompression.
✓ Built-in Media Player & Viewer: Fullscreen image zoom and smooth video playback powered by Media3 ExoPlayer.
✓ Multi-Select Batch Saving: Select multiple photos and videos to save them all in one tap.
✓ Organized Public Album: Media is neatly saved to your device's Pictures/ODStatusSaver and Movies/ODStatusSaver albums, instantly visible in Google Photos and your favorite Gallery app.
✓ Modern Scoped Storage Compliance: Fully supports Android 8.0 (Oreo) up to Android 15 using the official Storage Access Framework (SAF).
✓ Zero Account or Login Required: Start saving instantly without signing up or granting risky contacts permissions.
✓ Dark Mode & Fluid UI: Built natively with Jetpack Compose and Material 3 for smooth performance and battery efficiency.

HOW TO USE:
1. Open WhatsApp or WhatsApp Business and view the status you want to save.
2. Open OD Status Saver.
3. Select the WhatsApp or WhatsApp Business tab.
4. Grant access to the status folder via Android's secure folder picker (required once on Android 11+).
5. Tap any photo or video to view, tap Save to keep it forever, or long-press to bulk save multiple statuses.

DISCLAIMER & POLICIES:
- OD Status Saver is an independent utility and is NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp LLC or Meta Platforms, Inc.
- The names "WhatsApp" and "WhatsApp Business" are trademarks of WhatsApp LLC.
- OD Status Saver respects content ownership. Please obtain permission from the status owner before reposting or re-uploading any saved media.
```

---

## 3. Google Play Data Safety Form Answers

| Category | Question | Answer | Details / Justification |
| :--- | :--- | :--- | :--- |
| **Data Collection** | Does your app collect or share any user data? | **Yes** | Limited strictly to anonymous diagnostics and optional advertising identifiers. |
| **Personal Info** | Do you collect names, emails, addresses, phone numbers, or user IDs? | **No** | Zero PII is collected. The app requires no login, no phone number, and has no user profiles. |
| **Media & Files** | Do you collect or upload photos, videos, audio, or files? | **No** | Status media is processed exclusively on-device and stored locally in public MediaStore albums. Zero files are uploaded to any server. |
| **Contacts & Messages** | Do you access contacts, SMS, or messages? | **No** | The app never requests `READ_CONTACTS` or `READ_SMS`. |
| **App Activity** | Do you collect app interaction data? | **Yes (Optional)** | Aggregated, non-identifying telemetry (e.g. `source_selected`, `save_completed`, `item_count`) via Firebase Analytics. Can be disabled in app settings. |
| **Crash & Diagnostics** | Do you collect crash reports or performance metrics? | **Yes** | Firebase Crashlytics records stack traces and device models for stability. File paths and filenames are scrubbed before transmission. |
| **Device or Other IDs** | Do you collect Device IDs or Advertising IDs? | **Yes** | Google Mobile Ads (AdMob) processes advertising IDs for ad serving, subject to Google UMP consent choices. |
| **Data Sharing** | Is collected data shared with third parties? | **No** | Data is never sold or shared with data brokers. Only service providers (Google Firebase / Google AdMob) process technical requests. |
| **Security Practices** | Is data encrypted in transit? | **Yes** | All analytics and ad requests use TLS/HTTPS encryption. |
| **User Deletion** | Can users request data deletion? | **Yes** | Since no personal accounts exist, clearing app data or revoking analytics consent in settings permanently halts data collection. |

---

## 4. Android App Permissions Declaration

| Permission | Max SDK | Required Purpose |
| :--- | :--- | :--- |
| `android.permission.READ_EXTERNAL_STORAGE` | `28` (Android 9) | Reading status folders on legacy Android 8.0 - 9.0 devices. |
| `android.permission.WRITE_EXTERNAL_STORAGE` | `28` (Android 9) | Writing saved statuses to public albums on legacy Android 8.0 - 9.0 devices. |
| `android.permission.INTERNET` | None | Sending non-PII Firebase analytics/crash reports and loading AdMob ads. |
| `android.permission.ACCESS_NETWORK_STATE` | None | Checking network availability for graceful offline ad and analytics fallback. |
| `com.google.android.gms.permission.AD_ID` | None | Required by Google Play Services Ads SDK for personalized or non-personalized ad requests. |

---

## 5. Release Build & Signing Instructions

### Step 1: Prepare Keystore File
Generate a release signing key if you don't already have one:
```bash
keytool -genkey -v -keystore release-keys/od_status_saver_release.jks \
  -alias od_release_key -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure `keystore.properties`
Copy `keystore.properties.example` to `keystore.properties` (this file is excluded from Git):
```properties
storeFile=../release-keys/od_status_saver_release.jks
storePassword=YourStrongStorePassword
keyAlias=od_release_key
keyPassword=YourStrongKeyPassword
```

### Step 3: Inject Production AdMob IDs
Set production AdMob IDs via command line flags or in `~/.gradle/gradle.properties`:
```bash
./gradlew bundleRelease \
  -PADMOB_APP_ID="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX" \
  -PADMOB_BANNER_ID="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" \
  -PADMOB_INTERSTITIAL_ID="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" \
  -PADMOB_REWARDED_ID="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
```

The resulting optimized Android App Bundle is generated at:
`app/build/outputs/bundle/release/app-release.aab`
