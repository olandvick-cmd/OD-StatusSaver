# How to Get Your OD Status Saver APK & AAB

This guide provides 3 straightforward methods to get the installable `.apk` file (for direct installation on any Android phone) or `.aab` bundle (for Google Play Console).

---

## Method 1: Using Android Studio (Recommended for Direct Install & Testing)

1. **Download / Clone the Project**:
   - In AI Studio, click the menu or export button to export your codebase to a GitHub repository or download the ZIP.
2. **Open in Android Studio**:
   - Launch [Android Studio](https://developer.android.com/studio) (Hedgehog, Iguana, Jellyfish, or newer).
   - Select **Open** and select the root directory of this project.
   - Wait 1–2 minutes for Gradle to sync dependencies automatically.
3. **Generate the Debug APK**:
   - In the top menu bar, click:
     `Build` ➔ `Build Bundle(s) / APK(s)` ➔ `Build APK(s)`
   - When the build finishes, a notification appears in the lower-right corner:
     `APK(s) generated successfully for 1 module: Locate`
   - Click **Locate**. The generated file is:
     `app/build/outputs/apk/debug/app-debug.apk`
4. **Install on Your Phone**:
   - **Via USB**: Plug in your Android phone, enable USB Debugging, and hit the green **Run (▶)** button in Android Studio.
   - **Or via File Transfer**: Send `app-debug.apk` to your phone via Google Drive, Telegram, WhatsApp, or USB transfer, and tap the file to install.

---

## Method 2: 100% Cloud Build via GitHub Actions (No Local Setup Required)

If you don't have Android Studio installed, you can let GitHub build it for you in the cloud:

1. Push your repository to **GitHub** (or export from AI Studio to GitHub).
2. The included `.github/workflows/build-apk.yml` file will automatically run upon push.
3. In your GitHub repository:
   - Click on the **Actions** tab at the top.
   - Click the latest workflow run: `Build Android APK`.
   - Scroll down to the **Artifacts** section at the bottom.
   - Click `od-status-saver-debug-apk` to download the zip containing `app-debug.apk`.
4. Unzip the file and install `app-debug.apk` directly on any Android device running Android 7.0 (API 24) to Android 14+ (API 34+).

---

## Method 3: Using the Command Line (Terminal)

If you have JDK 17+ and the Android SDK installed on your machine:

```bash
# Make gradlew executable (Linux/macOS)
chmod +x gradlew

# Build debug APK:
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Build release bundle (AAB) for Google Play Store:
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Generating a Signed Release APK / AAB for Google Play

1. Generate a keystore if you don't have one:
   ```bash
   keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias odstatussaver
   ```
2. Copy `keystore.properties.example` to `keystore.properties`:
   ```properties
   storeFile=../release.jks
   storePassword=your_store_password
   keyAlias=odstatussaver
   keyPassword=your_key_password
   ```
3. Run:
   ```bash
   ./gradlew assembleRelease
   ```
   The signed release APK will be in `app/build/outputs/apk/release/app-release.apk`.
