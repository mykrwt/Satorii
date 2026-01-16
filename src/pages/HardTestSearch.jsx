import React, { useEffect, useMemo, useState } from 'react';
import { youtubeAPI } from '../services/youtube';
import { filterOutShortSearchItems } from '../utils/videoFilters';
import './HardTestSearch.css';

const HardTestSearch = () => {
    const [query, setQuery] = useState('music');
    const [maxResults, setMaxResults] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rawResponse, setRawResponse] = useState(null);

    const items = useMemo(() => {
        const rawItems = Array.isArray(rawResponse?.items) ? rawResponse.items : [];
        return filterOutShortSearchItems(rawItems);
    }, [rawResponse]);

    const runSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            setError(null);
            setRawResponse({ items: [] });
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await youtubeAPI.search(trimmed, 'video', maxResults);
            console.log('RAW YT RESPONSE:', data);
            setRawResponse(data);

            if (data?.error) {
                setError(data.error.message || 'YouTube API error. See raw response.');
            }
        } catch (err) {
            console.error('Hard test search failed:', err);
            setError('Search failed. Check console for details.');
            setRawResponse(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        runSearch();
    }, []);

    return (
        <div className="hard-test-page animate-fade">
            <div className="hard-test-container">
                <header className="hard-test-header">
                    <h1>Hard Test Search</h1>
                    <p>A minimal YouTube search sanity check that logs the raw API response and renders thumbnails + titles.</p>
                </header>

                <div className="hard-test-controls">
                    <label className="hard-test-field">
                        <span>Query</span>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="music"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') runSearch();
                            }}
                        />
                    </label>

                    <label className="hard-test-field">
                        <span>Max results</span>
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={maxResults}
                            onChange={(e) => setMaxResults(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                        />
                    </label>

                    <button className="btn-premium filled" onClick={runSearch} disabled={isLoading}>
                        {isLoading ? 'Searching…' : 'Run search'}
                    </button>
                </div>

                {error && (
                    <div className="hard-test-error">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="hard-test-results">
                    {items.length > 0 ? (
                        items.map((item, index) => {
                            const title = item?.snippet?.title ?? 'Untitled Video';
                            const thumb =
                                item?.snippet?.thumbnails?.medium?.url ??
                                item?.snippet?.thumbnails?.default?.url ??
                                null;
                            const videoId = item?.id?.videoId ?? (typeof item?.id === 'string' ? item.id : null);

                            return (
                                <div className="hard-test-card" key={videoId ?? `${index}`}
                                >
                                    {thumb ? (
                                        <img className="hard-test-thumb" src={thumb} alt={title} loading="lazy" />
                                    ) : (
                                        <div className="hard-test-thumb placeholder" />
                                    )}
                                    <p className="hard-test-title">{title}</p>
                                    {videoId && (
                                        <a
                                            className="hard-test-link"
                                            href={`/watch/${videoId}`}
                                        >
                                            Open
                                        </a>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="hard-test-empty">
                            {!isLoading ? <p>No results.</p> : null}
                        </div>
                    )}
                </div>

                {rawResponse && (
                    <details className="hard-test-raw">
                        <summary>Raw response JSON</summary>
                        <pre>{JSON.stringify(rawResponse, null, 2)}</pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default HardTestSearch;
