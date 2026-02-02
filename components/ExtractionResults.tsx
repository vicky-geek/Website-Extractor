'use client';

import { useState, useEffect } from 'react';
import { ExtractedData } from '@/lib/scraper';
import Image from 'next/image';
import OverviewTab from './tools/OverviewTab';
import HeadingsTab from './tools/HeadingsTab';
import LinksDisplay from './tools/LinksDisplay';
import ImageExtractor from './tools/ImageExtractor';
import VideosTab from './tools/VideosTab';
import FontsTab from './tools/FontsTab';
import ColorsTab from './tools/ColorsTab';
import EmailsTab from './tools/EmailsTab';
import PhoneNumbersTab from './tools/PhoneNumbersTab';
import RobotsTab from './tools/RobotsTab';
import MetaTab from './tools/MetaTab';
import ResourcesTab from './tools/ResourcesTab';
import ContentExtractorTab from './tools/ContentExtractorTab';
import HtmlExtractorTab from './tools/HtmlExtractorTab';
import FaviconExtractorTab from './tools/FaviconExtractorTab';

interface ExtractionResultsProps {
  data: ExtractedData;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
  singleTab?: string; // If provided, only show this tab
}

export default function ExtractionResults({ data, defaultTab, onTabChange, singleTab }: ExtractionResultsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || singleTab || 'overview');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (singleTab) {
      setActiveTab(singleTab);
    }
  }, [defaultTab, singleTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const allTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'headings', label: 'Headings' },
    { id: 'links', label: 'Links' },
    { id: 'images', label: 'Images' },
    { id: 'videos', label: 'Videos' },
    { id: 'fonts', label: 'Fonts' },
    { id: 'colors', label: 'Colors' },
    { id: 'emails', label: 'Emails' },
    { id: 'phones', label: 'Phone Numbers' },
    { id: 'robots', label: 'Robots.txt' },
    { id: 'meta', label: 'Meta Tags' },
    { id: 'resources', label: 'Resources' },
    { id: 'content-extractor', label: 'Website Content Extractor' },
    { id: 'html-extractor', label: 'HTML Extractor' },
    { id: 'favicon-extractor', label: 'Favicon Extractor' },
  ];

  // If singleTab is specified, only show that tab
  const tabs = singleTab
    ? allTabs.filter(tab => tab.id === singleTab)
    : allTabs;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with OG Image */}
      {data.ogImage && (
        <div className="relative h-48 w-full bg-gradient-to-r from-blue-500 to-purple-500">
          <Image
            src={data.ogImage}
            alt={data.title}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Title and Description */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {data.favicon && (
              <img
                src={data.favicon}
                alt="Favicon"
                className="w-8 h-8 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}

              />
            )}
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.title || 'No Title'}
            </h2>
          </div>
          {data.description && (
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {data.description}
            </p>
          )}
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-2 inline-block"
          >
            {data.url}
          </a>
        </div>

        {/* Tabs - Only show if not single tab mode */}
        {!singleTab && (
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div className="max-h-[600px] overflow-y-auto">
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'headings' && <HeadingsTab data={data} />}
          {activeTab === 'links' && <LinksDisplay data={data} />}
          {activeTab === 'images' && <ImageExtractor data={data} />}
          {activeTab === 'videos' && <VideosTab data={data} />}
          {activeTab === 'fonts' && <FontsTab data={data} />}
          {activeTab === 'colors' && <ColorsTab data={data} />}
          {activeTab === 'emails' && <EmailsTab data={data} />}
          {activeTab === 'phones' && <PhoneNumbersTab data={data} />}
          {activeTab === 'robots' && <RobotsTab data={data} />}
          {activeTab === 'meta' && <MetaTab data={data} />}
          {activeTab === 'resources' && <ResourcesTab data={data} />}
          {activeTab === 'content-extractor' && <ContentExtractorTab data={data} />}
          {activeTab === 'html-extractor' && <HtmlExtractorTab data={data} />}
          {activeTab === 'favicon-extractor' && <FaviconExtractorTab data={data} />}
        </div>
      </div>
    </div>
  );
}
