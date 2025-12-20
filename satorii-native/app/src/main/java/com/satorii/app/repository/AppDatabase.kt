package com.satorii.app.repository

import androidx.room.*
import com.satorii.app.model.ApiCache
import com.satorii.app.model.FavoriteVideo
import kotlinx.coroutines.flow.Flow

@Dao
interface FavoriteDao {
    @Query("SELECT * FROM favorite_videos ORDER BY addedAt DESC")
    fun getAllFavorites(): Flow<List<FavoriteVideo>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addFavorite(video: FavoriteVideo)

    @Delete
    suspend fun removeFavorite(video: FavoriteVideo)

    @Query("SELECT EXISTS(SELECT * FROM favorite_videos WHERE id = :videoId)")
    fun isFavorite(videoId: String): Flow<Boolean>
}

@Dao
interface HistoryDao {
    @Query("SELECT * FROM watch_history ORDER BY watchedAt DESC")
    fun getAllHistory(): Flow<List<WatchHistory>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addToHistory(history: WatchHistory)

    @Delete
    suspend fun removeFromHistory(history: WatchHistory)

    @Query("DELETE FROM watch_history")
    suspend fun clearHistory()

    @Query("SELECT * FROM watch_history WHERE id = :videoId LIMIT 1")
    suspend fun getHistoryItem(videoId: String): WatchHistory?
}

@Dao
interface PlaylistDao {
    @Query("SELECT * FROM playlists ORDER BY createdAt DESC")
    fun getAllPlaylists(): Flow<List<Playlist>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun createPlaylist(playlist: Playlist)

    @Delete
    suspend fun deletePlaylist(playlist: Playlist)

    @Query("SELECT * FROM playlist_items WHERE playlistId = :playlistId ORDER BY addedAt DESC")
    fun getPlaylistItems(playlistId: String): Flow<List<PlaylistItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addToPlaylist(item: PlaylistItem)

    @Delete
    suspend fun removeFromPlaylist(item: PlaylistItem)

    @Query("DELETE FROM playlist_items WHERE playlistId = :playlistId")
    suspend fun clearPlaylist(playlistId: String)
}

@Dao
interface ApiDao {
    @Query("SELECT * FROM api_cache WHERE cacheKey = :key")
    suspend fun getCache(key: String): ApiCache?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveCache(cache: ApiCache)

    @Query("DELETE FROM api_cache WHERE timestamp < :expiry")
    suspend fun clearOldCache(expiry: Long)
}

@Database(entities = [FavoriteVideo::class, WatchHistory::class, Playlist::class, PlaylistItem::class, ApiCache::class], version = 3)
abstract class AppDatabase : RoomDatabase() {
    abstract fun favoriteDao(): FavoriteDao
    abstract fun historyDao(): HistoryDao
    abstract fun playlistDao(): PlaylistDao
    abstract fun apiDao(): ApiDao
}
