import { NextRequest, NextResponse } from 'next/server';
import { scrapeProducts } from '@/lib/shopify';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(); // Require authentication
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const products = await scrapeProducts(domain);

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Scrape error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to scrape products' },
      { status: 500 }
    );
  }
}


