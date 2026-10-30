package com.odstatussaver.app.domain.source

import android.net.Uri
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import kotlinx.coroutines.flow.Flow
import java.io.File

/**
 * Common abstraction for WhatsApp and WhatsApp Business media discovery sources.
 * Each source maintains independent package discovery, storage path probing,
 * and Storage Access Framework (SAF) tree URI configuration.
 */
interface MediaSource {
    val sourceType: WhatsAppSource
    val packageName: String
    val displayName: String

    /**
     * Checks if the backing messaging package is currently installed.
     */
    fun isInstalled(): Boolean

    /**
     * Returns candidate directory paths on physical storage where statuses may be cached.
     * Probes primary internal storage, secondary SD cards, and OEM cloned/dual messenger paths.
     */
    fun getCandidateDirectories(): List<File>

    /**
     * Determines whether direct filesystem access to status files is currently permitted and functional.
     */
    fun canAccessDirectly(): Boolean

    /**
     * Checks whether a valid and active Storage Access Framework (SAF) permission is held.
     */
    suspend fun hasSafPermission(): Boolean

    /**
     * Checks if either direct access OR valid SAF permission is active.
     */
    suspend fun hasAccess(): Boolean

    /**
     * Gets the currently persisted SAF Tree URI for this specific source, if any.
     */
    suspend fun getPersistedTreeUri(): Uri?

    /**
     * Saves and takes persistable URI permissions for this specific source.
     */
    suspend fun setPersistedTreeUri(treeUri: Uri)

    /**
     * Clears/revokes the stored tree URI for this source, allowing reconfiguration.
     */
    suspend fun clearPersistedTreeUri()

    /**
     * Discovers all valid, readable image and video statuses in this source.
     * Filters out non-media, empty, or corrupt files and sorts by latest modification time.
     */
    suspend fun discoverStatuses(): Result<List<StatusItem>>

    /**
     * Validates whether an individual status file or URI is still readable (has not expired/deleted).
     */
    suspend fun isStatusAccessible(item: StatusItem): Boolean
}
