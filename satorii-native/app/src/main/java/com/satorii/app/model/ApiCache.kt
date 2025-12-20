package com.satorii.app.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "api_cache")
data class ApiCache(
    @PrimaryKey val cacheKey: String,
    val responseJson: String,
    val timestamp: Long = System.currentTimeMillis()
)
