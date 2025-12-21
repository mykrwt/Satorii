// Test script to verify search data transformation
// Simulates the search results pipeline

const testBasicResults = [
  {
    kind: 'youtube#searchResult',
    etag: 'some-etag',
    id: {
      kind: 'youtube#video',
      videoId: 'abc123',
      playlistId: null,
      channelId: null
    },
    snippet: {
      publishedAt: '2024-01-01T00:00:00Z',
      channelId: 'UC123',
      title: 'Test Video 1',
      description: 'Test description',
      thumbnails: {
        default: { url: 'http://example.com/thumb1.jpg', width: 120, height: 90 },
        medium: { url: 'http://example.com/thumb1.jpg', width: 320, height: 180 },
        high: { url: 'http://example.com/thumb1.jpg', width: 480, height: 360 }
      },
      channelTitle: 'Test Channel',
      liveBroadcastContent: 'none'
    }
  },
  {
    kind: 'youtube#searchResult',
    etag: 'some-etag-2',
    id: {
      kind: 'youtube#video',
      videoId: 'def456',
      playlistId: null,
      channelId: null
    },
    snippet: {
      publishedAt: '2024-01-02T00:00:00Z',
      channelId: 'UC456',
      title: 'Test Video 2',
      description: 'Test description 2',
      thumbnails: {
        default: { url: 'http://example.com/thumb2.jpg', width: 120, height: 90 },
        medium: { url: 'http://example.com/thumb2.jpg', width: 320, height: 180 },
        high: { url: 'http://example.com/thumb2.jpg', width: 480, height: 360 }
      },
      channelTitle: 'Test Channel 2',
      liveBroadcastContent: 'none'
    }
  }
];

// Simulate the transformation that happens in Search.jsx when enrichment fails
const transformedResults = testBasicResults.map(item => {
  const videoId = item.id?.videoId || item.id;
  return {
    id: typeof videoId === 'string' ? videoId : item.id,
    snippet: item.snippet || {},
    contentDetails: undefined,
    statistics: undefined
  };
});

console.log('Original search result structure:');
console.log(JSON.stringify(testBasicResults[0], null, 2));

console.log('\n\nTransformed result structure:');
console.log(JSON.stringify(transformedResults[0], null, 2));

console.log('\n\nKey checks:');
console.log('1. Has id at root:', transformedResults[0].id !== undefined);
console.log('2. Has id.videoId:', testBasicResults[0].id?.videoId);
console.log('3. Snippet preserved:', !!transformedResults[0].snippet);
console.log('4. VideoCard will work:', !!transformedResults[0].id && !!transformedResults[0].snippet);