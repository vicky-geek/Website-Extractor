'use client';

import { ExtractedData } from '@/lib/scraper';
import { useState } from 'react';

interface HtmlExtractorTabProps {
  data: ExtractedData;
}

export default function HtmlExtractorTab({ data }: HtmlExtractorTabProps) {
  const [copied, setCopied] = useState(false);

  if (!data.html) {
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
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No HTML content available</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Raw HTML was not captured for this page
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    const text = data.html!;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const charCount = data.html.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {charCount.toLocaleString()} characters
        </p>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy HTML
            </>
          )}
        </button>
      </div>
      <div className="overflow-auto max-h-[600px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-words">
          {data.html}
        </pre>
      </div>
    </div>
  );
}
