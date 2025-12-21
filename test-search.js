// Quick test to troubleshoot search functionality
const axios = require('axios');

const testApiKey = 'AIzaSyCZr5hLowxIZfACJON4IRCUruoelK5AEx4';

async function testSearch() {
    try {
        console.log('Testing YouTube API search...');
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: 'react tutorial',
                type: 'video',
                maxResults: 5,
                key: testApiKey
            }
        });
        
        console.log('Search successful! Got', response.data.items.length, 'results');
        console.log('First result:', JSON.stringify(response.data.items[0], null, 2));
        
        // Test video ID extraction
        const videoIds = response.data.items.map(item => {
            const id = item.id?.videoId || item.id;
            console.log('Item ID structure:', item.id);
            console.log('Extracted ID:', id);
            return id;
        }).filter(id => typeof id === 'string');
        
        console.log('Extracted video IDs:', videoIds);
        
    } catch (error) {
        console.error('Search failed:', error.response?.data || error.message);
    }
}

testSearch();