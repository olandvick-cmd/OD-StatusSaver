package com.odstatussaver.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "saved_statuses")
data class SavedStatusEntity(
    @PrimaryKey
    val originalId: String,
    val title: String,
    val savedUri: String,
    val mediaType: String, // "IMAGE" or "VIDEO"
    val source: String,    // "STANDARD" or "BUSINESS"
    val sizeBytes: Long,
    val savedAt: Long = System.currentTimeMillis()
)
