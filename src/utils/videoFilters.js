const parseISODurationToSeconds = (duration) => {
    if (!duration || typeof duration !== 'string') return null;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return null;

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
};

const hasShortsHashtag = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /#shorts\b|#short\b/i.test(text);
};

const hasVerticalThumbnail = (thumbnails) => {
    if (!thumbnails || typeof thumbnails !== 'object') return false;

    const thumb = thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;
    const w = thumb?.width;
    const h = thumb?.height;

    if (typeof w !== 'number' || typeof h !== 'number') return false;
    return h > w;
};

export const isYouTubeShort = (video, { maxSeconds = 60 } = {}) => {
    if (!video) return false;

    const snippet = video.snippet || {};
    const contentDetails = video.contentDetails || {};

    if (hasShortsHashtag(snippet.title) || hasShortsHashtag(snippet.description)) {
        return true;
    }

    if (hasVerticalThumbnail(snippet.thumbnails)) {
        return true;
    }

    const seconds = parseISODurationToSeconds(contentDetails.duration);
    if (typeof seconds === 'number' && seconds >= 0 && seconds <= maxSeconds) {
        return true;
    }

    return false;
};

export const filterOutShorts = (items, options) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => item && !isYouTubeShort(item, options));
};

export const filterOutShortSearchItems = (items) => {
    if (!Array.isArray(items)) return [];

    return items.filter((item) => {
        const snippet = item?.snippet || {};
        if (hasShortsHashtag(snippet.title) || hasShortsHashtag(snippet.description)) return false;
        if (hasVerticalThumbnail(snippet.thumbnails)) return false;
        return true;
    });
};

export const getVideoId = (video) => {
    if (!video) return null;
    if (typeof video.id === 'string') return video.id;
    if (video.id?.videoId) return video.id.videoId;
    return null;
};
