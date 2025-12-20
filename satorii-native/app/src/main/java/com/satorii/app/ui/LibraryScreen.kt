package com.satorii.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.PlaylistPlay
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.satorii.app.SatoriiApp
import com.satorii.app.model.FavoriteVideo
import com.satorii.app.model.Snippet
import com.satorii.app.model.Thumbnail
import com.satorii.app.model.Thumbnails
import com.satorii.app.model.VideoItem
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class LibraryViewModel : ViewModel() {
    private val favoriteDao = SatoriiApp.database.favoriteDao()

    val favorites: StateFlow<List<FavoriteVideo>> = favoriteDao.getAllFavorites()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    fun toggleFavorite(video: VideoItem) {
        viewModelScope.launch {
            val fav = FavoriteVideo(
                id = video.id,
                title = video.snippet.title,
                channelTitle = video.snippet.channelTitle,
                thumbnail = video.snippet.thumbnails.high.url
            )
            // In a real app, check if exists first, but here we just have a simple repo
            favoriteDao.addFavorite(fav)
        }
    }
}

@Composable
fun LibraryScreen(
    onVideoClick: (VideoItem) -> Unit,
    viewModel: LibraryViewModel = viewModel()
) {
    val favorites by viewModel.favorites.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text(
                text = "Your Library",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 24.dp)
            )
        }

        item { LibraryRow(icon = Icons.Default.Favorite, label = "Liked Videos", count = favorites.size.toString()) }
        item { LibraryRow(icon = Icons.Default.History, label = "History", count = "0") }
        item { LibraryRow(icon = Icons.Default.PlaylistPlay, label = "Playlists", count = "0") }

        item {
            Spacer(modifier = Modifier.height(32.dp))
            Text(
                text = "Recent Activity",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
        }

        if (favorites.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    Text(text = "No recent activity", color = Color.Gray)
                }
            }
        } else {
            items(favorites) { favorite ->
                val video = VideoItem(
                    id = favorite.id,
                    snippet = Snippet(
                        title = favorite.title,
                        description = "",
                        thumbnails = Thumbnails(
                            default = Thumbnail(favorite.thumbnail, 0, 0),
                            medium = Thumbnail(favorite.thumbnail, 0, 0),
                            high = Thumbnail(favorite.thumbnail, 0, 0)
                        ),
                        channelTitle = favorite.channelTitle,
                        channelId = "",
                        publishedAt = ""
                    ),
                    contentDetails = null,
                    statistics = null
                )
                VideoCard(video = video, onClick = { onVideoClick(video) })
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
fun LibraryRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, count: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(28.dp))
        Column(modifier = Modifier.padding(start = 16.dp)) {
            Text(text = label, fontSize = 16.sp, fontWeight = FontWeight.Medium)
            Text(text = "$count items", fontSize = 13.sp, color = Color.Gray)
        }
    }
}
