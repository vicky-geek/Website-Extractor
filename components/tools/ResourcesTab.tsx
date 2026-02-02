'use client';

import { ExtractedData } from '@/lib/scraper';

interface ResourcesTabProps {
  data: ExtractedData;
}

export default function ResourcesTab({ data }: ResourcesTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Scripts</h3>
        <div className="space-y-2">
          {data.scripts.length > 0 ? (
            data.scripts.map((script, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <a
                  href={script}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {script}
                </a>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No scripts found</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Stylesheets</h3>
        <div className="space-y-2">
          {data.stylesheets.length > 0 ? (
            data.stylesheets.map((stylesheet, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <a
                  href={stylesheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {stylesheet}
                </a>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No stylesheets found</p>
          )}
        </div>
      </div>
    </div>
  );
}
