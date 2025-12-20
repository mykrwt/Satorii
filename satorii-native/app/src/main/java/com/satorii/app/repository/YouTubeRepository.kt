package com.satorii.app.repository

import com.google.gson.Gson
import com.satorii.app.SatoriiApp
import com.satorii.app.model.*
import com.satorii.app.network.YouTubeApiService
import retrofit2.Response

class YouTubeRepository(private val apiService: YouTubeApiService) {
    private val gson = Gson()
    private val apiDao = SatoriiApp.database.apiDao()
    
    private val apiKeys = listOf(
        "AIzaSyCZr5hLowxIZfACJON4IRCUruoelK5AEx4",
        "AIzaSyCVGJ7BMf8kfljknnw12vX_P1mb3Vap-XQ",
        "AIzaSyAR_FlsSpfCCnlDTtP5Mx-QA5yiGyC6xmQ"
    )
    private var currentKeyIndex = 0

    private suspend fun <T> executeWithKeyRotation(call: suspend (String) -> Response<T>): T? {
        var lastException: Exception? = null
        val startKeyIndex = currentKeyIndex
        
        do {
            try {
                val response = call(apiKeys[currentKeyIndex])
                if (response.isSuccessful) {
                    return response.body()
                } else if (response.code() == 403) {
                    // Quota exceeded or forbidden, try next key
                    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.size
                } else {
                    return null
                }
            } catch (e: Exception) {
                lastException = e
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.size
            }
        } while (currentKeyIndex != startKeyIndex)
        
        return null
    }

    suspend fun search(query: String, pageToken: String? = null): SearchResponse? {
        val cacheKey = "search_${query}_$pageToken"
        val cached = apiDao.getCache(cacheKey)
        if (cached != null && System.currentTimeMillis() - cached.timestamp < 24 * 60 * 60 * 1000) {
            return gson.fromJson(cached.responseJson, SearchResponse::class.java)
        }

        val result = executeWithKeyRotation { key ->
            apiService.search(query = query, pageToken = pageToken, apiKey = key)
        }
        
        if (result != null) {
            apiDao.saveCache(ApiCache(cacheKey, gson.toJson(result)))
        }
        return result
    }

    suspend fun getVideoDetails(videoId: String): VideoItem? {
        val cacheKey = "video_$videoId"
        val cached = apiDao.getCache(cacheKey)
        if (cached != null && System.currentTimeMillis() - cached.timestamp < 24 * 60 * 60 * 1000) {
            return gson.fromJson(cached.responseJson, VideoItem::class.java)
        }

        val response = executeWithKeyRotation { key ->
            apiService.getVideoDetails(videoId = videoId, apiKey = key)
        }
        val result = response?.items?.firstOrNull()
        if (result != null) {
            apiDao.saveCache(ApiCache(cacheKey, gson.toJson(result)))
        }
        return result
    }

    suspend fun getTrending(pageToken: String? = null): VideoResponse? {
        val cacheKey = "trending_$pageToken"
        val cached = apiDao.getCache(cacheKey)
        if (cached != null && System.currentTimeMillis() - cached.timestamp < 6 * 60 * 60 * 1000) { // 6 hours for trending
            return gson.fromJson(cached.responseJson, VideoResponse::class.java)
        }

        val result = executeWithKeyRotation { key ->
            apiService.getTrending(pageToken = pageToken, apiKey = key)
        }
        if (result != null) {
            apiDao.saveCache(ApiCache(cacheKey, gson.toJson(result)))
        }
        return result
    }

    suspend fun getChannelDetails(channelId: String): ChannelItem? {
        val response = executeWithKeyRotation { key ->
            apiService.getChannelDetails(channelId = channelId, apiKey = key)
        }
        return response?.items?.firstOrNull()
    }
}
