# Privacy Policy for OD Status Saver

**Last Updated:** October 28, 2026

OD Status Saver ("we", "our", or "the App") is developed by the OD Development Team. We are committed to protecting your privacy. This Privacy Policy explains our practices regarding the collection, use, and disclosure of information when you use OD Status Saver on Android devices.

---

### 1. Summary of Core Privacy Guarantees
- **No Account Required:** You do not need to create an account, register, or provide an email address, phone number, or name to use OD Status Saver.
- **On-Device Media Processing:** All photos, videos, and statuses from WhatsApp and WhatsApp Business are accessed, displayed, and saved strictly on your local device. We NEVER upload, transmit, copy, or store your photos, videos, or statuses on external servers.
- **No Access to Private Conversations or Contacts:** OD Status Saver cannot and does not read your WhatsApp chats, contact lists, messages, call logs, or audio conversations.
- **Zero Sale of User Data:** We do not sell, rent, or trade your personal data to advertisers, data brokers, or third parties.

---

### 2. Information We Access On-Device

To provide the status saving feature, the App accesses:
- **WhatsApp & WhatsApp Business Status Folders:** When you grant permission via Android's Storage Access Framework (SAF) or legacy storage permissions, the App reads files located within the dedicated `.Statuses` directory.
- **Device Storage:** When you choose to save a status, the App writes the photo or video file to your device's public media directories (`Pictures/ODStatusSaver` or `Movies/ODStatusSaver`).

This media remains exclusively on your device and under your control.

---

### 3. Automatically Collected Technical Data

To ensure application stability, diagnose crashes, and evaluate feature performance, the App integrates with reputable Google developer services:

#### A. Google Firebase Analytics
We collect aggregate, non-personally identifiable telemetry to measure app usage (e.g., app launches, whether a user chooses WhatsApp or WhatsApp Business, and save completion counts).
- **Zero Media Filename Exposure:** Media filenames, contact identifiers, phone numbers, and directory paths are never sent to Firebase.
- **Opt-Out Control:** You can disable analytics data collection at any time in the App's **Settings > User Privacy & Analytics**.

#### B. Google Firebase Crashlytics
If the App encounters an unexpected crash or critical error, Crashlytics collects technical diagnostics including stack traces, device model, Android OS version, and memory state. These reports are scrubbed of any file paths or status content before transmission.

#### C. Google Mobile Ads (AdMob) & User Messaging Platform (UMP)
OD Status Saver displays optional in-app advertisements through the Google Mobile Ads SDK.
- The Google Mobile Ads SDK may use advertising identifiers (such as Google Advertising ID) and device metadata to serve advertisements.
- We integrate the **Google User Messaging Platform (UMP)** to present consent options compliant with GDPR, UK GDPR, and CCPA/CPRA regulations.
- You can review and update your advertising privacy preferences at any time via the in-app privacy options form.

---

### 4. Android Device Permissions Used

- `android.permission.READ_EXTERNAL_STORAGE` (Android 8.0 - 9.0 only): Used on legacy Android devices to read status files.
- `android.permission.WRITE_EXTERNAL_STORAGE` (Android 8.0 - 9.0 only): Used on legacy Android devices to save media to the public gallery.
- `android.permission.INTERNET` & `android.permission.ACCESS_NETWORK_STATE`: Used to communicate with Firebase servers for non-PII diagnostic reports and to request AdMob ads.
- `com.google.android.gms.permission.AD_ID`: Used to support compliant ad serving via Google Play Services.

We do NOT request sensitive permissions such as Camera, Microphone, Contacts, Location, SMS, or Phone State.

---

### 5. Third-Party Service Providers
Our third-party providers process data in accordance with their respective privacy policies:
- **Google Play Services:** https://policies.google.com/privacy
- **Google Firebase:** https://firebase.google.com/support/privacy
- **Google AdMob:** https://policies.google.com/technologies/ads

---

### 6. Children's Privacy
OD Status Saver is designed for a general audience (ages 13 and older, consistent with WhatsApp terms of service) and does not knowingly collect information from children under the age of 13.

---

### 7. Changes to This Privacy Policy
We may update our Privacy Policy periodically. Any updates will be posted in this document and reflected in future app updates.

---

### 8. Contact Us
If you have questions or concerns about this Privacy Policy or the security of OD Status Saver, you may contact the development team at:
- **Email:** `privacy@odstatussaver.app` or `Olandvick@gmail.com`
