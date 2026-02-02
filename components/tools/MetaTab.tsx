'use client';

import { ExtractedData } from '@/lib/scraper';
import Image from 'next/image';

interface MetaTabProps {
  data: ExtractedData;
}

export default function MetaTab({ data }: MetaTabProps) {
  if (Object.keys(data.metaTags).length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">No meta tags found</p>
    );
  }

  // Extract OG tags
  const ogTags: Array<{ key: string; label: string; value: string; icon?: string }> = [];
  const ogTitle = data.metaTags['og:title'] || data.title || '';
  const ogDescription = data.metaTags['og:description'] || data.description || '';
  const ogUrl = data.metaTags['og:url'] || data.url || '';
  const ogType = data.metaTags['og:type'] || '';
  const ogSiteName = data.metaTags['og:site_name'] || '';
  const ogLocale = data.metaTags['og:locale'] || '';
  const ogImage = data.metaTags['og:image'] || data.ogImage || '';
  const ogImageWidth = data.metaTags['og:image:width'] || '';
  const ogImageHeight = data.metaTags['og:image:height'] || '';

  if (ogTitle) ogTags.push({ key: 'og:title', label: 'Title', value: ogTitle, icon: '📝' });
  if (ogDescription) ogTags.push({ key: 'og:description', label: 'Description', value: ogDescription, icon: '📄' });
  if (ogUrl) ogTags.push({ key: 'og:url', label: 'URL', value: ogUrl, icon: '🌐' });
  if (ogType) ogTags.push({ key: 'og:type', label: 'Type', value: ogType, icon: '🏷️' });
  if (ogSiteName) ogTags.push({ key: 'og:site_name', label: 'Site Name', value: ogSiteName, icon: '🌐' });
  if (ogLocale) ogTags.push({ key: 'og:locale', label: 'Locale', value: ogLocale, icon: '🌐' });
  if (ogImage) ogTags.push({ key: 'og:image', label: 'Image URL', value: ogImage, icon: '🖼️' });
  if (ogImageWidth) ogTags.push({ key: 'og:image:width', label: 'Image Width', value: ogImageWidth });
  if (ogImageHeight) ogTags.push({ key: 'og:image:height', label: 'Image Height', value: ogImageHeight });

  const otherMetaTags = Object.entries(data.metaTags)
    .filter(([key]) => !key.startsWith('og:') && !key.startsWith('twitter:'));

  return (
    <div className="space-y-6">
      {/* Open Graph Section */}
      {ogTags.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Open Graph</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ogTags.map((tag, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {tag.icon && <span className="text-lg">{tag.icon}</span>}
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {tag.label}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tag.value);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                  {tag.key}
                </p>
                <p className="text-sm text-gray-900 dark:text-white break-words">
                  {tag.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Previews */}
      {(data.metaTags['og:title'] || data.title) && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Platform Previews</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Facebook Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Facebook / Open Graph</span>
              </div>
              <div className="p-4">
                {data.metaTags['og:image'] || data.ogImage ? (
                  <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-600 rounded mb-3 overflow-hidden">
                    <Image
                      src={data.metaTags['og:image'] || data.ogImage || ''}
                      alt="OG Image"
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded mb-3 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No Image</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">
                  {new URL(data.url).hostname.replace('www.', '').toUpperCase()}
                </p>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {data.metaTags['og:title'] || data.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {data.metaTags['og:description'] || data.description}
                </p>
              </div>
            </div>

            {/* Twitter Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <svg className="w-5 h-5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Twitter / X</span>
              </div>
              <div className="p-4">
                {data.metaTags['og:image'] || data.ogImage ? (
                  <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-600 rounded mb-3 overflow-hidden">
                    <Image
                      src={data.metaTags['og:image'] || data.ogImage || ''}
                      alt="OG Image"
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded mb-3 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No Image</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {new URL(data.url).hostname.replace('www.', '')}
                </p>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {data.metaTags['og:title'] || data.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {data.metaTags['og:description'] || data.description}
                </p>
              </div>
            </div>

            {/* LinkedIn Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">LinkedIn</span>
              </div>
              <div className="p-4">
                {data.metaTags['og:image'] || data.ogImage ? (
                  <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-600 rounded mb-3 overflow-hidden">
                    <Image
                      src={data.metaTags['og:image'] || data.ogImage || ''}
                      alt="OG Image"
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded mb-3 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No Image</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {new URL(data.url).hostname.replace('www.', '')}
                </p>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {data.metaTags['og:title'] || data.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {data.metaTags['og:description'] || data.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Meta Tags */}
      {otherMetaTags.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Other Meta Tags</h3>
          <div className="space-y-2">
            {otherMetaTags.map(([key, value], index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-1">
                  {key}
                </p>
                <p className="text-gray-900 dark:text-white break-words">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
