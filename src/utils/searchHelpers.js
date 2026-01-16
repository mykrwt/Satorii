export const generateRelatedTags = (items, query) => {
    if (!items || items.length === 0) return [];

    const stopWords = new Set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
        'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
        'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
        'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
        'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
        'video', 'videos', 'youtube', 'channel', 'official', 'clip', 'full', 'hd', 'hq', '4k', '1080p', 'music', 'lyric', 'lyrics',
        'feat', 'ft', 'vs', 'live', 'stream', '2023', '2024', '2025', 'best', 'top', 'shorts', 'short'
    ]);

    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const wordCounts = {};

    items.forEach(item => {
        const title = item.snippet?.title;
        if (!title) return;

        // Normalize and split
        const words = title
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/);

        words.forEach(word => {
            if (word.length > 2 && !stopWords.has(word) && !queryWords.has(word) && isNaN(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
    });

    // Sort by frequency
    const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10 words
        .map(entry => entry[0]);

    // Also try to find 2-gram (phrases) if single words are too generic? 
    // For now, single words are safer to avoid nonsense.
    // Let's also include some channel names if they appear frequently or just top channels
    const channels = items
        .map(item => item.snippet?.channelTitle)
        .filter(Boolean)
        .filter(name => !name.toLowerCase().includes('topic')); // Filter auto-generated topic channels

    const uniqueChannels = [...new Set(channels)].slice(0, 3);
    
    // Combine: Prefer words, but maybe add a channel or two? 
    // Actually, "related searches" are usually topics.
    
    return sortedWords.slice(0, 8);
};
