'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';

// Navigation menu items
const navItems = [
  { id: 'home', name: 'Home', href: '/', description: 'Home page' },
  { id: 'tools', name: 'Tools', href: '/tools', description: 'Browse all tools' },
];

// Tools array for dropdown
const tools = [
  { id: 'headings', name: 'Headings Extractor', description: 'Extract all headings from a website' },
  { id: 'links', name: 'Links Extractor', description: 'Extract all links from a website' },
  { id: 'images', name: 'Images Extractor', description: 'Extract all images from a website' },
  { id: 'videos', name: 'Videos Extractor', description: 'Extract all videos from a website' },
  { id: 'fonts', name: 'Fonts Detector', description: 'Detect all fonts used on a website' },
  { id: 'colors', name: 'Color Palette', description: 'Extract color palette from a website' },
  { id: 'emails', name: 'Email Extractor', description: 'Extract email addresses from a website' },
  { id: 'phones', name: 'Phone Number Extractor', description: 'Extract phone numbers from any country from a website' },
  { id: 'robots', name: 'Robots.txt Viewer', description: 'View robots.txt file from a website' },
  { id: 'meta', name: 'Meta Tags Extractor', description: 'Extract meta tags from a website' },
  { id: 'resources', name: 'Resources Extractor', description: 'Extract scripts and stylesheets' },
  { id: 'content-extractor', name: 'Content Extractor', description: 'Extract content from a website' },
  { id: 'html-extractor', name: 'HTML Extractor', description: 'Extract raw HTML from a website' },
  { id: 'favicon-extractor', name: 'Favicon Extractor', description: 'Extract favicon from a website' },
];

export default function Header() {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Website Extractor
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  pathname?.startsWith('/tools/')
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Quick Tools
                <svg
                  className={`w-4 h-4 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isToolsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-2 max-h-96 overflow-y-auto">
                    {tools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        onClick={() => setIsToolsOpen(false)}
                        className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {tool.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-2 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle color theme"
              type="button"
            >
              {theme === 'dark' ? (
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 3.1a1 1 0 0 1 1 1V6a1 1 0 1 1-2 0V4.1a1 1 0 0 1 1-1Zm0 11.4a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm8.9-2.5a1 1 0 0 1-1 1H18a1 1 0 1 1 0-2h1.9a1 1 0 0 1 1 1ZM7 13a1 1 0 0 1-1 1H4.1a1 1 0 0 1 0-2H6a1 1 0 0 1 1 1Zm9.07 4.24a1 1 0 0 1 0 1.42l-1.34 1.35a1 1 0 0 1-1.42-1.42l1.35-1.35a1 1 0 0 1 1.41 0Zm-8.48-8.49a1 1 0 0 1 0 1.42L6.24 11.5a1 1 0 0 1-1.42-1.42L6.17 8.2a1 1 0 0 1 1.42 0Zm8.48 0L15.7 9.55A1 1 0 0 1 14.28 8.1l1.35-1.34a1 1 0 0 1 1.42 1.42ZM9.17 16.24l-1.35 1.35a1 1 0 0 1-1.42-1.42l1.35-1.35a1 1 0 1 1 1.42 1.42ZM12 18a1 1 0 0 1 1 1.1V21a1 1 0 1 1-2 0v-1.9A1 1 0 0 1 12 18Z" />
                  </svg>
                  <span>Light</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
                  </svg>
                  <span>Dark</span>
                </span>
              )}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4"
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Tools Section */}
              <div className="px-4 py-2">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Quick Tools
                </p>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="px-4 pt-2">
                <button
                  onClick={toggleTheme}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle color theme"
                  type="button"
                >
                  {theme === 'dark' ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 3.1a1 1 0 0 1 1 1V6a1 1 0 1 1-2 0V4.1a1 1 0 0 1 1-1Zm0 11.4a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm8.9-2.5a1 1 0 0 1-1 1H18a1 1 0 1 1 0-2h1.9a1 1 0 0 1 1 1ZM7 13a1 1 0 0 1-1 1H4.1a1 1 0 0 1 0-2H6a1 1 0 0 1 1 1Zm9.07 4.24a1 1 0 0 1 0 1.42l-1.34 1.35a1 1 0 0 1-1.42-1.42l1.35-1.35a1 1 0 0 1 1.41 0Zm-8.48-8.49a1 1 0 0 1 0 1.42L6.24 11.5a1 1 0 0 1-1.42-1.42L6.17 8.2a1 1 0 0 1 1.42 0Zm8.48 0L15.7 9.55A1 1 0 0 1 14.28 8.1l1.35-1.34a1 1 0 0 1 1.42 1.42ZM9.17 16.24l-1.35 1.35a1 1 0 0 1-1.42-1.42l1.35-1.35a1 1 0 1 1 1.42 1.42ZM12 18a1 1 0 0 1 1 1.1V21a1 1 0 1 1-2 0v-1.9A1 1 0 0 1 12 18Z" />
                      </svg>
                      <span>Switch to Light</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
                      </svg>
                      <span>Switch to Dark</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
