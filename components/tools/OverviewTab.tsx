'use client';

import { ExtractedData } from '@/lib/scraper';

interface OverviewTabProps {
  data: ExtractedData;
}

export default function OverviewTab({ data }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {data.favicon && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Favicon</p>
          <div className="flex items-center gap-3">
            <img
              src={data.favicon}
              alt="Favicon"
              className="w-12 h-12 rounded border border-gray-200 dark:border-gray-600"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <a
              href={data.favicon}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {data.favicon}
            </a>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Headings</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.headings.length}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Links</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.links.length}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Images</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.images.length}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Videos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.videos.length}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Scripts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.scripts.length}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Emails</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.emails.length}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Numbers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.phoneNumbers.length}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Colors</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.colors.length}</p>
        </div>
      </div>
      {data.textContent && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Content Preview</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {data.textContent}
          </p>
        </div>
      )}
    </div>
  );
}
