# OD Status Saver - Manual & Physical Device Testing Plan

This document defines the physical device verification matrix, reproduction steps, and validation checklist for real WhatsApp status discovery and media saving across Android versions.

---

## 1. Physical Device Test Matrix

| Device Brand & Model | OS & API Version | Storage Mechanism Tested | Target Test Verification |
| :--- | :--- | :--- | :--- |
| **Google Pixel 4 / Android 9 Emulator** | Android 9.0 (API 28) | Legacy `READ_EXTERNAL_STORAGE` + `java.io.File` | Probes legacy `/WhatsApp/Media/.Statuses`. Confirms runtime permission prompt and saving to `Pictures/ODStatusSaver`. |
| **Samsung Galaxy S10 / Android 10** | Android 10.0 (API 29) | `requestLegacyExternalStorage="true"` + Scoped Transition | Probes both modern `Android/media` and legacy paths. Confirms direct file reading. |
| **Google Pixel 7 / Android 13** | Android 13.0 (API 33) | Storage Access Framework (SAF) Tree Picker | Validates `ACTION_OPEN_DOCUMENT_TREE` deep-link. Confirms `takePersistableUriPermission` across app force-stop and device reboot. |
| **Samsung Galaxy S23 / Android 14** | Android 14.0 (API 34 - OneUI 6) | SAF Tree Picker on OEM Document Provider | Tests OneUI's system files picker restriction when selecting `Android/media`. Confirms guided "Use this folder" UX. |
| **Xiaomi / Redmi / Android 14** | HyperOS / MIUI 14 | Dual Messenger & Cloned Apps | Confirms candidate path probe for `/storage/emulated/999/Android/media/com.whatsapp/...`. |
| **Pixel 9 / Android 15** | Android 15.0 (API 35) | MediaStore Audio/Video API (`IS_PENDING`) | Verifies zero-permission public saving to `Pictures/ODStatusSaver` and immediate indexing in Google Photos. |

---

## 2. Test Procedures & Pass/Fail Criteria

### Scenario A: First Run & Storage Onboarding
1. Install OD Status Saver on Android 13+.
2. Launch the app. Ensure TopAppBar renders Refresh and Settings icons.
3. Observe status state: "Storage Permission Required".
4. Tap "Grant Folder Access".
5. **Expected**: System document picker opens with deep link to `com.whatsapp/WhatsApp/Media/.Statuses`.
6. Tap "Use this folder" then "Allow".
7. **Expected**: Permission is stored in DataStore, screen refreshes, and viewed WhatsApp statuses populate the 2-column grid.

### Scenario B: Individual & Multi-Select Bulk Saving
1. Long-press on any status card to enter selection mode.
2. Select 3 images and 1 video. Tap "Select All", then deselect 1 item.
3. Tap "Save (3)".
4. **Expected**: Progress bar shows "Saving to Gallery (1/3... 3/3)".
5. Open device Google Photos or Samsung Gallery.
6. **Expected**: The 3 files appear in the "OD Status Saver" album without quality loss.

### Scenario C: WhatsApp Business Independence
1. Switch to "WA Business" tab.
2. If WhatsApp Business is not installed, verify: "WhatsApp Business is Not Installed" message.
3. If installed, verify folder permission is requested separately from standard WhatsApp.
4. Verify WhatsApp statuses and WA Business statuses do not mix in their respective tabs.
5. In "Saved" tab, verify saved items from both sources appear together, with source badges.

### Scenario D: Edge Cases & Error Handling
1. **Expired Status**: View a status in WhatsApp. Delete it or wait 24 hours. Tap "Save" in OD Status Saver.
   * *Expected*: Shows "This status has expired or was removed by WhatsApp" without crashing.
2. **0-Byte / Corrupt File**: Place a 0-byte dummy file in WhatsApp cache.
   * *Expected*: Automatically excluded from grid discovery.
3. **Revoked SAF Permission**: Go to Android Settings > Apps > Special App Access or clear Document permissions.
   * *Expected*: App detects `SecurityException`, prompts user to re-grant folder permission, without crashing.

### Scenario E: MIME-Type & Gallery Indexing Verification
1. **PNG / WebP / JPEG Images**: Save statuses across different image formats.
   * *Expected*: Files are inserted into MediaStore with `image/png`, `image/webp`, and `image/jpeg` respectively. Thumbnail previews render with proper aspect ratio in Google Photos.
2. **MP4 / 3GP / MKV Videos**: Save statuses across various container formats.
   * *Expected*: Files are inserted into `Movies/ODStatusSaver` with `video/mp4`, `video/3gpp`, and `video/x-matroska`. Video durations and seek bars function accurately in local media players.

### Scenario F: Low Storage & Interrupted Saves Cleanup
1. **Simulate Insufficient Storage**: Fill device storage until less than 20MB remains.
   * *Expected*: App rejects save attempt with "Not enough free storage space on device" before attempting I/O; zero bytes leaked to MediaStore.
2. **Interrupted Saving**: Initiate a multi-item bulk save and forcefully back out or rotate the device during the write operation.
   * *Expected*: Coroutine cancellation catches the interrupt, immediately deletes any partial `IS_PENDING` MediaStore rows, and leaves zero corrupt 0-byte orphan files in the gallery.

### Scenario G: Android 14/15 OEM DocumentsUI Folder Selection
1. **Parent Folder Selection vs .Statuses**:
   * If OEM picker (e.g. Samsung OneUI / Xiaomi HyperOS) hides dot-directories and forces the user to select `WhatsApp/Media`, verify that `BaseStatusMediaSource` automatically resolves the `.Statuses` subfolder and populates media.
   * If user explicitly selects `.Statuses`, verify that direct listing functions identically.
