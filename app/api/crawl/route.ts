import { NextRequest, NextResponse } from 'next/server';
import { crawlWebsite } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, maxPages, maxDepth } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required in request body' },
        { status: 400 }
      );
    }

    const result = await crawlWebsite(url, {
      maxPages: typeof maxPages === 'number' ? maxPages : undefined,
      maxDepth: typeof maxDepth === 'number' ? maxDepth : undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    let errorMessage = 'Failed to crawl website';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Crawl error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

