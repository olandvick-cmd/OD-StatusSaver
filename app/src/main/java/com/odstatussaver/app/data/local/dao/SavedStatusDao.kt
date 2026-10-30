package com.odstatussaver.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.odstatussaver.app.data.local.entity.SavedStatusEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SavedStatusDao {

    @Query("SELECT * FROM saved_statuses ORDER BY savedAt DESC")
    fun getAllSavedStatuses(): Flow<List<SavedStatusEntity>>

    @Query("SELECT savedUri FROM saved_statuses WHERE originalId = :originalId LIMIT 1")
    suspend fun getSavedUriForId(originalId: String): String?

    @Query("SELECT originalId FROM saved_statuses")
    fun getAllSavedOriginalIds(): Flow<List<String>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: SavedStatusEntity)

    @Query("DELETE FROM saved_statuses WHERE originalId = :originalId")
    suspend fun deleteByOriginalId(originalId: String)

    @Delete
    suspend fun delete(entity: SavedStatusEntity)
}
