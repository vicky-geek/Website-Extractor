'use client';

import { ExtractedData } from '@/lib/scraper';

interface RobotsTabProps {
  data: ExtractedData;
}

export default function RobotsTab({ data }: RobotsTabProps) {
  if (!data.robotsTxt) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No robots.txt found</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          This website does not have a robots.txt file or it is not accessible
        </p>
        <p className="text-gray-400 dark:text-gray-400 text-xs mt-4">
          Expected location: {new URL(data.url).origin}/robots.txt
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-orange-600 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                robots.txt
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new URL(data.url).origin}/robots.txt
              </p>
            </div>
          </div>
          <a
            href={`${new URL(data.url).origin}/robots.txt`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View Raw
          </a>
        </div>
        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
            {data.robotsTxt}
          </pre>
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            About robots.txt
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            The robots.txt file tells search engines which pages they can and cannot crawl on your website.
            It's located at the root of your website and follows a specific format with User-agent and Disallow/Allow directives.
          </p>
        </div>
      </div>
    </div>
  );
}
