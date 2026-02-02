import { NextRequest, NextResponse } from 'next/server';
import { extractWebsiteData } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    const data = await extractWebsiteData(url);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    let errorMessage = 'Failed to extract website data';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Provide more user-friendly error messages
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        errorMessage = 'Website took too long to respond. Please try again or check if the website is accessible.';
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        errorMessage = 'Cannot connect to the website. Please check the URL and try again.';
      } else if (errorMessage.includes('CORS') || errorMessage.includes('blocked')) {
        errorMessage = 'Website blocked the request. This may be due to security restrictions.';
      } else if (errorMessage.includes('Invalid URL')) {
        errorMessage = 'Invalid URL format. Please enter a valid website URL.';
      }
    }
    console.error('Extract error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required in request body' },
        { status: 400 }
      );
    }

    const data = await extractWebsiteData(url);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    let errorMessage = 'Failed to extract website data';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Provide more user-friendly error messages
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        errorMessage = 'Website took too long to respond. Please try again or check if the website is accessible.';
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        errorMessage = 'Cannot connect to the website. Please check the URL and try again.';
      } else if (errorMessage.includes('CORS') || errorMessage.includes('blocked')) {
        errorMessage = 'Website blocked the request. This may be due to security restrictions.';
      } else if (errorMessage.includes('Invalid URL')) {
        errorMessage = 'Invalid URL format. Please enter a valid website URL.';
      }
    }
    console.error('Extract error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
