package com.satorii.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.satorii.app.model.VideoItem
import com.satorii.app.network.YouTubeApiService
import com.satorii.app.repository.YouTubeRepository
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import android.util.Log

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    onVideoClick: (VideoItem) -> Unit,
    viewModel: SearchViewModel = viewModel()
) {
    var query by remember { mutableStateOf("") }
    val results by viewModel.results
    val isLoading by viewModel.isLoading

    Column(modifier = Modifier.fillMaxSize()) {
        SearchBar(
            query = query,
            onQueryChange = { query = it },
            onSearch = { viewModel.search(it) },
            active = false,
            onActiveChange = {},
            placeholder = { Text("Search YouTube") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) { }

        if (isLoading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        }

        error?.let { errorMsg ->
            Text(
                text = errorMsg,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )
        }

        if (results.isEmpty() && !isLoading && error == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Search for videos", color = Color.Gray)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(results) { video ->
                    VideoCard(video = video, onClick = { onVideoClick(video) })
                }
            }
        }
    }
}

class SearchViewModel : ViewModel() {
    private val retrofit = Retrofit.Builder()
        .baseUrl("https://www.googleapis.com/youtube/v3/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val apiService = retrofit.create(YouTubeApiService::class.java)
    private val repository = YouTubeRepository(apiService)

    private val _results = mutableStateOf<List<VideoItem>>(emptyList())
    val results: State<List<VideoItem>> = _results

    private val _isLoading = mutableStateOf(false)
    val isLoading: State<Boolean> = _isLoading

    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    fun search(query: String) {
        if (query.isBlank()) {
            _results.value = emptyList()
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = repository.search(query)
                if (response != null) {
                    // Fetch full details for snippets found in search items
                    _results.value = response.items.map {
                        VideoItem(it.id.videoId ?: "", it.snippet, null, null)
                    }
                } else {
                    _error.value = "No results found"
                }
            } catch (e: Exception) {
                _error.value = "Search failed: ${e.message}"
                Log.e("SearchViewModel", "Search failed", e)
            } finally {
                _isLoading.value = false
            }
        }
    }
}
