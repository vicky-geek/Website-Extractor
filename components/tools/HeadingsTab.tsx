'use client';

import { ExtractedData } from '@/lib/scraper';

interface HeadingsTabProps {
  data: ExtractedData;
}

export default function HeadingsTab({ data }: HeadingsTabProps) {
  console.log("###################################",data.headings);
  if (data.headings.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">No headings found</p>
    );
  }

  // Group headings by level
  const groupedHeadings: Record<string, Array<{ level: string; text: string }>> = {};
  const headingCounts: Record<string, number> = {};
  const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  data.headings.forEach((heading) => {
    const level = heading.level.toLowerCase();
    if (!groupedHeadings[level]) {
      groupedHeadings[level] = [];
    }
    groupedHeadings[level].push(heading);
    headingCounts[level] = (headingCounts[level] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Count Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <thead>
            <tr>
              {levels.map((level) => (
                <th
                  key={level}
                  className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700"
                >
                  {level.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {levels.map((level) => (
                <td
                  key={level}
                  className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-gray-900 dark:text-gray-100"
                >
                  {headingCounts[level] || 0}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detailed Headings List */}
      <div className="space-y-6">
        {levels.map((level) => {
          const headings = groupedHeadings[level] || [];
          if (headings.length === 0) return null;

          return (
            <div key={level} className="space-y-2">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">
                {level.toUpperCase()}
              </h3>
              <div className="space-y-1">
                {headings.map((heading, index) => (
                  <div
                    key={`${level}-${index}`}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {heading.level.toUpperCase()}: {heading.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}
