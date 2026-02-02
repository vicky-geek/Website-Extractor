'use client';

import { ExtractedData } from '@/lib/scraper';

interface ColorsTabProps {
  data: ExtractedData;
}

export default function ColorsTab({ data }: ColorsTabProps) {
  if (data.colors.length === 0) {
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
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No colors found</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          No colors were detected on this website
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.colors.map((color, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => {
              navigator.clipboard.writeText(color.hex);
            }}
            title="Click to copy hex code"
          >
            <div
              className="h-24 w-full"
              style={{ backgroundColor: color.hex }}
            />
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300 font-semibold">
                  {color.hex.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {color.frequency}x
                </span>
              </div>
              {color.rgb && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {color.rgb}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {color.usage}
              </p>
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Click to copy
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
          Color Palette Information
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
          Found <strong>{data.colors.length}</strong> unique colors used on this website.
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Colors are sorted by frequency of use. Click on any color card to copy its hex code to your clipboard.
        </p>
      </div>
    </div>
  );
}
