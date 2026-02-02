import { NextRequest, NextResponse } from 'next/server';
import { extractContent } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, outputFormat, textOnly, ignoreLinks, includeElements, excludeElements } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required in request body' },
        { status: 400 }
      );
    }

    const content = await extractContent(url, {
      outputFormat: outputFormat || 'markdown',
      textOnly: textOnly || false,
      ignoreLinks: ignoreLinks || false,
      includeElements: includeElements || [],
      excludeElements: excludeElements || [],
    });

    return NextResponse.json({ success: true, content });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract content';
    console.error('Content extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
