'use client';

import Link from 'next/link';

const tools = [
  { id: 'headings', name: 'Headings Extractor', description: 'Extract all headings (h1-h6) from any website', icon: '📝' },
  { id: 'links', name: 'Links Extractor', description: 'Extract all internal and external links from a website', icon: '🔗' },
  { id: 'images', name: 'Images Extractor', description: 'Extract all images with previews from a website', icon: '🖼️' },
  { id: 'videos', name: 'Videos Extractor', description: 'Extract all videos including YouTube, Vimeo from a website', icon: '🎥' },
  { id: 'fonts', name: 'Fonts Detector', description: 'Detect all fonts used on a website with live previews', icon: '🔤' },
  { id: 'colors', name: 'Color Palette', description: 'Extract color palette from a website', icon: '🎨' },
  { id: 'emails', name: 'Email Extractor', description: 'Extract email addresses from a website', icon: '📧' },
  { id: 'phones', name: 'Phone Number Extractor', description: 'Extract phone numbers from any country from a website', icon: '📞' },
  { id: 'robots', name: 'Robots.txt Viewer', description: 'View and analyze robots.txt file from a website', icon: '🤖' },
  { id: 'meta', name: 'Meta Tags Extractor', description: 'Extract all meta tags and Open Graph data', icon: '🏷️' },
  { id: 'resources', name: 'Resources Extractor', description: 'Extract scripts and stylesheets from a website', icon: '📦' },
  { id: 'content-extractor', name: 'Content Extractor', description: 'Extract content from a website', icon: '📄' },
  { id: 'html-extractor', name: 'HTML Extractor', description: 'Extract raw HTML from a website', icon: '🔄' },
  { id: 'favicon-extractor', name: 'Favicon Extractor', description: 'Extract favicon from a website', icon: '⭐' },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Tools
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose a tool to extract specific data from any website
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{tool.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {tool.description}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
