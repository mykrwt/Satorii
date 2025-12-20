package com.satorii.app.utils

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object YoutubeExtractor {
    // Multiple Piped instances for fallback
    private val pipedInstances = listOf(
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.tobychui.com",
        "https://pipedapi.smnz.de"
    )

    suspend fun getStreamUrl(videoId: String): String? = withContext(Dispatchers.IO) {
        var lastException: Exception? = null

        // Try each Piped instance in order
        for (instance in pipedInstances) {
            try {
                val url = URL("$instance/streams/$videoId")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 5000
                connection.readTimeout = 5000

                val response = connection.inputStream.bufferedReader().readText()
                val json = JSONObject(response)

                // Prefer audio-only stream for better background performance
                val audioStreams = json.getJSONArray("audioStreams")
                if (audioStreams.length() > 0) {
                    return@withContext audioStreams.getJSONObject(0).getString("url")
                }

                // Fallback to video streams if no audio streams available
                val videoStreams = json.getJSONArray("videoStreams")
                if (videoStreams.length() > 0) {
                    return@withContext videoStreams.getJSONObject(0).getString("url")
                }

            } catch (e: Exception) {
                lastException = e
                Log.w("YoutubeExtractor", "Failed to extract from $instance, trying next instance", e)
            }
        }

        Log.e("YoutubeExtractor", "All Piped instances failed for video $videoId", lastException)
        null
    }
}
