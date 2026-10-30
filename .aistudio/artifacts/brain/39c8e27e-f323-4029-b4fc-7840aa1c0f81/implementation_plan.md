# OD Status Saver: Production-Quality Kotlin Android App & Admin Architecture

A high-performance, privacy-first native Android application built with Kotlin, Jetpack Compose, and Material 3 to discover, view, and save status images and videos from WhatsApp and WhatsApp Business directly on-device.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural direction and scope have been synthesized based on your verified project configuration, confirmed clarification preferences, and updated brand identity: **OD Status Saver**.

- **App Name & Branding**: **OD Status Saver** (`com.odstatussaver.app`).
- **Confirmed Repository Structure**: Android Gradle project structured at root, with the future web admin dashboard located in a `/web` subfolder.
- **Confirmed Android Compatibility**: Minimum SDK set to **Android 8.0 (API 26)** and Target SDK set to **Android 15 (API 35)**, balancing modern Compose / SAF features with wide device reach.
- **Confirmed Storage Access Strategy**: Hybrid Direct Path inspection on `Android/media/` with automated **Storage Access Framework (SAF)** fallback when OEM security policies block direct file listing.
- **Privacy & Safety Non-Negotiables**:
  1. Zero user accounts or phone number requirements for basic status viewing and saving.
  2. 100% on-device streaming (`ContentResolver` to `MediaStore`); no media bytes or file hashes are ever transmitted off the device.
  3. WhatsApp and WhatsApp Business are strictly isolated as independent media sources.
  4. Core media-saving workflow is built and verified prior to advertising, analytics, or the admin dashboard.

---

## 1. Overview & Core Concept

### What It Does
**OD Status Saver** allows users to preview and save disappearing status images and videos posted by contacts on WhatsApp and WhatsApp Business before they expire (24 hours). The app scans the local staging cache where WhatsApp temporarily stores viewed media, renders them in a responsive Material 3 media gallery, offers an immersive full-screen media viewer with built-in pinch-to-zoom and Jetpack Media3 (ExoPlayer) playback, and writes saved media permanently into the user's public device gallery (`Pictures/ODStatusSaver` and `Movies/ODStatusSaver`).

### Target Audience & Persona
- Everyday WhatsApp and WhatsApp Business users who want to retain memorable media without asking senders to re-send files.
- Small business owners and community managers using WhatsApp Business who wish to archive product flyers, promotional videos, and supplier updates.

### Key Value
- **Zero Account Overhead & Frictionless**: Instant access upon launch without logins or phone number entry.
- **Privacy-Guaranteed**: Compliant with Android Scoped Storage guidelines, using supported public APIs with zero server ingestion.
- **Dual-Source Isolation**: Clean toggle between standard WhatsApp and WhatsApp Business without mixed caches.

---

## 2. Modern Android Storage Reality & Limitations

### The Technical Challenge on Android 11+ (API 30–35)
In Android 10 (API 29), Google introduced Scoped Storage. In Android 11 (API 30) and above, direct filesystem access to other apps' external directories was deprecated. 

WhatsApp subsequently relocated its temporary status cache:
- **Standard WhatsApp:**
  - *Legacy (< Android 10):* `/storage/emulated/0/WhatsApp/Media/.Statuses`
  - *Modern (Android 10+):* `/storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/.Statuses`
- **WhatsApp Business:**
  - *Legacy (< Android 10):* `/storage/emulated/0/WhatsApp Business/Media/.Statuses`
  - *Modern (Android 10+):* `/storage/emulated/0/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses`

### What Is Technically Supported vs. What Requires Device Testing

| Android Version | Storage Technique | Supported Behavior | Real-World Device Quirk / Testing Need |
| :--- | :--- | :--- | :--- |
| **Android 8.0 – 9.0 (API 26–28)** | `READ_EXTERNAL_STORAGE` + standard `java.io.File` | 100% standard file IO to legacy path. Fully supported. | Requires runtime storage permission grant. |
| **Android 10 (API 29)** | `requestLegacyExternalStorage="true"` + `File` | Allows direct reading of both legacy and modern paths. | Seamless on 99% of Android 10 ROMs. |
| **Android 11 – 12 (API 30–32)** | Hybrid: Direct path read on `Android/media/` OR SAF `ACTION_OPEN_DOCUMENT_TREE` | Direct `File.listFiles()` works on some OEM builds (e.g. stock Pixels), but fails on others. SAF tree grant is the official fallback. | Needs testing on Samsung OneUI & Xiaomi MIUI where `Android/media` direct access may throw `SecurityException`. |
| **Android 13 – 15 (API 33–35)** | Storage Access Framework (SAF) `DocumentFile` with persistable URI | Official Google-supported path. Prompt user once with a deep-link intent to grant access to the WhatsApp media tree. | Google Files picker on Android 13+ occasionally restricts selecting the root `Android/media` folder. Deep-linking directly to `com.whatsapp` directory resolves this. |
| **Saving Media (All Versions)** | `MediaStore` Audio/Video/Images API | Zero permissions needed on Android 10+ to write new items to `Pictures/ODStatusSaver` or `Movies/ODStatusSaver`. | Ensure `IS_PENDING = 1` during write, set to `0` once streaming finishes. |

> [!WARNING]
> Google Play policy strictly rejects apps requesting `MANAGE_EXTERNAL_STORAGE` (All Files Access) for status saving purposes. Any app using that permission faces immediate removal. The SAF tree approach (`ACTION_OPEN_DOCUMENT_TREE`) + `MediaStore` is the only sustainable, policy-compliant architecture.

---

## 3. Project Architecture & System Design

The application follows Google's recommended Modern Android Architecture (Clean Architecture + MVI/MVVM with Unidirectional Data Flow):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 UI Layer (Jetpack Compose + Material 3)                     │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐  │
│  │ WhatsApp Screen       │ │ Business Screen       │ │ Saved Media Screen│  │
│  │ (StatusGrid, Filter)  │ │ (StatusGrid, Filter)  │ │ (Gallery, Detail) │  │
│  └───────────┬───────────┘ └───────────┬───────────┘ └─────────┬─────────┘  │
│              └────────────────────┐    │    ┌──────────────────┘            │
│                                   ▼    ▼    ▼                               │
│                         StatusViewModel / SavedViewModel                    │
│                         (StateFlow<StatusUiState>, Channel)                 │
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────┐
│                             Domain Layer                                     │
│  - GetStatusesUseCase(source: WhatsAppSource)                                │
│  - SaveStatusUseCase(mediaItem: StatusItem)                                  │
│  - ShareStatusUseCase(mediaItem: StatusItem)                                 │
│  - RepostStatusUseCase(mediaItem: StatusItem)                                │
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────┐
│                             Data Layer                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ StatusRepositoryImpl                                                 │   │
│  │  ├─ MediaScanner (Direct File IO fallback for API 26-29)             │   │
│  │  ├─ SafDocumentScanner (DocumentFile tree traversal for API 30+)    │   │
│  │  └─ MediaStoreSaver (Streams bytes to Pictures/Movies via ContentRes)│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   ┌────────────────────────────────┐   │
│  │ DataStorePreferences            │   │ Room Local Database            │   │
│  │ - Persisted SAF Tree URIs       │   │ - Saved status metadata        │   │
│  │ - User preferences (Grid layout)│   │ - Save timestamp, source type  │   │
│  └─────────────────────────────────┘   └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Proposed Package & Directory Structure

```
/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/odstatussaver/app/
│       │   │   ├── ODStatusSaverApp.kt                // Application class
│       │   │   ├── core/
│       │   │   │   ├── common/                        // Result wrappers, DispatcherProvider
│       │   │   │   ├── constants/AppConstants.kt      // WhatsApp packages & directory paths
│       │   │   │   ├── extensions/                    // Uri, File, Context, Coroutine helpers
│       │   │   │   └── theme/                         // Material 3 Color, Type, Shape, Theme
│       │   │   ├── data/
│       │   │   │   ├── local/
│       │   │   │   │   ├── dao/SavedStatusDao.kt      // Room DAO for saved items
│       │   │   │   │   ├── entity/SavedStatusEntity.kt// Room entity
│       │   │   │   │   ├── database/AppDatabase.kt    // Room DB definition
│       │   │   │   │   └── preferences/SafPrefStore.kt// DataStore for SAF tree URIs
│       │   │   │   ├── mapper/StatusMapper.kt         // File/DocumentFile to StatusItem domain
│       │   │   │   ├── repository/StatusRepositoryImpl.kt
│       │   │   │   └── source/
│       │   │   │       ├── DirectFileScanner.kt       // Legacy & direct file scanner
│       │   │   │       ├── SafDocumentScanner.kt      // DocumentFile SAF scanner
│       │   │   │       └── MediaStoreSaver.kt         // On-device ContentResolver streaming
│       │   │   ├── domain/
│       │   │   │   ├── model/
│       │   │   │   │   ├── StatusItem.kt              // Core model (uri, path, isVideo, size)
│       │   │   │   │   └── WhatsAppSource.kt          // STANDARD vs BUSINESS enum
│       │   │   │   ├── repository/StatusRepository.kt // Repository contract
│       │   │   │   └── usecase/                       // Fetch, Save, Share, Delete use cases
│       │   │   ├── di/                                // Dependency Injection (Hilt or Koin)
│       │   │   └── ui/
│       │   │       ├── navigation/AppNavigation.kt    // NavHost & Routes
│       │   │       ├── components/                    // StatusCard, MediaPreview, TopBar, EmptyState
│       │   │       ├── screens/
│       │   │       │   ├── home/HomeScreen.kt         // Dual WhatsApp tabs + pager
│       │   │       │   ├── status/StatusGridScreen.kt // Grid view for current source
│       │   │       │   ├── viewer/MediaViewerScreen.kt// Fullscreen zoom image & ExoPlayer video
│       │   │       │   ├── saved/SavedMediaScreen.kt  // Saved items tab
│       │   │       │   └── permission/SafOnboardingDialog.kt // Visual guide to grant folder access
│       │   │       └── viewmodel/StatusViewModel.kt
│       │   └── res/
│       │       ├── drawable/                          // Vectors and launcher icons
│       │       ├── values/                            // strings.xml, colors.xml
│       │       └── xml/file_paths.xml                 // FileProvider paths for sharing
│       ├── test/                                      // Unit tests (JUnit, MockK, Robolectric)
│       └── androidTest/                               // Compose UI tests & Room instrumented tests
├── web/                                               // Future Web Admin Dashboard
│   ├── package.json
│   ├── src/                                           // Admin dashboard (remote config, ad flags)
│   └── vite.config.ts
├── build.gradle.kts                                   // Root Gradle config
├── settings.gradle.kts                                // Gradle modules config
└── gradle/libs.versions.toml                          // Version catalog (Dependencies)
```

---

## 5. Technology Stack & Dependencies

| Component | Library / Framework | Version Specification | Rationale |
| :--- | :--- | :--- | :--- |
| **Language & Tooling** | Kotlin + Android Gradle Plugin | Kotlin 2.0.x, AGP 8.5.x | Modern compiler with Compose compiler plugin built-in |
| **UI System** | Jetpack Compose + Material 3 | Compose BOM 2024.09.x+ | Dynamic colors, adaptive layouts, fluid animations |
| **Image Loading** | Coil 3 (`io.coil-kt.coil3:coil-compose`) | 3.0.x | Native coroutine/Compose support, video frame decoder |
| **Video Player** | Jetpack Media3 ExoPlayer | `androidx.media3:media3-exoplayer:1.4.x` | Industry-standard hardware-accelerated playback |
| **Architecture** | ViewModel, Lifecycle, Navigation | AndroidX Lifecycle 2.8.x, Navigation Compose 2.8.x | Clean lifecycle-aware UI state handling |
| **Local Persistence** | Room + DataStore Preferences | Room 2.6.x, DataStore 1.1.x | Lightweight caching of saved items & SAF URIs |
| **Storage API** | `androidx.documentfile:documentfile` | 1.0.1 | Official SAF tree traversal abstraction |
| **Concurrency** | Kotlin Coroutines & Flow | 1.8.x | Non-blocking background IO for file scanning and streaming |

---

## 6. Implementation Workflow & Sequence

```
Phase 1: Project Scaffolding & Core Foundations
  ├── Initialize root Android Gradle project with Version Catalog (libs.versions.toml)
  ├── Configure compileSdk 35, minSdk 26, targetSdk 35, namespace "com.odstatussaver.app"
  ├── Move current web assets into dedicated /web subfolder for the future admin dashboard
  └── Setup Material 3 design system tokens and navigation shell

Phase 2: Data Layer & On-Device Media Storage Pipeline
  ├── Implement WhatsAppSource & StatusItem domain models
  ├── Build DirectFileScanner (legacy/direct path scanner with safety fallbacks)
  ├── Build SafDocumentScanner (tree URI persistable traversal + mime filtering)
  ├── Implement MediaStoreSaver (ContentResolver byte streaming to Pictures/Movies)
  └── Implement DataStore for SAF permission state & Room DB for saved status tracking

Phase 3: UI & User Experience (Core Flow)
  ├── Implement TopBar with WhatsApp and WhatsApp Business tab switching
  ├── Create animated StatusGrid with 2/3 column layout and video duration indicators
  ├── Implement visual SAF Onboarding Guide dialog illustrating exactly how to grant folder access
  ├── Build Fullscreen Media Viewer (Pinch-to-zoom for photos, Media3 ExoPlayer for videos)
  └── Build One-tap Actions: Save, Share via FileProvider, Repost directly to WhatsApp

Phase 4: Saved Gallery & Management
  ├── Implement "Saved" tab with filtering (All / Images / Videos)
  ├── Multi-select batch saving and batch deletion for saved media
  └── Instant media refresh and file integrity checks

Phase 5: Testing & Hardening
  ├── Unit tests for scanner parsing, SAF URI handling, and ViewModel states
  ├── Mock SAF testing with Robolectric
  └── Edge-case validation: no WhatsApp installed, empty status folder, unread status states

Phase 6: Future Extensions (Isolated)
  ├── Add Firebase Analytics & Crashlytics (anonymized, zero-PII, no phone numbers)
  ├── Add Google AdMob with strict frequency capping (banner & interstitial)
  └── Connect the `/web` dashboard for remote configuration & announcement banners
```

---

## 7. Key Technical Risks & Mitigation Strategies

1. **Risk: OEM Restrictions on Folder Selection in Android 13+**
   * *Mitigation:* The app constructs an exact deep-link `Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)` with `EXTRA_TITLE` and `DocumentsContract.EXTRA_INITIAL_URI` pointing directly to the target WhatsApp subfolder, accompanied by a clean step-by-step visual illustration guiding the user to tap "Use this folder".
2. **Risk: Hidden or Deleted WhatsApp Statuses**
   * *Mitigation:* WhatsApp statuses expire after 24 hours and are silently deleted by WhatsApp. The app handles `FileNotFoundException` and stale URIs gracefully, verifying file existence before initiating playback or save actions.
3. **Risk: Memory Spikes on High-Resolution Media**
   * *Mitigation:* Thumbnails are loaded with downscaled sampling via Coil. Media saving streams directly from input stream to output stream via an 8KB buffer without loading entire video files into memory.

---

## 8. Verification & Test Plan

- **Unit Testing**:
  - `StatusRepositoryTest`: Verifies correct filtering of `.nomedia` files, sorting by latest modification time, and separation of images from videos.
  - `StatusViewModelTest`: Verifies initial state, folder permission request triggers, successful media load, and error handling.
- **Instrumented & Robolectric Testing**:
  - `MediaStoreSaverTest`: Verifies correct insertion into `MediaStore.Images` and `MediaStore.Video`, checking MIME types and non-zero byte writes.
- **Physical Device Validation Matrix**:
  - Android 8.1 (API 27): Validates legacy direct file access and runtime permissions.
  - Android 10 (API 29): Validates legacy storage flag transition.
  - Android 13 (API 33 - Pixel): Validates modern SAF picker and MediaStore public saving.
  - Android 14/15 (API 34/35 - Samsung/Xiaomi): Validates OEM-specific SAF picker constraints and permission persistence across device reboots (`takePersistableUriPermission`).
