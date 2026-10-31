package com.odstatussaver.app.data.source

import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.MediaStore
import com.odstatussaver.app.core.constants.AppConstants
import com.odstatussaver.app.domain.model.MediaType
import com.odstatussaver.app.domain.model.StatusItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import kotlin.coroutines.coroutineContext

sealed class SaveStatusOutcome {
    data class Success(val savedUri: Uri, val isDuplicate: Boolean = false) : SaveStatusOutcome()
    data class Failure(val error: SaveError, val message: String) : SaveStatusOutcome()
}

enum class SaveError {
    EXPIRED_OR_NOT_FOUND,
    INSUFFICIENT_STORAGE,
    PERMISSION_DENIED,
    CORRUPT_OR_EMPTY_FILE,
    IO_ERROR,
    CANCELLED
}

class MediaStoreSaver(private val context: Context) {

    /**
     * Checks if device storage has sufficient free space for the incoming file.
     */
    fun hasSufficientStorage(requiredBytes: Long): Boolean {
        return try {
            val stat = StatFs(Environment.getDataDirectory().path)
            val availableBytes = stat.availableBlocksLong * stat.blockSizeLong
            // Keep at least 20MB buffer beyond the file size
            availableBytes > (requiredBytes + 20 * 1024 * 1024)
        } catch (e: Exception) {
            true
        }
    }

    /**
     * Saves a single StatusItem into the public album (Pictures/ODStatusSaver or Movies/ODStatusSaver).
     * Prevents overwrites, preserves exact original byte stream without recompression,
     * and triggers media scanner indexing.
     */
    suspend fun save(item: StatusItem): SaveStatusOutcome = withContext(Dispatchers.IO) {
        try {
            coroutineContext.ensureActive()

            // 1. Verify storage space
            if (item.sizeBytes > 0 && !hasSufficientStorage(item.sizeBytes)) {
                return@withContext SaveStatusOutcome.Failure(
                    SaveError.INSUFFICIENT_STORAGE,
                    "Not enough free storage space on device."
                )
            }

            // 2. Open input stream and test readability (catch expired statuses)
            val inputStream: InputStream = try {
                openInputStream(item)
            } catch (e: FileNotFoundException) {
                return@withContext SaveStatusOutcome.Failure(
                    SaveError.EXPIRED_OR_NOT_FOUND,
                    "This status has expired or was removed by WhatsApp."
                )
            } catch (e: SecurityException) {
                return@withContext SaveStatusOutcome.Failure(
                    SaveError.PERMISSION_DENIED,
                    "Permission denied reading status."
                )
            } catch (e: Exception) {
                return@withContext SaveStatusOutcome.Failure(
                    SaveError.IO_ERROR,
                    "Unable to read status media: ${e.localizedMessage ?: "Unknown error"}"
                )
            }

            val ext = item.title.substringAfterLast('.', "").lowercase()
            val isVideo = item.mediaType == MediaType.VIDEO || AppConstants.SUPPORTED_VIDEO_EXTENSIONS.contains(ext)
            val mimeType = AppConstants.getMimeType(ext, isVideo)
            val relativeDir = if (isVideo) AppConstants.SAVE_DIR_MOVIES else AppConstants.SAVE_DIR_PICTURES

            val sanitizedName = item.title.replace("[^a-zA-Z0-9._-]".toRegex(), "_")
            val targetFileName = "OD_${System.currentTimeMillis()}_$sanitizedName"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val collectionUri = if (isVideo) {
                    MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                } else {
                    MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                }

                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, targetFileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, relativeDir)
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                }

                val targetUri = context.contentResolver.insert(collectionUri, values)
                    ?: return@withContext SaveStatusOutcome.Failure(
                        SaveError.IO_ERROR,
                        "Failed to create MediaStore entry."
                    )

                var bytesWritten = 0L
                try {
                    val outputStream: OutputStream = context.contentResolver.openOutputStream(targetUri)
                        ?: throw IOException("Failed to open MediaStore output stream.")

                    inputStream.use { input ->
                        outputStream.use { output ->
                            val buffer = ByteArray(8192)
                            var read: Int
                            while (input.read(buffer).also { read = it } != -1) {
                                coroutineContext.ensureActive()
                                output.write(buffer, 0, read)
                                bytesWritten += read
                            }
                            output.flush()
                        }
                    }

                    if (bytesWritten == 0L) {
                        context.contentResolver.delete(targetUri, null, null)
                        return@withContext SaveStatusOutcome.Failure(
                            SaveError.CORRUPT_OR_EMPTY_FILE,
                            "File was empty or corrupt (0 bytes written)."
                        )
                    }

                    // Release pending state so the file appears immediately in Google Photos / Gallery
                    values.clear()
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    context.contentResolver.update(targetUri, values, null, null)

                    SaveStatusOutcome.Success(targetUri)
                } catch (e: Exception) {
                    context.contentResolver.delete(targetUri, null, null)
                    throw e
                }
            } else {
                // Legacy saving for Android 8.0 - 9.0 (API 26-28)
                val baseDir = if (isVideo) {
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                } else {
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                }
                val albumDir = File(baseDir, "ODStatusSaver")
                if (!albumDir.exists() && !albumDir.mkdirs()) {
                    return@withContext SaveStatusOutcome.Failure(
                        SaveError.IO_ERROR,
                        "Failed to create destination album directory."
                    )
                }

                val destFile = File(albumDir, targetFileName)
                val outputStream = FileOutputStream(destFile)

                var bytesWritten = 0L
                try {
                    inputStream.use { input ->
                        outputStream.use { output ->
                            val buffer = ByteArray(8192)
                            var read: Int
                            while (input.read(buffer).also { read = it } != -1) {
                                coroutineContext.ensureActive()
                                output.write(buffer, 0, read)
                                bytesWritten += read
                            }
                            output.flush()
                        }
                    }
                } catch (e: Exception) {
                    if (destFile.exists()) destFile.delete()
                    throw e
                }

                if (bytesWritten == 0L) {
                    if (destFile.exists()) destFile.delete()
                    return@withContext SaveStatusOutcome.Failure(
                        SaveError.CORRUPT_OR_EMPTY_FILE,
                        "File was empty or corrupt."
                    )
                }

                // Trigger Android Media Scanner so it appears in device Gallery instantly
                MediaScannerConnection.scanFile(
                    context,
                    arrayOf(destFile.absolutePath),
                    arrayOf(mimeType),
                    null
                )

                SaveStatusOutcome.Success(Uri.fromFile(destFile))
            }
        } catch (e: kotlinx.coroutines.CancellationException) {
            SaveStatusOutcome.Failure(SaveError.CANCELLED, "Save operation was cancelled.")
        } catch (e: Exception) {
            SaveStatusOutcome.Failure(SaveError.IO_ERROR, e.localizedMessage ?: "Failed to save file.")
        }
    }

    private fun openInputStream(item: StatusItem): InputStream {
        return if (item.file != null && item.file.exists()) {
            FileInputStream(item.file)
        } else {
            context.contentResolver.openInputStream(item.uri)
                ?: throw FileNotFoundException("Could not open input stream from ${item.uri}")
        }
    }
}
