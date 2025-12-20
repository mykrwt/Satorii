package com.satorii.app.model

import com.google.gson.annotations.SerializedName

data class SearchResponse(
    val items: List<SearchResult>,
    val nextPageToken: String?
)

data class SearchResult(
    val id: SearchId,
    val snippet: Snippet
)

data class SearchId(
    val videoId: String?,
    val channelId: String?,
    val playlistId: String?
)

data class VideoResponse(
    val items: List<VideoItem>,
    val nextPageToken: String?
)

data class VideoItem(
    val id: String,
    val snippet: Snippet,
    val contentDetails: ContentDetails?,
    val statistics: Statistics?
)

data class Snippet(
    val title: String,
    val description: String,
    val thumbnails: Thumbnails,
    val channelTitle: String,
    val channelId: String,
    val publishedAt: String
)

data class Thumbnails(
    val default: Thumbnail,
    val medium: Thumbnail,
    val high: Thumbnail
)

data class Thumbnail(
    val url: String,
    val width: Int,
    val height: Int
)

data class ContentDetails(
    val duration: String
)

data class Statistics(
    val viewCount: String?,
    val likeCount: String?,
    val commentCount: String?,
    val subscriberCount: String?
)

data class ChannelResponse(
    val items: List<ChannelItem>
)

data class ChannelItem(
    val id: String,
    val snippet: Snippet,
    val statistics: Statistics?
)
