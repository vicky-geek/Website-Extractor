# Website Extractor

A powerful Next.js application that extracts all data from any website URL using Cheerio. Extract titles, links, images, headings, meta tags, scripts, stylesheets, and more with a beautiful, modern UI.

## Features

- 🔍 **Complete Website Extraction**: Extract all important data from any website
- 📊 **Comprehensive Data**: Get titles, descriptions, headings, links, images, meta tags, scripts, and stylesheets
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- ⚡ **Fast & Efficient**: Server-side extraction using Cheerio
- 🔗 **Link Resolution**: Automatically resolves relative URLs to absolute URLs
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🌙 **Dark Mode Support**: Automatic dark mode based on system preferences

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Cheerio** - Fast, flexible HTML parsing
- **Axios** - HTTP client for fetching websites
- **Tailwind CSS** - Utility-first CSS framework

## Code Quality

This project uses:
- **Prettier** - Code formatting
- **ESLint** - Code linting with Next.js rules
- **TypeScript** - Strict type checking
- **EditorConfig** - Consistent editor settings

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

### Development Scripts

```bash
# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Type check without building
npm run type-check
```

## Usage

1. Enter a website URL in the input field (e.g., `https://example.com`)
2. Click the "Extract" button
3. View the extracted data in organized tabs:
   - **Overview**: Summary statistics and text content preview
   - **Headings**: All headings (h1-h6) from the page
   - **Links**: All links with external/internal indicators
   - **Images**: All images with previews
   - **Meta Tags**: All meta tags and Open Graph data
   - **Resources**: Scripts and stylesheets used on the page

## API Endpoints

### GET /api/extract?url={website_url}

Extract data from a website URL.

**Query Parameters:**
- `url` (required): The website URL to extract data from

**Example:**
```
GET /api/extract?url=https://example.com
```

### POST /api/extract

Extract data from a website URL using POST request.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "description": "This is an example domain",
    "ogImage": "https://example.com/image.jpg",
    "headings": [...],
    "links": [...],
    "images": [...],
    "metaTags": {...},
    "scripts": [...],
    "stylesheets": [...],
    "textContent": "..."
  }
}
```

## Extracted Data

The extractor collects the following information:

- **Title**: Page title from `<title>` tag
- **Description**: Meta description or Open Graph description
- **OG Image**: Open Graph or Twitter Card image
- **Headings**: All headings (h1-h6) with their levels
- **Links**: All links with text, href, and external/internal classification
- **Images**: All images with src and alt text
- **Meta Tags**: All meta tags including Open Graph and Twitter Card tags
- **Scripts**: All external JavaScript files
- **Stylesheets**: All CSS files
- **Text Content**: Main text content from paragraphs

## Limitations

- **JavaScript-rendered content**: This tool uses Cheerio which only parses static HTML. Content rendered by JavaScript after page load will not be extracted. For JavaScript-heavy sites, consider using Puppeteer or Playwright.
- **Rate Limiting**: Some websites may block or rate-limit scraping requests
- **CORS**: Some websites may have CORS restrictions
- **Authentication**: Protected pages requiring authentication cannot be accessed

## Project Structure

```
website-extractor/
├── app/
│   ├── api/
│   │   └── extract/
│   │       └── route.ts      # API route for extraction
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── ExtractionResults.tsx # Results display component
│   └── UrlInputForm.tsx       # URL input form component
├── lib/
│   └── scraper.ts             # Scraping logic with Cheerio
└── package.json
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
