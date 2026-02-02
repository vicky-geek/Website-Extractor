'use client';

import { useState } from 'react';
import { ExtractedData } from '@/lib/scraper';

interface ContentExtractorTabProps {
  data: ExtractedData;
}

export default function ContentExtractorTab({ data }: ContentExtractorTabProps) {
  const [outputFormat, setOutputFormat] = useState('markdown');
  const [textOnly, setTextOnly] = useState(false);
  const [ignoreLinks, setIgnoreLinks] = useState(false);
  const [includeElements, setIncludeElements] = useState('article, main, .content');
  const [excludeElements, setExcludeElements] = useState('nav, footer, .ads');
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/extract-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: data.url,
          outputFormat,
          textOnly,
          ignoreLinks,
          includeElements: includeElements.split(',').map(el => el.trim()).filter(el => el),
          excludeElements: excludeElements.split(',').map(el => el.trim()).filter(el => el),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setExtractedContent(result.content);
      } else {
        setExtractedContent(`Error: ${result.error || 'Failed to extract content'}`);
      }
    } catch (error: any) {
      setExtractedContent(`Error: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Content Extraction Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Output Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <div className="relative">
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="text">Text</option>
                  <option value="json">JSON</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Text Only Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Only
              </label>
              <button
                type="button"
                onClick={() => setTextOnly(!textOnly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  textOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    textOnly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Ignore Links Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ignore Links
              </label>
              <button
                type="button"
                onClick={() => setIgnoreLinks(!ignoreLinks)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  ignoreLinks ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ignoreLinks ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Include Elements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Include Elements
              </label>
              <input
                type="text"
                value={includeElements}
                onChange={(e) => setIncludeElements(e.target.value)}
                placeholder="article, main, .content"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Comma-separated CSS selectors or element names
              </p>
            </div>

            {/* Exclude Elements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exclude Elements
              </label>
              <input
                type="text"
                value={excludeElements}
                onChange={(e) => setExcludeElements(e.target.value)}
                placeholder="nav, footer, .ads"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Comma-separated CSS selectors or element names
              </p>
            </div>
          </div>
        </div>

        {/* Extract Button */}
        <div className="mt-6">
          <button
            onClick={handleExtract}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting...
              </span>
            ) : (
              'Extract Content'
            )}
          </button>
        </div>
      </div>

      {/* Extracted Content Display */}
      {extractedContent && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Extracted Content
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(extractedContent);
              }}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <pre className="whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-white font-mono max-h-[600px] overflow-y-auto">
              {extractedContent}
            </pre>
          </div>
        </div>
      )}

      {!extractedContent && !loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Configure your extraction settings and click "Extract Content" to begin</p>
        </div>
      )}
    </div>
  );
}
