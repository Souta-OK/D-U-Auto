import { NextRequest, NextResponse } from 'next/server';
import { uploadProductToStore } from '@/lib/shopify';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(); // Require authentication
    const { domain, adminToken, products } = await request.json();

    if (!domain || !adminToken || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Domain, adminToken, and products array are required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const product of products) {
      try {
        const result = await uploadProductToStore(domain, adminToken, product);
        results.push({ productId: product.id, success: true, data: result });
      } catch (error: any) {
        errors.push({
          productId: product.id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to upload products' },
      { status: 500 }
    );
  }
}


