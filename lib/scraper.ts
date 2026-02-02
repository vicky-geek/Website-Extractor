import * as cheerio from 'cheerio';
import axios from 'axios';
import type { Element } from 'domhandler';
import { findPhoneNumbersInText, parsePhoneNumberFromString } from 'libphonenumber-js/max';
import puppeteer from 'puppeteer';

export interface ExtractedData {
  url: string;
  title: string;  
  description: string;
  ogImage?: string;
  favicon?: string;
  headings: Array<{ level: string; text: string }>;
  links: Array<{ text: string; href: string; external: boolean }>;
  images: Array<{ src: string; alt: string }>;
  videos: Array<{ src: string; type: string; thumbnail?: string; platform?: string }>;
  metaTags: Record<string, string>;
  scripts: string[];
  stylesheets: string[];
  textContent: string;
  emails: string[];
  phoneNumbers: string[];
  fonts: Array<{ name: string; source: string; url?: string; type?: string }>;
  robotsTxt?: string;
  colors: Array<{ value: string; hex: string; rgb?: string; usage: string; frequency: number }>;
  html?: string; // Raw HTML for HTML Extractor tool
}

// Helper function to validate URL and prevent SSRF attacks
function validateUrl(url: string): string {
  let normalizedUrl = url.trim();

  // Add protocol if missing
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch (error) {
    throw new Error('Invalid URL format');
  }

  // Prevent SSRF attacks - block private/internal IPs and localhost
  const hostname = parsedUrl.hostname.toLowerCase();
  const privateIpPatterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ];

  // Check if hostname is an IP address
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || /^\[?([0-9a-fA-F:]+)\]?$/.test(hostname);

  if (isIpAddress || privateIpPatterns.some(pattern => pattern.test(hostname))) {
    throw new Error('Access to private/internal IP addresses is not allowed');
  }

  // Only allow http and https protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are allowed');
  }

  return normalizedUrl;
}

export async function extractWebsiteData(url: string): Promise<ExtractedData> {
  let browser: any = null;
  let page: any = null;
  
  try {
    // Validate and normalize URL
    const normalizedUrl = validateUrl(url);

    // Fetch the website using Puppeteer only (full JS-rendered content)
    let html: string;

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-notifications',
        '--disable-extensions',
        '--disable-popup-blocking',
        '--mute-audio',
        '--hide-scrollbars',
      ],
    });

    page = await browser.newPage();
    page.on('dialog', async (dialog: any) => {
      await dialog.dismiss();
    });

    await page.goto(normalizedUrl, {
      waitUntil: 'networkidle0', // Wait for network to be idle so JS-rendered content is loaded
      timeout: 60000, // 60 seconds timeout
    });

    html = await page.content();

    const $ = cheerio.load(html);

    // Extract base URL for resolving relative links
    const baseUrl = new URL(normalizedUrl);
    const baseOrigin = baseUrl.origin;

    // Extract title
    const title = $('title').first().text().trim() || '';

    // Extract meta description
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // Extract OG image
    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined;

    // Extract favicon
    let favicon: string | undefined;
    // Try different favicon link rel types
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
    ];

    for (const selector of faviconSelectors) {
      const href = $(selector).attr('href');
      if (href) {
        let fullFavicon = href;
        // Resolve relative URLs
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullFavicon = href;
        } else if (href.startsWith('//')) {
          fullFavicon = baseUrl.protocol + href;
        } else if (href.startsWith('/')) {
          fullFavicon = baseOrigin + href;
        } else {
          fullFavicon = new URL(href, normalizedUrl).href;
        }
        favicon = fullFavicon;
        break; // Use the first found favicon
      }
    }

    // If no favicon found in links, try default /favicon.ico
    if (!favicon) {
      favicon = baseOrigin + '/favicon.ico';
    }

    // =======================
    // UNIVERSAL HEADING FIX
    // =======================
    // Extract headings from Puppeteer page (full JS-rendered DOM)
    let headings: Array<{ level: string; text: string }> = [];
    try {
      headings = await page.evaluate(() =>
        Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
          .map(h => ({
            level: h.tagName.toLowerCase(),
            text: (h as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
          }))
          .filter(h => h.text.length > 0)
      );
    } catch (e) {
      // Fallback to cheerio if puppeteer evaluation fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Puppeteer heading evaluation failed, using cheerio fallback');
      }
    }

    // 2️⃣ ARIA headings
    $('[role="heading"]').each((_i, el) => {
      const lvl = $(el).attr('aria-level') || '2';
      headings.push({ level: `h${lvl}`, text: $(el).text().trim() });
    });

    // 3️⃣ Font-size based fallback (VERY IMPORTANT)
    $('*').each((_i, el) => {
      const text = $(el).text().trim();
      if (!text || text.length < 4) return;

      const style = ($(el).attr('style') || '').toLowerCase();

      if (style.includes('font-size')) {
        if (style.match(/font-size:\s*(3|4|5)\dpx/)) headings.push({ level: 'h1', text });
        else if (style.match(/font-size:\s*(2|3)\dpx/)) headings.push({ level: 'h2', text });
        else if (style.match(/font-size:\s*(18|19|20)px/)) headings.push({ level: 'h3', text });
      }
    });

    // 4️⃣ Class-based fallback (LAST)
    $('[class]').each((_i, el) => {
      const text = $(el).text().trim();
      if (!text) return;

      const cls = ($(el).attr('class') || '').toLowerCase();

      if (cls.match(/h1|hero-title|page-title|main-title/)) headings.push({ level: 'h1', text });
      else if (cls.match(/h2|section-title/)) headings.push({ level: 'h2', text });
      else if (cls.match(/h3|block-title/)) headings.push({ level: 'h3', text });
    });


    // Extract all links
    const links: Array<{ text: string; href: string; external: boolean }> = [];
    const linksSet = new Set<string>(); // Track unique URLs to avoid duplicates
    
    $('a[href]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      if (!href || href.trim() === '' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return; // Skip empty, javascript, mailto, and tel links
      }
      
      const text = $(element).text().trim() || $(element).attr('aria-label') || $(element).attr('title') || href;
      let fullUrl = href;

      try {
        // Resolve relative URLs
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullUrl = href;
        } else if (href.startsWith('//')) {
          fullUrl = baseUrl.protocol + href;
        } else if (href.startsWith('/')) {
          fullUrl = baseOrigin + href;
        } else {
          fullUrl = new URL(href, normalizedUrl).href;
        }

        // Only add if URL is valid and not already added
        if (fullUrl && !linksSet.has(fullUrl)) {
          linksSet.add(fullUrl);
          const external = !fullUrl.startsWith(baseOrigin);
          links.push({ text: text || fullUrl, href: fullUrl, external });
        }
      } catch (e) {
        // Skip invalid URLs
        console.log('Skipping invalid URL:', href);
      }
    });

    // Page is open from Puppeteer fetch; also extract links from DOM (for dynamically loaded content)
    if (page) {
      try {
        const puppeteerLinks = await page.evaluate((baseOrigin: string) => {
          const linkElements = Array.from(document.querySelectorAll('a[href]'));
          return linkElements.map((el: any) => {
            const href = el.getAttribute('href') || '';
            if (!href || href.trim() === '' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
              return null;
            }
            const text = el.innerText?.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || href;
            let fullUrl = href;
            
            try {
              if (href.startsWith('http://') || href.startsWith('https://')) {
                fullUrl = href;
              } else if (href.startsWith('//')) {
                fullUrl = window.location.protocol + href;
              } else if (href.startsWith('/')) {
                fullUrl = baseOrigin + href;
              } else {
                fullUrl = new URL(href, window.location.href).href;
              }
              
              return {
                text: text || fullUrl,
                href: fullUrl,
                external: !fullUrl.startsWith(baseOrigin)
              };
            } catch (e) {
              return null;
            }
          }).filter((link: any) => link !== null && link.href);
        }, baseOrigin);

        // Merge puppeteer links with cheerio links (avoid duplicates)
        puppeteerLinks.forEach((link: any) => {
          if (link && link.href && !linksSet.has(link.href)) {
            linksSet.add(link.href);
            links.push(link);
          }
        });
      } catch (e) {
        // Ignore puppeteer link extraction errors
        console.log('Puppeteer link extraction failed, using cheerio links only');
      }
    }

    // Extract all images (use Set of src to avoid duplicates, then build array)
    const seenImageSrc = new Set<string>();
    const images: Array<{ src: string; alt: string }> = [];

    const resolveImageSrc = (src: string): string => {
      if (!src || !src.trim()) return '';
      if (src.startsWith('http://') || src.startsWith('https://')) return src;
      if (src.startsWith('//')) return baseUrl.protocol + src;
      if (src.startsWith('/')) return baseOrigin + src;
      return new URL(src, normalizedUrl).href;
    };

    $('img[src]').each((_i: number, element: Element) => {
      const src = $(element).attr('src') || '';
      const alt = $(element).attr('alt') || '';
      const fullSrc = resolveImageSrc(src);
      if (!fullSrc) return;
      if (!seenImageSrc.has(fullSrc)) {
        seenImageSrc.add(fullSrc);
        images.push({ src: fullSrc, alt });
      }
    });

    // Include all favicon images (link rel="icon", apple-touch-icon, etc.)
    const faviconLinkSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
    ];
    for (const selector of faviconLinkSelectors) {
      const links = $(selector);
      for (let i = 0; i < links.length; i++) {
        const el = links.eq(i);
        const href = el.attr('href');
        if (!href) continue;
        const fullSrc = resolveImageSrc(href);
        if (!fullSrc || seenImageSrc.has(fullSrc)) continue;
        seenImageSrc.add(fullSrc);
        const sizes = el.attr('sizes') || '';
        images.push({ src: fullSrc, alt: sizes ? `Favicon ${sizes}` : 'Favicon' });
      }
    }
    // Default favicon.ico
    const defaultFavicon = baseOrigin + '/favicon.ico';
    if (!seenImageSrc.has(defaultFavicon)) {
      seenImageSrc.add(defaultFavicon);
      images.push({ src: defaultFavicon, alt: 'Favicon' });
    }

    // Extract all videos
    const videos: Array<{ src: string; type: string; thumbnail?: string; platform?: string }> = [];

    // Helper function to resolve video URL
    const resolveVideoUrl = (url: string): string => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      } else if (url.startsWith('//')) {
        return baseUrl.protocol + url;
      } else if (url.startsWith('/')) {
        return baseOrigin + url;
      } else {
        return new URL(url, normalizedUrl).href;
      }
    };

    // Extract from <video> tags with src attribute
    $('video').each((_i: number, element: Element) => {
      // Check multiple attributes for lazy loading
      const src = $(element).attr('src') ||
        $(element).attr('data-src') ||
        $(element).attr('data-lazy-src') ||
        $(element).attr('data-original') ||
        '';
      const poster = $(element).attr('poster') ||
        $(element).attr('data-poster') ||
        $(element).attr('data-lazy-poster') ||
        '';
      if (src && src.trim()) {
        videos.push({
          src: resolveVideoUrl(src.trim()),
          type: 'video',
          thumbnail: poster ? resolveVideoUrl(poster.trim()) : undefined,
        });
      }
    });

    // Extract from <video> tags with <source> elements
    $('video').each((_i: number, element: Element) => {
      const $video = $(element);
      const poster = $video.attr('poster') ||
        $video.attr('data-poster') ||
        $video.attr('data-lazy-poster') ||
        '';
      $video.find('source').each((_j: number, sourceEl: Element) => {
        // Check multiple attributes for lazy loading
        const src = $(sourceEl).attr('src') ||
          $(sourceEl).attr('data-src') ||
          $(sourceEl).attr('data-lazy-src') ||
          $(sourceEl).attr('data-original') ||
          '';
        const type = $(sourceEl).attr('type') || 'video';
        if (src && src.trim()) {
          videos.push({
            src: resolveVideoUrl(src.trim()),
            type: type,
            thumbnail: poster ? resolveVideoUrl(poster.trim()) : undefined,
          });
        }
      });
    });

    // Extract from <iframe> tags (YouTube, Vimeo, etc.)
    $('iframe').each((_i: number, element: Element) => {
      // Check multiple attributes for lazy loading
      const src = $(element).attr('src') ||
        $(element).attr('data-src') ||
        $(element).attr('data-lazy-src') ||
        $(element).attr('data-original') ||
        '';

      if (src && src.trim()) {
        let platform = 'iframe';
        let videoId = '';
        let thumbnail = '';

        // YouTube - improved regex to catch more patterns
        const youtubePatterns = [
          /(?:youtube\.com\/embed\/)([^"&?\/\s]{11})/,
          /(?:youtube\.com\/watch\?v=)([^"&?\/\s]{11})/,
          /(?:youtu\.be\/)([^"&?\/\s]{11})/,
          /(?:youtube\.com\/v\/)([^"&?\/\s]{11})/,
          /(?:youtube\.com\/.*[?&]v=)([^"&?\/\s]{11})/,
          /(?:youtube-nocookie\.com\/embed\/)([^"&?\/\s]{11})/,
        ];

        for (const pattern of youtubePatterns) {
          const match = src.match(pattern);
          if (match && match[1]) {
            platform = 'youtube';
            videoId = match[1];
            thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            break;
          }
        }

        // Vimeo - improved pattern
        if (platform === 'iframe' && src.includes('vimeo.com')) {
          const vimeoPatterns = [
            /vimeo\.com\/video\/(\d+)/,
            /vimeo\.com\/(\d+)/,
            /player\.vimeo\.com\/video\/(\d+)/,
            /vimeo\.com\/embed\/(\d+)/,
          ];
          for (const pattern of vimeoPatterns) {
            const match = src.match(pattern);
            if (match && match[1]) {
              platform = 'vimeo';
              videoId = match[1];
              break;
            }
          }
        }

        // Dailymotion
        if (platform === 'iframe' && src.includes('dailymotion.com')) {
          const dailymotionMatch = src.match(/dailymotion\.com\/(?:embed\/)?video\/([^\/\?]+)/);
          if (dailymotionMatch && dailymotionMatch[1]) {
            platform = 'dailymotion';
            videoId = dailymotionMatch[1];
          }
        }

        // Add all iframes as potential videos (even if not recognized platform)
        // Only add if it looks like a video (contains video-related domains or is a known platform)
        const isVideoIframe = platform !== 'iframe' ||
          src.includes('video') ||
          src.includes('player') ||
          src.includes('embed') ||
          src.includes('youtube') ||
          src.includes('vimeo') ||
          src.includes('dailymotion');

        if (isVideoIframe) {
          videos.push({
            src: src.trim(),
            type: 'embed',
            platform: platform !== 'iframe' ? platform : undefined,
            thumbnail: thumbnail || undefined,
          });
        }
      }
    });

    // Extract from <embed> tags
    $('embed[src]').each((_i: number, element: Element) => {
      const src = $(element).attr('src') || '';
      if (src && (src.includes('.mp4') || src.includes('.webm') || src.includes('.ogg') || src.includes('video'))) {
        videos.push({
          src: resolveVideoUrl(src),
          type: 'embed',
        });
      }
    });

    // Extract from <object> tags with video data
    $('object[data]').each((_i: number, element: Element) => {
      const data = $(element).attr('data') || '';
      if (data && (data.includes('.mp4') || data.includes('.webm') || data.includes('.ogg'))) {
        videos.push({
          src: resolveVideoUrl(data),
          type: 'object',
        });
      }
    });

    // Extract from <a> tags with video file extensions
    $('a[href]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
      const isVideo = videoExtensions.some(ext => href.toLowerCase().endsWith(ext));
      if (isVideo) {
        let fullHref = href;
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullHref = href;
        } else if (href.startsWith('//')) {
          fullHref = baseUrl.protocol + href;
        } else if (href.startsWith('/')) {
          fullHref = baseOrigin + href;
        } else {
          fullHref = new URL(href, normalizedUrl).href;
        }
        videos.push({
          src: fullHref,
          type: 'direct',
        });
      }
    });

    // Extract from Open Graph video meta tags
    const ogVideo = $('meta[property="og:video"]').attr('content') ||
      $('meta[property="og:video:url"]').attr('content') ||
      $('meta[property="og:video:secure_url"]').attr('content') || '';
    if (ogVideo && ogVideo.trim()) {
      let platform = 'iframe';
      let thumbnail = '';

      // Check if it's YouTube
      const youtubeMatch = ogVideo.match(/(?:youtube\.com|youtu\.be).*[?&\/](?:v=|embed\/|v\/)([^"&?\/\s]{11})/);
      if (youtubeMatch && youtubeMatch[1]) {
        platform = 'youtube';
        thumbnail = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
      } else if (ogVideo.includes('vimeo.com')) {
        platform = 'vimeo';
      } else if (ogVideo.includes('dailymotion.com')) {
        platform = 'dailymotion';
      }

      videos.push({
        src: ogVideo.trim(),
        type: 'embed',
        platform: platform !== 'iframe' ? platform : undefined,
        thumbnail: thumbnail || undefined,
      });
    }

    // Extract from Twitter video meta tags
    const twitterVideo = $('meta[name="twitter:player"]').attr('content') ||
      $('meta[property="twitter:player"]').attr('content') || '';
    if (twitterVideo && twitterVideo.trim() && !videos.some(v => v.src === twitterVideo.trim())) {
      videos.push({
        src: twitterVideo.trim(),
        type: 'embed',
      });
    }

    // Extract video URLs from raw HTML content (for videos embedded in scripts or data attributes)
    const videoHtmlContent = $.html();
    if (videoHtmlContent) {
      // Look for video URLs in the HTML
      const videoUrlPatterns = [
        /(https?:\/\/[^\s"<>]+\.(?:mp4|webm|ogg|mov|avi|wmv|flv|mkv)(?:\?[^\s"<>]*)?)/gi,
        /(https?:\/\/[^\s"<>]*youtube\.com[^\s"<>]*)/gi,
        /(https?:\/\/[^\s"<>]*youtu\.be[^\s"<>]*)/gi,
        /(https?:\/\/[^\s"<>]*vimeo\.com[^\s"<>]*)/gi,
        /(https?:\/\/[^\s"<>]*dailymotion\.com[^\s"<>]*)/gi,
      ];

      videoUrlPatterns.forEach(pattern => {
        const matches = videoHtmlContent.match(pattern);
        if (matches) {
          matches.forEach((url: string) => {
            const cleanUrl = url.trim();
            // Only add if not already in videos array
            if (cleanUrl && !videos.some(v => v.src === cleanUrl)) {
              let platform: string | undefined = undefined;
              let thumbnail: string | undefined = undefined;

              // Detect platform
              if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
                const ytMatch = cleanUrl.match(/(?:youtube\.com|youtu\.be).*[?&\/](?:v=|embed\/|v\/)([^"&?\/\s]{11})/);
                if (ytMatch && ytMatch[1]) {
                  platform = 'youtube';
                  thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
                }
              } else if (cleanUrl.includes('vimeo.com')) {
                platform = 'vimeo';
              } else if (cleanUrl.includes('dailymotion.com')) {
                platform = 'dailymotion';
              }

              videos.push({
                src: cleanUrl,
                type: platform ? 'embed' : 'direct',
                platform: platform,
                thumbnail: thumbnail,
              });
            }
          });
        }
      });
    }

    // Remove duplicate videos
    const uniqueVideos = videos.filter((video, index, self) =>
      index === self.findIndex((v) => v.src === video.src)
    );

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development' && uniqueVideos.length > 0) {
      console.log(`Found ${uniqueVideos.length} video(s):`, uniqueVideos.map(v => ({ src: v.src, platform: v.platform })));
    }

    // Extract meta tags
    const metaTags: Record<string, string> = {};
    $('meta').each((_i: number, element: Element) => {
      const name = $(element).attr('name') || $(element).attr('property') || '';
      const content = $(element).attr('content') || '';
      if (name && content) {
        metaTags[name] = content;
      }
    });

    // Extract scripts
    const scripts: string[] = [];
    $('script[src]').each((_i: number, element: Element) => {
      const src = $(element).attr('src') || '';
      if (src) {
        let fullSrc = src;
        if (src.startsWith('http://') || src.startsWith('https://')) {
          fullSrc = src;
        } else if (src.startsWith('//')) {
          fullSrc = baseUrl.protocol + src;
        } else if (src.startsWith('/')) {
          fullSrc = baseOrigin + src;
        } else {
          fullSrc = new URL(src, normalizedUrl).href;
        }
        scripts.push(fullSrc);
      }
    });

    // Extract stylesheets
    const stylesheets: string[] = [];
    $('link[rel="stylesheet"]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      if (href) {
        let fullHref = href;
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullHref = href;
        } else if (href.startsWith('//')) {
          fullHref = baseUrl.protocol + href;
        } else if (href.startsWith('/')) {
          fullHref = baseOrigin + href;
        } else {
          fullHref = new URL(href, normalizedUrl).href;
        }
        stylesheets.push(fullHref);
      }
    });

    // Extract fonts
    const fontsSet = new Map<string, { name: string; source: string; url?: string; type?: string }>();

    // Helper function to add font
    const addFont = (name: string, source: string, url?: string, type?: string) => {
      if (!name || name.trim().length === 0) return;
      const cleanName = name.trim().replace(/['"]/g, '');
      // Filter out generic font families
      const genericFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'inherit', 'initial', 'unset'];
      if (genericFonts.includes(cleanName.toLowerCase())) return;

      // Use first font name if multiple (font-family: "Arial", "Helvetica", sans-serif)
      const firstFont = cleanName.split(',')[0].trim();
      if (firstFont && !fontsSet.has(firstFont.toLowerCase())) {
        fontsSet.set(firstFont.toLowerCase(), {
          name: firstFont,
          source,
          url,
          type,
        });
      }
    };

    // Extract Google Fonts from link tags
    $('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      if (href.includes('fonts.googleapis.com')) {
        // Extract font names from Google Fonts URL
        const fontMatch = href.match(/family=([^&:]+)/);
        if (fontMatch && fontMatch[1]) {
          const fontNames = decodeURIComponent(fontMatch[1]).split('|');
          fontNames.forEach(fontName => {
            const cleanName = fontName.split(':')[0]; // Remove weight/style variants
            addFont(cleanName, 'Google Fonts', href, 'google');
          });
        }
      }
    });

    // Extract font files from links
    const fontExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot', '.svg'];
    $('link[href]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      const rel = $(element).attr('rel') || '';
      if (rel.includes('font') || fontExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
        let fullHref = href;
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullHref = href;
        } else if (href.startsWith('//')) {
          fullHref = baseUrl.protocol + href;
        } else if (href.startsWith('/')) {
          fullHref = baseOrigin + href;
        } else {
          fullHref = new URL(href, normalizedUrl).href;
        }

        // Try to extract font name from URL
        const fontNameMatch = href.match(/([^\/]+)\.(woff|woff2|ttf|otf|eot)/i);
        if (fontNameMatch && fontNameMatch[1]) {
          const fontName = fontNameMatch[1].replace(/[-_]/g, ' ');
          addFont(fontName, 'Font File', fullHref, 'file');
        } else {
          addFont('Custom Font', 'Font File', fullHref, 'file');
        }
      }
    });

    // Extract font-family from inline styles
    $('[style*="font-family"]').each((_i: number, element: Element) => {
      const style = $(element).attr('style') || '';
      const fontFamilyMatch = style.match(/font-family\s*:\s*([^;]+)/i);
      if (fontFamilyMatch && fontFamilyMatch[1]) {
        const fontFamilies = fontFamilyMatch[1].split(',');
        fontFamilies.forEach(font => {
          addFont(font, 'Inline Style');
        });
      }
    });

    // Extract from @font-face in style tags
    $('style').each((_i: number, element: Element) => {
      const styleContent = $(element).html() || '';
      // Extract @font-face declarations
      const fontFaceRegex = /@font-face\s*\{[^}]*font-family\s*:\s*['"]?([^'";}]+)['"]?[^}]*\}/gi;
      let match;
      while ((match = fontFaceRegex.exec(styleContent)) !== null) {
        if (match[1]) {
          addFont(match[1], 'CSS @font-face');
        }
      }

      // Extract font-family from CSS rules
      const fontFamilyRegex = /font-family\s*:\s*([^;]+)/gi;
      while ((match = fontFamilyRegex.exec(styleContent)) !== null) {
        if (match[1]) {
          const fontFamilies = match[1].split(',');
          fontFamilies.forEach(font => {
            addFont(font, 'CSS Style');
          });
        }
      }
    });

    // Extract font-family from computed styles (check common elements)
    $('body, h1, h2, h3, p, div, span, a').each((_i: number, element: Element) => {
      const style = $(element).attr('style') || '';
      if (style.includes('font-family')) {
        const fontFamilyMatch = style.match(/font-family\s*:\s*([^;]+)/i);
        if (fontFamilyMatch && fontFamilyMatch[1]) {
          const fontFamilies = fontFamilyMatch[1].split(',');
          fontFamilies.forEach(font => {
            addFont(font, 'Element Style');
          });
        }
      }
    });

    // Extract fonts from HTML content (look for font names in text)
    const fontsHtmlContent = $.html();
    if (fontsHtmlContent) {
      // Look for common font names in the HTML
      const commonFonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia',
        'Palatino', 'Garamond', 'Bookman', 'Comic Sans', 'Trebuchet', 'Impact',
        'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Ubuntu',
        'Playfair Display', 'Merriweather', 'Poppins', 'Source Sans Pro', 'Nunito'
      ];

      commonFonts.forEach(fontName => {
        if (fontsHtmlContent.includes(fontName)) {
          addFont(fontName, 'Detected in HTML');
        }
      });
    }

    // Convert Map to Array and sort
    const fonts = Array.from(fontsSet.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Extract color palette
    const colorsMap = new Map<string, { value: string; hex: string; rgb?: string; usage: string; frequency: number }>();

    // Helper function to convert color to hex
    const colorToHex = (color: string): string => {
      color = color.trim().toLowerCase();

      // Already hex format
      if (color.startsWith('#')) {
        if (color.length === 4) {
          // Short hex (#fff -> #ffffff)
          return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
        }
        return color.length === 7 ? color : '';
      }

      // RGB/RGBA format
      const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }

      // Named colors
      const namedColors: Record<string, string> = {
        'black': '#000000', 'white': '#ffffff', 'red': '#ff0000', 'green': '#008000',
        'blue': '#0000ff', 'yellow': '#ffff00', 'cyan': '#00ffff', 'magenta': '#ff00ff',
        'silver': '#c0c0c0', 'gray': '#808080', 'maroon': '#800000', 'olive': '#808000',
        'lime': '#00ff00', 'aqua': '#00ffff', 'teal': '#008080', 'navy': '#000080',
        'fuchsia': '#ff00ff', 'purple': '#800080', 'orange': '#ffa500', 'pink': '#ffc0cb',
        'transparent': 'transparent'
      };

      if (namedColors[color]) {
        return namedColors[color];
      }

      return '';
    };

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string): string => {
      if (!hex || hex === 'transparent' || !hex.startsWith('#')) return '';
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
        : '';
    };

    // Helper function to add color
    const addColor = (colorValue: string, usage: string) => {
      if (!colorValue || colorValue.trim() === '' || colorValue === 'inherit' || colorValue === 'initial' || colorValue === 'unset') {
        return;
      }

      const hex = colorToHex(colorValue);
      if (!hex || hex === 'transparent') return;

      const key = hex.toLowerCase();
      const existing = colorsMap.get(key);

      if (existing) {
        existing.frequency += 1;
        if (!existing.usage.includes(usage)) {
          existing.usage += `, ${usage}`;
        }
      } else {
        const rgb = hexToRgb(hex);
        colorsMap.set(key, {
          value: colorValue,
          hex: hex,
          rgb: rgb,
          usage: usage,
          frequency: 1,
        });
      }
    };

    // Extract colors from inline styles
    $('[style]').each((_i: number, element: Element) => {
      const style = $(element).attr('style') || '';

      // Extract background-color
      const bgMatch = style.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      if (bgMatch && bgMatch[1]) {
        addColor(bgMatch[1].trim(), 'Background');
      }

      // Extract color
      const colorMatch = style.match(/color\s*:\s*([^;]+)/i);
      if (colorMatch && colorMatch[1]) {
        addColor(colorMatch[1].trim(), 'Text');
      }

      // Extract border-color
      const borderMatch = style.match(/border(?:-color)?\s*:\s*([^;]+)/i);
      if (borderMatch && borderMatch[1]) {
        const borderValue = borderMatch[1].trim();
        // Try to extract color from border shorthand
        const borderColorMatch = borderValue.match(/(?:^|\s)(#[0-9a-f]{3,6}|rgb\([^)]+\)|[a-z]+)(?:\s|$)/i);
        if (borderColorMatch && borderColorMatch[1]) {
          addColor(borderColorMatch[1].trim(), 'Border');
        }
      }
    });

    // Extract colors from style tags
    $('style').each((_i: number, element: Element) => {
      const styleContent = $(element).html() || '';

      // Extract background-color
      const bgRegex = /background(?:-color)?\s*:\s*([^;{}]+)/gi;
      let match;
      while ((match = bgRegex.exec(styleContent)) !== null) {
        if (match[1]) {
          addColor(match[1].trim(), 'Background');
        }
      }

      // Extract color
      const colorRegex = /color\s*:\s*([^;{}]+)/gi;
      while ((match = colorRegex.exec(styleContent)) !== null) {
        if (match[1]) {
          addColor(match[1].trim(), 'Text');
        }
      }

      // Extract border-color
      const borderColorRegex = /border(?:-color)?\s*:\s*([^;{}]+)/gi;
      while ((match = borderColorRegex.exec(styleContent)) !== null) {
        if (match[1]) {
          const borderValue = match[1].trim();
          const borderColorMatch = borderValue.match(/(?:^|\s)(#[0-9a-f]{3,6}|rgb\([^)]+\)|[a-z]+)(?:\s|$)/i);
          if (borderColorMatch && borderColorMatch[1]) {
            addColor(borderColorMatch[1].trim(), 'Border');
          }
        }
      }
    });

    // Extract colors from HTML content (look for hex colors and rgb)
    const colorsHtmlContent = $.html();
    if (colorsHtmlContent) {
      // Extract hex colors
      const hexRegex = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
      let match;
      while ((match = hexRegex.exec(colorsHtmlContent)) !== null) {
        if (match[0]) {
          addColor(match[0], 'Detected');
        }
      }

      // Extract rgb colors
      const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi;
      while ((match = rgbRegex.exec(colorsHtmlContent)) !== null) {
        if (match[0]) {
          addColor(match[0], 'Detected');
        }
      }
    }

    // Convert Map to Array, sort by frequency (most used first), then by hex
    const colors = Array.from(colorsMap.values())
      .sort((a, b) => {
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }
        return a.hex.localeCompare(b.hex);
      })
      .slice(0, 50); // Limit to top 50 colors

    // Extract robots.txt
    let robotsTxt: string | undefined;
    try {
      const robotsUrl = new URL('/robots.txt', normalizedUrl).href;
      const robotsResponse = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        validateStatus: (status) => status < 500, // Don't throw on 404
      });

      if (robotsResponse.status === 200 && robotsResponse.data) {
        robotsTxt = typeof robotsResponse.data === 'string'
          ? robotsResponse.data
          : JSON.stringify(robotsResponse.data);
      }
    } catch (error) {
      // robots.txt not found or inaccessible - this is okay, just continue
      if (process.env.NODE_ENV === 'development') {
        console.log('robots.txt not found or inaccessible');
      }
    }

    // Extract main text content (from paragraphs)
    const textContent = $('p').map((_i: number, element: Element) => $(element).text().trim()).get().join(' ');

    // Extract emails
    const emailsSet = new Set<string>();

    // Email regex pattern - more comprehensive
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Helper function to validate and add email
    const addEmail = (email: string) => {
      if (!email) return;
      const cleanEmail = email.toLowerCase().trim();
      // Filter out common test/example emails and invalid patterns
      if (
        cleanEmail &&
        cleanEmail.length > 3 &&
        !cleanEmail.includes('example.com') &&
        !cleanEmail.includes('test@') &&
        !cleanEmail.includes('noreply') &&
        !cleanEmail.includes('no-reply') &&
        !cleanEmail.startsWith('@') &&
        !cleanEmail.endsWith('@') &&
        cleanEmail.includes('@') &&
        cleanEmail.split('@').length === 2
      ) {
        emailsSet.add(cleanEmail);
      }
    };

    // Extract emails from mailto: links
    $('a[href^="mailto:"]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      // Remove mailto: prefix and split by ? to remove query params
      const emailMatch = href.replace(/^mailto:/i, '').split('?')[0].split('&')[0].trim();
      if (emailMatch) {
        addEmail(emailMatch);
      }
    });

    // Extract emails from all text content (including body, paragraphs, spans, etc.)
    const allTextForEmails = $.text();
    if (allTextForEmails) {
      // Reset regex lastIndex to avoid issues with global flag
      emailRegex.lastIndex = 0;
      const emailMatches = allTextForEmails.match(emailRegex);
      if (emailMatches) {
        emailMatches.forEach((email) => {
          addEmail(email);
        });
      }
    }

    // Extract emails from HTML content directly (not just text)
    const htmlContentForEmails = $.html();
    if (htmlContentForEmails) {
      emailRegex.lastIndex = 0;
      const htmlEmailMatches = htmlContentForEmails.match(emailRegex);
      if (htmlEmailMatches) {
        htmlEmailMatches.forEach((email) => {
          addEmail(email);
        });
      }
    }

    // Extract emails from meta tags and other attributes
    $('[content*="@"]').each((_i: number, element: Element) => {
      const content = $(element).attr('content') || '';
      if (content) {
        emailRegex.lastIndex = 0;
        const matches = content.match(emailRegex);
        if (matches) {
          matches.forEach((email) => {
            addEmail(email);
          });
        }
      }
    });

    // Extract emails from data attributes
    $('[data-email], [data-mail]').each((_i: number, element: Element) => {
      const email = $(element).attr('data-email') || $(element).attr('data-mail') || '';
      if (email) {
        addEmail(email);
      }
    });

    // Convert Set to Array and sort
    const emails = Array.from(emailsSet).sort();

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development' && emails.length > 0) {
      console.log(`Found ${emails.length} email(s):`, emails);
    }

    // Extract phone numbers using libphonenumber-js/max (supports all countries and formats)
    const phoneNumbersSet = new Set<string>();

    // Helper function to check if a phone number is a dummy/test number
    const isDummyNumber = (phone: string): boolean => {
      if (!phone) return true;

      // Remove all non-digit characters for checking
      const digitsOnly = phone.replace(/\D/g, '');

      // Check for obvious dummy patterns
      const dummyPatterns = [
        /^555\d{4}$/, // US 555-0100 to 555-9999 (test numbers)
        /^1234567890?$/, // 123-456-7890
        /^0000000000?$/, // 000-000-0000
        /^1111111111?$/, // All 1s
        /^2222222222?$/, // All 2s
        /^3333333333?$/, // All 3s
        /^4444444444?$/, // All 4s
        /^5555555555?$/, // All 5s
        /^6666666666?$/, // All 6s
        /^7777777777?$/, // All 7s
        /^8888888888?$/, // All 8s
        /^9999999999?$/, // All 9s
        /^0123456789?$/, // Sequential 0-9
        /^9876543210?$/, // Reverse sequential
        /^(\d)\1{9,}$/, // All same digits (10+ digits)
        /^555\d{7}$/, // 555-XXXX-XXXX format
      ];

      // Check against patterns
      for (const pattern of dummyPatterns) {
        if (pattern.test(digitsOnly)) {
          return true;
        }
      }

      // Check for numbers with too many repeating digits (likely dummy)
      const repeatingDigitPattern = /(\d)\1{6,}/;
      if (repeatingDigitPattern.test(digitsOnly) && digitsOnly.length >= 10) {
        return true;
      }

      // Check for sequential patterns (1234, 4321, etc.)
      let isSequential = true;
      let isReverseSequential = true;
      for (let i = 1; i < Math.min(digitsOnly.length, 10); i++) {
        const current = parseInt(digitsOnly[i]);
        const previous = parseInt(digitsOnly[i - 1]);
        if (current !== previous + 1) isSequential = false;
        if (current !== previous - 1) isReverseSequential = false;
      }
      if ((isSequential || isReverseSequential) && digitsOnly.length >= 7) {
        return true;
      }

      // Check for common test/placeholder numbers
      const testNumbers = [
        '5550100', '5550199', '5551234', '5555555',
        '1234567', '12345678', '123456789', '1234567890',
        '0000000', '00000000', '000000000', '0000000000',
        '1111111', '11111111', '111111111', '1111111111',
        '9999999', '99999999', '999999999', '9999999999',
      ];

      if (testNumbers.includes(digitsOnly)) {
        return true;
      }

      return false;
    };

    // Helper function to validate and format phone number using libphonenumber-js
    // Uses the library's automatic country detection - works for ALL countries!
    const addPhoneNumber = (phone: string, defaultCountry?: string) => {
      if (!phone) return;

      try {
        // Clean phone string - remove tel: prefix and common prefixes
        let cleanPhone = phone.trim()
          .replace(/^tel:/i, '') // Remove tel: prefix
          .replace(/^call\s*:?/i, '') // Remove "call:" prefix
          .replace(/^phone\s*:?/i, '') // Remove "phone:" prefix
          .replace(/[^\d+\-().\s]/g, '') // Remove invalid characters but keep digits, +, -, (), ., spaces
          .trim();

        if (!cleanPhone || cleanPhone.length < 7) return; // Too short to be a phone number

        // Check if it's a dummy/test number before processing
        if (isDummyNumber(cleanPhone)) {
          return; // Skip dummy numbers
        }

        // BEST APPROACH: Use findPhoneNumbersInText first - it automatically detects ALL countries!
        // This is better than parsePhoneNumberFromString because it doesn't need country codes
        try {
          const foundNumbers = findPhoneNumbersInText(cleanPhone);
          if (foundNumbers && foundNumbers.length > 0) {
            foundNumbers.forEach((found: { number: any }) => {
              if (found.number && (found.number.isValid() || found.number.isPossible())) {
                try {
                  const formatted = found.number.formatInternational();
                  if (formatted && !isDummyNumber(formatted)) {
                    phoneNumbersSet.add(formatted);
                  }
                } catch (e) {
                  try {
                    const e164 = found.number.format('E.164');
                    if (e164 && !isDummyNumber(e164)) {
                      phoneNumbersSet.add(e164);
                    }
                  } catch (e2) {
                    // Skip if formatting fails
                  }
                }
              }
            });
            return; // Successfully found using automatic detection
          }
        } catch (e) {
          // Continue to fallback methods
        }

        // Fallback: Try to parse as international format
        let parsedNumber = null as ReturnType<typeof parsePhoneNumberFromString> | null;

        // First, try parsing as-is (might already have country code)
        parsedNumber = parsePhoneNumberFromString(cleanPhone);

        // If that fails, try with default country if provided
        if ((!parsedNumber || !parsedNumber.isValid()) && defaultCountry) {
          parsedNumber = parsePhoneNumberFromString(cleanPhone, defaultCountry as any);
        }

        // If parsing failed, try using findPhoneNumbersInText to extract from text
        if (!parsedNumber || !parsedNumber.isValid()) {
          const foundNumbers = findPhoneNumbersInText(cleanPhone, { defaultCountry: defaultCountry as any });
          if (foundNumbers && foundNumbers.length > 0) {
            foundNumbers.forEach((found: { number: any }) => {
              if (found.number && (found.number.isValid() || found.number.isPossible())) {
                try {
                  const formatted = found.number.formatInternational();
                  // Check if formatted number is a dummy before adding
                  if (formatted && !isDummyNumber(formatted)) {
                    phoneNumbersSet.add(formatted);
                  }
                } catch (e) {
                  // Try E.164 format as fallback
                  try {
                    const e164 = found.number.format('E.164');
                    if (e164 && !isDummyNumber(e164)) {
                      phoneNumbersSet.add(e164);
                    }
                  } catch (e2) {
                    // Skip if formatting fails
                  }
                }
              }
            });
            return;
          }
        }

        // If we have a valid parsed number, format and add it
        if (parsedNumber && (parsedNumber.isValid() || parsedNumber.isPossible())) {
          try {
            // Format in international format (E.164)
            const formatted = parsedNumber.formatInternational();
            // Check if formatted number is a dummy before adding
            if (formatted && !isDummyNumber(formatted)) {
              phoneNumbersSet.add(formatted);
            }
          } catch (e) {
            // Try E.164 format as fallback
            try {
              const e164 = parsedNumber.format('E.164');
              if (e164 && !isDummyNumber(e164)) {
                phoneNumbersSet.add(e164);
              }
            } catch (e2) {
              // Skip if formatting fails
            }
          }
        } else {
          // Fallback: try to extract from text using findPhoneNumbersInText
          const foundNumbers = findPhoneNumbersInText(cleanPhone);
          if (foundNumbers && foundNumbers.length > 0) {
            foundNumbers.forEach((found: { number: any }) => {
              if (found.number && (found.number.isValid() || found.number.isPossible())) {
                try {
                  const formatted = found.number.formatInternational();
                  if (formatted) phoneNumbersSet.add(formatted);
                } catch (e) {
                  try {
                    const e164 = found.number.format('E.164');
                    if (e164) phoneNumbersSet.add(e164);
                  } catch (e2) {
                    // Skip if formatting fails
                  }
                }
              }
            });
          } else {
            // Last resort: if it looks like a phone number (has enough digits), check and add it
            const digitsOnly = cleanPhone.replace(/\D/g, '');
            if (digitsOnly.length >= 7 && digitsOnly.length <= 15 && !isDummyNumber(digitsOnly)) {
              // Format as international if starts with +, otherwise add as-is
              if (cleanPhone.startsWith('+')) {
                if (!isDummyNumber(cleanPhone)) {
                  phoneNumbersSet.add(cleanPhone);
                }
              } else if (digitsOnly.length >= 10) {
                // Likely a valid phone number, add with + prefix if not present
                const withPlus = `+${digitsOnly}`;
                if (!isDummyNumber(withPlus)) {
                  phoneNumbersSet.add(withPlus);
                }
              }
            }
          }
        }
      } catch (error) {
        // If libphonenumber fails, try to add as raw if it looks like a phone number
        try {
          const digitsOnly = phone.replace(/\D/g, '');
          if (digitsOnly.length >= 7 && digitsOnly.length <= 15 && !isDummyNumber(digitsOnly)) {
            if (phone.trim().startsWith('+')) {
              if (!isDummyNumber(phone.trim())) {
                phoneNumbersSet.add(phone.trim());
              }
            } else if (digitsOnly.length >= 10) {
              const withPlus = `+${digitsOnly}`;
              if (!isDummyNumber(withPlus)) {
                phoneNumbersSet.add(withPlus);
              }
            }
          }
        } catch (e) {
          // Skip if all fails
        }
      }
    };

    // Improved extraction using libphonenumber-js findPhoneNumbersInText
    // This function automatically detects phone numbers from ALL countries
    const extractPhoneNumbersFromText = (text: string) => {
      if (!text || text.length < 7) return;

      try {
        // Use findPhoneNumbersInText - it automatically detects numbers from all countries
        // No need to specify countries - the library handles it!
        const foundNumbers = findPhoneNumbersInText(text);

        if (foundNumbers && foundNumbers.length > 0) {
          foundNumbers.forEach((found: { number: any }) => {
            if (found.number && (found.number.isValid() || found.number.isPossible())) {
              try {
                const formatted = found.number.formatInternational();
                // Check if formatted number is a dummy before adding
                if (formatted && !isDummyNumber(formatted)) {
                  phoneNumbersSet.add(formatted);
                }
              } catch (e) {
                // Try E.164 format as fallback
                try {
                  const e164 = found.number.format('E.164');
                  if (e164 && !isDummyNumber(e164)) {
                    phoneNumbersSet.add(e164);
                  }
                } catch (e2) {
                  // Skip if formatting fails
                }
              }
            }
          });
        }
      } catch (error) {
        // Continue if extraction fails
      }
    };

    // Extract phone numbers from tel: links
    $('a[href^="tel:"]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      const phoneMatch = href.replace(/^tel:/i, '').split('?')[0].trim();
      if (phoneMatch) {
        addPhoneNumber(phoneMatch);
      }
    });

    // Extract phone numbers from all text content using libphonenumber-js
    // This automatically detects numbers from ALL countries - no country code needed!
    const allTextForPhones = $.text();
    if (allTextForPhones) {
      extractPhoneNumbersFromText(allTextForPhones);
    }

    // Extract phone numbers from HTML content (text nodes only, avoid script/style)
    // Using findPhoneNumbersInText which works for ALL countries automatically
    $('body').find('*').not('script, style, noscript').each((_i: number, element: Element) => {
      const text = $(element).text();
      if (text && text.length > 5) {
        try {
          const foundNumbers = findPhoneNumbersInText(text);
          if (foundNumbers && foundNumbers.length > 0) {
            foundNumbers.forEach((found: { number: any }) => {
              if (found.number && found.number.isValid()) {
                const formatted = found.number.formatInternational();
                phoneNumbersSet.add(formatted);
              }
            });
          }
        } catch (error) {
          // Continue if extraction fails
        }
      }
    });

    // Extract phone numbers from meta tags and attributes
    $('[content*="+"], [content*="tel"], [content*="phone"]').each((_i: number, element: Element) => {
      const content = $(element).attr('content') || '';
      if (content && /\+?\d/.test(content)) {
        try {
          const foundNumbers = findPhoneNumbersInText(content);
          if (foundNumbers && foundNumbers.length > 0) {
            foundNumbers.forEach((found: { number: any }) => {
              if (found.number && found.number.isValid()) {
                const formatted = found.number.formatInternational();
                phoneNumbersSet.add(formatted);
              }
            });
          } else {
            // Try direct parsing
            addPhoneNumber(content);
          }
        } catch (error) {
          // Continue if extraction fails
        }
      }
    });

    // Extract phone numbers from data attributes
    $('[data-phone], [data-tel], [data-telephone], [data-mobile], [data-contact], [data-phone-number]').each(
      (_i: number, element: Element) => {
        const phone =
          $(element).attr('data-phone') ||
          $(element).attr('data-tel') ||
          $(element).attr('data-telephone') ||
          $(element).attr('data-mobile') ||
          $(element).attr('data-contact') ||
          $(element).attr('data-phone-number') ||
          '';
        if (phone) {
          addPhoneNumber(phone);
        }
      }
    );

    // Extract phone numbers from JSON-LD structured data (Schema.org)
    $('script[type="application/ld+json"]').each((_i: number, element: Element) => {
      try {
        const jsonText = $(element).html() || '';
        if (jsonText) {
          const jsonData = JSON.parse(jsonText);
          const extractFromObject = (obj: any): void => {
            if (typeof obj === 'string' && /\+?\d/.test(obj)) {
              try {
                const foundNumbers = findPhoneNumbersInText(obj);
                if (foundNumbers && foundNumbers.length > 0) {
                  foundNumbers.forEach((found: { number: any }) => {
                    if (found.number && found.number.isValid()) {
                      const formatted = found.number.formatInternational();
                      phoneNumbersSet.add(formatted);
                    }
                  });
                } else {
                  addPhoneNumber(obj);
                }
              } catch (error) {
                // Continue if extraction fails
              }
            } else if (typeof obj === 'object' && obj !== null) {
              // Check for common phone number properties
              if (obj.telephone || obj.phone || obj.phoneNumber || obj.contactPoint?.telephone) {
                const phoneValue = obj.telephone || obj.phone || obj.phoneNumber || obj.contactPoint?.telephone;
                if (phoneValue) {
                  addPhoneNumber(phoneValue);
                }
              }
              // Recursively search in nested objects
              Object.values(obj).forEach((value) => {
                extractFromObject(value);
              });
            }
          };
          extractFromObject(jsonData);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Extract phone numbers from microdata (itemprop="telephone")
    $('[itemprop="telephone"], [itemprop="phone"]').each((_i: number, element: Element) => {
      const phone = $(element).text().trim() || $(element).attr('content') || '';
      if (phone) {
        addPhoneNumber(phone);
      }
    });

    // Extract phone numbers from all href attributes (including tel:)
    $('a[href*="tel:"], a[href*="phone"], a[href*="call"]').each((_i: number, element: Element) => {
      const href = $(element).attr('href') || '';
      if (href.includes('tel:')) {
        const phoneMatch = href.replace(/^.*tel:/i, '').split('?')[0].split('#')[0].trim();
        if (phoneMatch) {
          addPhoneNumber(phoneMatch);
        }
      }
    });

    // Extract phone numbers from text content of specific elements
    $('address, .phone, .telephone, .contact-phone, [class*="phone"], [class*="tel"], [id*="phone"], [id*="tel"]').each(
      (_i: number, element: Element) => {
        const text = $(element).text();
        if (text) {
          try {
            const foundNumbers = findPhoneNumbersInText(text);
            if (foundNumbers && foundNumbers.length > 0) {
              foundNumbers.forEach((found: { number: any }) => {
                if (found.number && found.number.isValid()) {
                  const formatted = found.number.formatInternational();
                  phoneNumbersSet.add(formatted);
                }
              });
            }
          } catch (error) {
            // Continue if extraction fails
          }
        }
      }
    );

    // Extract from Open Graph and Twitter Card meta tags
    $('meta[property*="phone"], meta[name*="phone"], meta[property*="tel"], meta[name*="tel"]').each(
      (_i: number, element: Element) => {
        const content = $(element).attr('content') || '';
        if (content) {
          addPhoneNumber(content);
        }
      }
    );

    // Convert Set to Array, filter out any remaining dummy numbers, and sort
    const phoneNumbers = Array.from(phoneNumbersSet)
      .filter(phone => !isDummyNumber(phone))
      .sort();

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development' && phoneNumbers.length > 0) {
      console.log(`Found ${phoneNumbers.length} phone number(s):`, phoneNumbers);
    }

    // Cleanup puppeteer if it was used
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    return {
      url: normalizedUrl,
      title,
      description,
      ogImage,
      favicon,
      headings,
      links,
      images,
      videos: uniqueVideos,
      metaTags,
      scripts,
      stylesheets,
      textContent: textContent, // Limit to first 1000 chars
      emails,
      phoneNumbers,
      fonts,
      robotsTxt,
      colors,
      html,
    };
  } catch (error: unknown) {
    // Cleanup puppeteer if it was used
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract data: ${errorMessage}`);
  }
}

export interface ContentExtractionOptions {
  outputFormat: 'markdown' | 'html' | 'text' | 'json';
  textOnly: boolean;
  ignoreLinks: boolean;
  includeElements: string[];
  excludeElements: string[];
}

export async function extractContent(
  url: string,
  options: ContentExtractionOptions
): Promise<string> {
  try {
    // Validate and normalize URL
    const normalizedUrl = validateUrl(url);

    // Fetch the website with improved headers and reasonable timeout
    let response;
    try {
      response = await axios.get(normalizedUrl, {
        timeout: 15000, // 15 seconds - reasonable timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        maxRedirects: 10,
        validateStatus: (status) => status < 500,
      });
    } catch (error: any) {
      // Retry once if first attempt fails
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        try {
          response = await axios.get(normalizedUrl, {
            timeout: 20000, // 20 seconds for retry
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            maxRedirects: 10,
            validateStatus: (status) => status < 500,
          });
        } catch (retryError: any) {
          throw new Error(`Failed to fetch website: ${retryError.message || 'Connection timeout or network error'}`);
        }
      } else {
        throw new Error(`Failed to fetch website: ${error.message || 'Network error'}`);
      }
    }

    if (!response || !response.data) {
      throw new Error('Website returned empty response');
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // Start with body content or full document
    let workingHtml = $('body').length > 0 ? $('body').html() || '' : $.html();
    let $working = cheerio.load(workingHtml);

    // Apply include elements filter
    if (options.includeElements && options.includeElements.length > 0) {
      const $filtered = cheerio.load('<div></div>');
      const $container = $filtered('div');

      options.includeElements.forEach(selector => {
        $working(selector).each((_i, element) => {
          $container.append($working(element).clone());
        });
      });

      // If elements found with include selectors, use filtered content
      if ($container.children().length > 0) {
        $working = $filtered;
      }
    }

    // Apply exclude elements filter
    if (options.excludeElements && options.excludeElements.length > 0) {
      options.excludeElements.forEach(selector => {
        $working(selector).remove();
      });
    }

    // Remove script and style tags
    $working('script, style, noscript').remove();

    // Apply ignoreLinks option
    if (options.ignoreLinks) {
      $working('a').each((_i, element) => {
        const $link = $working(element);
        const text = $link.text();
        $link.replaceWith(text);
      });
    }

    // Extract content based on format
    let content = '';

    switch (options.outputFormat) {
      case 'html':
        content = $working.html() || '';
        if (options.textOnly) {
          // Strip HTML tags
          content = $working.text();
        }
        break;

      case 'markdown':
        content = convertToMarkdown($working, options);
        break;

      case 'text':
        content = $working.text() || '';
        // Clean up whitespace
        content = content.replace(/\s+/g, ' ').trim();
        break;

      case 'json':
        const jsonContent = {
          title: $('title').first().text() || '',
          content: $working.text() || '',
          html: $working.html() || '',
        };
        content = JSON.stringify(jsonContent, null, 2);
        break;

      default:
        content = $working.text() || '';
    }

    return content;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract content: ${errorMessage}`);
  }
}

function convertToMarkdown($: cheerio.CheerioAPI, options: ContentExtractionOptions): string {
  let markdown = '';

  // Process headings
  $('h1, h2, h3, h4, h5, h6').each((_i, element) => {
    const $heading = $(element);
    const level = parseInt(element.tagName.charAt(1));
    const text = $heading.text().trim();
    if (text) {
      markdown += `${'#'.repeat(level)} ${text}\n\n`;
    }
  });

  // Process paragraphs
  $('p').each((_i, element) => {
    const $p = $(element);
    let text = $p.text().trim();

    if (!options.ignoreLinks) {
      // Convert links to markdown
      $p.find('a').each((_j, linkEl) => {
        const $link = $(linkEl);
        const href = $link.attr('href') || '';
        const linkText = $link.text().trim();
        if (href && linkText) {
          text = text.replace(linkText, `[${linkText}](${href})`);
        }
      });
    }

    if (text) {
      markdown += `${text}\n\n`;
    }
  });

  // Process lists
  $('ul, ol').each((_i, element) => {
    const $list = $(element);
    const isOrdered = element.tagName === 'ol';
    $list.find('li').each((_j, liEl) => {
      const $li = $(liEl);
      const text = $li.text().trim();
      if (text) {
        const prefix = isOrdered ? `${_j + 1}. ` : '- ';
        markdown += `${prefix}${text}\n`;
      }
    });
    markdown += '\n';
  });

  // Process blockquotes
  $('blockquote').each((_i, element) => {
    const $blockquote = $(element);
    const text = $blockquote.text().trim();
    if (text) {
      markdown += `> ${text}\n\n`;
    }
  });

  // Process code blocks
  $('pre').each((_i, element) => {
    const $pre = $(element);
    const code = $pre.text().trim();
    if (code) {
      markdown += '```\n' + code + '\n```\n\n';
    }
  });

  // Process images
  if (!options.textOnly) {
    $('img').each((_i, element) => {
      const $img = $(element);
      const src = $img.attr('src') || '';
      const alt = $img.attr('alt') || '';
      if (src) {
        markdown += `![${alt}](${src})\n\n`;
      }
    });
  }

  // If no structured content found, get all text
  if (!markdown.trim()) {
    const text = $.text() || '';
    markdown = text;
  }

  return markdown.trim();
}
