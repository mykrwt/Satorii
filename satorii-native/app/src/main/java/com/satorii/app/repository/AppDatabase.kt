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
interface ApiDao {
    @Query("SELECT * FROM api_cache WHERE cacheKey = :key")
    suspend fun getCache(key: String): ApiCache?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveCache(cache: ApiCache)

    @Query("DELETE FROM api_cache WHERE timestamp < :expiry")
    suspend fun clearOldCache(expiry: Long)
}

@Database(entities = [FavoriteVideo::class, ApiCache::class], version = 2)
abstract class AppDatabase : RoomDatabase() {
    abstract fun favoriteDao(): FavoriteDao
    abstract fun apiDao(): ApiDao
}
