# OD Status Saver - Web Administration Dashboard Architecture & Guide

This document describes the architecture, security enforcement, role-based access control (RBAC), and service integrations for the **OD Status Saver Web Administration Dashboard**.

---

## 1. Executive Summary & Privacy Invariants

The OD Status Saver Administration Dashboard is a private, responsive web application engineered to manage live app announcements, maintenance flags, and advertising placement pacing, while monitoring high-level aggregated performance metrics.

### Non-Negotiable Privacy Guarantees
1. **Zero Phone Number Collection:** Neither the Android client nor the Web Admin Dashboard ever solicits, accepts, or stores user telephone numbers.
2. **Zero Media Uploads:** All WhatsApp and WhatsApp Business status media files remain strictly 100% on the user's local device (`MediaStore` and SAF private tree cache). Status images or videos are **never** uploaded to Firebase, Cloud Storage, or external servers.
3. **Zero Contact Harvesting:** The app requests zero address book or contacts permissions.
4. **No Accounts Required for Mobile Users:** End-users save statuses without logging in or providing identifying credentials.
5. **No Fake Metrics:** The dashboard presents real aggregate data or clearly indicates disconnected sync status; it never displays fabricated numbers disguised as live production metrics.

---

## 2. Role-Based Access Control (RBAC) & Security Architecture

### Role Hierarchy
The dashboard implements three distinct administrative tiers enforced at both the client interface and Firestore Security Rules:

| Role | Permissions & Scope |
| :--- | :--- |
| **Owner** | Full root authority. Can manage/revoke administrator accounts, promote users, configure remote feature flags, update maintenance mode, adjust ad pacing, resolve crashes, and export aggregate data. Pre-seeded to: `Olandvick@gmail.com`. |
| **Administrator** | Operational management. Can publish app announcements, toggle maintenance mode, adjust ad frequency/cooldown rules, triage and update crash reports, invite read-only analysts, and export data. Cannot promote accounts to Owner or delete Owner records. |
| **Analyst** | Read-only analytics viewer. Can inspect DAU/MAU trends, source usage ratios (WhatsApp vs WhatsApp Business), crash metrics, AdMob revenue estimates, and export sanitized aggregate CSV data. Cannot modify app configuration or team rosters. |

### Public Registration Prohibited
- There is **no sign-up form** or self-registration.
- Firestore security rules strictly reject `create` on `/admins/{uid}` unless the requesting user is already authenticated as an `Owner` or `Administrator`, or is the pre-seeded owner bootstrap account (`Olandvick@gmail.com` with `email_verified == true`).
- If an unapproved user signs in via Google OAuth, Firestore denies document access and the application renders an **Access Denied** security barrier.

---

## 3. Firestore Collections & Security Rules Schema

The database is provisioned in project `opportune-stone-8cxst` under Firestore database `ai-studio-odstatussaver-39c8e27e-f323-4029-b4fc-7840aa1c0f81`.

### Data Collections
1. **`/admins/{uid}`**
   - Stores approved administrative user profiles (`email`, `role`, `displayName`, `addedAt`, `addedBy`).
   - Read: `isAnalyst()` or self.
   - Write: `isOwner()` or `isAdmin()` (with tier checks).
2. **`/app_config/{configId}`** (Default document: `global`)
   - Stores remote feature flags (`maintenanceMode`, `maintenanceMessage`, `announcementActive`, `announcementTitle`, `announcementBody`, `adBannerEnabled`, `adInterstitialFrequency`, `adCooldownMinutes`, `rewardedAdEnabled`, `minAppVersion`).
   - Read: Public get for mobile clients (no account required).
   - Write: `isAdmin()` or `isOwner()`.
3. **`/audit_logs/{logId}`**
   - Immutable append-only log of every administrative mutation.
   - Read: `isAnalyst()`.
   - Create: Authorized admins/analysts.
   - **Update / Delete: Strictly `false` (Immutable).**
4. **`/analytics_aggregates/{date}`** (Format: `YYYY-MM-DD`)
   - Daily aggregate usage counts (`dau`, `mau`, `newUsers`, `sessions`, `whatsappSelected`, `whatsappBusinessSelected`, `previewsCount`, `saveSuccess`, `saveErrors`).
   - Zero PII: Strictly numeric counters.
5. **`/crash_reports/{reportId}`**
   - Sanitized exception summaries (`exceptionType`, `message`, `appVersion`, `androidVersion`, `deviceModel`, `occurrences`, `status`).
6. **`/admob_reports/{date}`**
   - Authorized AdMob revenue reports (`impressions`, `clicks`, `estimatedEarnings`, `ecpm`, `adFormat`).

---

## 4. Google Cloud & AdMob Reporting API Setup

To enable automated daily synchronization from your real AdMob publisher account into the dashboard:

1. **Enable the AdMob API in Google Cloud:**
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/) for project `opportune-stone-8cxst`.
   - In **APIs & Services > Library**, search for and enable **AdMob API**.
2. **Create a Service Account:**
   - In **IAM & Admin > Service Accounts**, create `admob-reporting-sync@opportune-stone-8cxst.iam.gserviceaccount.com`.
   - Grant role: **Project Viewer**.
3. **Link Service Account in AdMob Console:**
   - Go to [AdMob Console](https://apps.admob.com) > **Settings** > **Manage Users**.
   - Add the service account email and grant **Viewer** permissions.
4. **Deploy Scheduled Daily Sync Function:**
   - A Cloud Function scheduled via Cloud Scheduler (e.g., daily at 02:00 UTC) invokes `admob.accounts.networkReport.generate` with metrics `[ESTIMATED_EARNINGS, IMPRESSIONS, CLICKS, IMPRESSION_CTR, IMPRESSION_RPM]` and writes the resulting daily totals to Firestore collection `/admob_reports/YYYY-MM-DD`.

---

## 5. Remote Config & Ad Placement Guardrails

The dashboard provides granular control over ad pacing and user communications, adhering to the following hard rules:
- **No Deceptive Placements:** Banner ads are pinned with safe margins, strictly separate from status saving and preview buttons.
- **Save Pacing:** Interstitial ads are throttled by `adInterstitialFrequency` (recommended: 3 to 5 saves) with an enforced minimum cooldown (`adCooldownMinutes`), preventing disruptive back-to-back interruptions.
- **Consent Precedence:** The mobile app checks Google User Messaging Platform (UMP) consent prior to requesting any ad network payloads. Remote Config can never bypass missing user consent or COPPA/GDPR flags.
- **Fail-Safe Offline Mode:** If network is unavailable or ad requests fail, the media-saving engine operates completely unrestricted.

---

## 6. Audit Trail & CSV Export

- **Audit Logs:** Every change to app configuration, ad settings, or team membership is permanently logged with actor UID, timestamp, action type, and parameter diff.
- **Sanitized CSV Export:** Analysts and Administrators can export daily aggregated history with a single click. The generator validates that exported columns contain only aggregate counts, preserving user privacy.
