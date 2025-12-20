package com.satorii.app.ui

import android.content.ComponentName
import android.content.Context
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.satorii.app.SatoriiApp
import com.satorii.app.model.FavoriteVideo
import com.satorii.app.model.VideoItem
import com.satorii.app.service.PlaybackService
import com.satorii.app.utils.YoutubeExtractor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PlayerViewModel : ViewModel() {
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    
    private val _currentVideo = mutableStateOf<VideoItem?>(null)
    val currentVideo: State<VideoItem?> = _currentVideo

    private val _isPlaying = mutableStateOf(false)
    val isPlaying: State<Boolean> = _isPlaying

    private val _isFavorite = mutableStateOf(false)
    val isFavorite: State<Boolean> = _isFavorite

    private val favoriteDao = SatoriiApp.database.favoriteDao()

    fun initController(context: Context) {
        if (controller != null) return
        
        val sessionToken = SessionToken(context, ComponentName(context, PlaybackService::class.java))
        controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
        controllerFuture?.addListener({
            controller = controllerFuture?.get()
            controller?.addListener(object : Player.Listener {
                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    _isPlaying.value = isPlaying
                }

                override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                    // Update current video if needed
                }
            })
        }, { it.run() })
    }

    fun playVideo(video: VideoItem) {
        _currentVideo.value = video
        
        // Observe favorite status
        CoroutineScope(Dispatchers.Main).launch {
            favoriteDao.isFavorite(video.id).collectLatest {
                _isFavorite.value = it
            }
        }
        
        CoroutineScope(Dispatchers.Main).launch {
            val streamUrl = YoutubeExtractor.getStreamUrl(video.id)
            if (streamUrl != null) {
                controller?.let {
                    val mediaItem = MediaItem.Builder()
                        .setMediaId(video.id)
                        .setMediaMetadata(
                            MediaMetadata.Builder()
                                .setTitle(video.snippet.title)
                                .setArtist(video.snippet.channelTitle)
                                .setArtworkUri(android.net.Uri.parse(video.snippet.thumbnails.high.url))
                                .build()
                        )
                        .setUri(streamUrl)
                        .build()
                    it.setMediaItem(mediaItem)
                    it.prepare()
                    it.play()
                }
            }
        }
    }

    fun togglePlayPause() {
        controller?.let {
            if (it.isPlaying) it.pause() else it.play()
        }
    }

    fun toggleFavorite() {
        val video = _currentVideo.value ?: return
        CoroutineScope(Dispatchers.IO).launch {
            val isFav = _isFavorite.value
            val fav = FavoriteVideo(
                id = video.id,
                title = video.snippet.title,
                channelTitle = video.snippet.channelTitle,
                thumbnail = video.snippet.thumbnails.high.url
            )
            if (isFav) {
                favoriteDao.removeFavorite(fav)
            } else {
                favoriteDao.addFavorite(fav)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        controllerFuture?.let {
            MediaController.releaseFuture(it)
        }
    }
}
