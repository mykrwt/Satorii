package com.satorii.app.utils

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object YoutubeExtractor {
    // We use a public Piped instance as a fallback extractor for "Pure Native" playback
    // In a production app, you'd want your own instance or a local extraction library
    private const val PIPED_API = "https://pipedapi.kavin.rocks"

    suspend fun getStreamUrl(videoId: String): String? = withContext(Dispatchers.IO) {
        try {
            val url = URL("$PIPED_API/streams/$videoId")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            
            val response = connection.inputStream.bufferedReader().readText()
            val json = JSONObject(response)
            
            // Prefer audio-only stream for better background performance
            // or high quality video if required
            val audioStreams = json.getJSONArray("audioStreams")
            if (audioStreams.length() > 0) {
                return@withContext audioStreams.getJSONObject(0).getString("url")
            }
            
            val videoStreams = json.getJSONArray("videoStreams")
            if (videoStreams.length() > 0) {
                return@withContext videoStreams.getJSONObject(0).getString("url")
            }
            
            null
        } catch (e: Exception) {
            Log.e("YoutubeExtractor", "Error extracting stream for $videoId", e)
            null
        }
    }
}
