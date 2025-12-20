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

@Entity(tableName = "watch_history")
data class WatchHistory(
    @PrimaryKey val id: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val watchedAt: Long = System.currentTimeMillis(),
    val position: Long = 0
)

@Entity(tableName = "playlists")
data class Playlist(
    @PrimaryKey val id: String,
    val name: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "playlist_items", primaryKeys = ["playlistId", "videoId"])
data class PlaylistItem(
    val playlistId: String,
    val videoId: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val addedAt: Long = System.currentTimeMillis()
)
