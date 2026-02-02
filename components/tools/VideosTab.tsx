'use client';

import { ExtractedData } from '@/lib/scraper';

interface VideosTabProps {
  data: ExtractedData;
}

// Helper function to get watch URL from embed URL
function getWatchUrl(url: string, platform?: string): string {
  if (platform === 'youtube') {
    // Convert embed URL to watch URL
    const embedMatch = url.match(/youtube\.com\/embed\/([^"&?\/\s]+)/);
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
    }
    // If already watch URL, return as is
    if (url.includes('youtube.com/watch')) {
      return url;
    }
    // If youtu.be short URL, convert to watch
    const shortMatch = url.match(/youtu\.be\/([^"&?\/\s]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/watch?v=${shortMatch[1]}`;
    }
  } else if (platform === 'vimeo') {
    // Convert player URL to watch URL
    const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (playerMatch && playerMatch[1]) {
      return `https://vimeo.com/${playerMatch[1]}`;
    }
    // If already vimeo.com URL, return as is
    if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
      return url;
    }
  } else if (platform === 'dailymotion') {
    // Convert embed URL to watch URL
    const embedMatch = url.match(/dailymotion\.com\/embed\/video\/([^"&?\/\s]+)/);
    if (embedMatch && embedMatch[1]) {
      return `https://www.dailymotion.com/video/${embedMatch[1]}`;
    }
    // If already video URL, return as is
    if (url.includes('dailymotion.com/video/')) {
      return url;
    }
  }
  return url;
}

export default function VideosTab({ data }: VideosTabProps) {
  if (data.videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No videos found</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          No videos were found on this website
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.videos.map((video, index) => {
        const watchUrl = getWatchUrl(video.src, video.platform);

        return (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Thumbnail or Icon */}
                {video.thumbnail ? (
                  <div className="relative w-32 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={`Video ${index + 1} thumbnail`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-32 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      {video.platform || video.type || 'Video'}
                    </span>
                    {video.thumbnail && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                        Has Thumbnail
                      </span>
                    )}
                  </div>
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all block mb-2"
                  >
                    {video.src}
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Video {index + 1} of {data.videos.length}
                  </p>
                </div>
              </div>

              {/* Open Video Button */}
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open Video
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
