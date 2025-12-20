package com.satorii.app.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "favorite_videos")
data class FavoriteVideo(
    @PrimaryKey val id: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val addedAt: Long = System.currentTimeMillis()
)
