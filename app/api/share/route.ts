import { NextRequest, NextResponse } from 'next/server';
import { uploadProductToStore } from '@/lib/shopify';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { groupId, products } = await request.json();

    if (!groupId || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'GroupId and products array are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(user.id);
    const group = await Group.findOne({ _id: groupId, userId });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const results = [];
    const errors = [];

    // Upload to all child stores
    for (const childStore of group.childStores) {
      for (const product of products) {
        try {
          const result = await uploadProductToStore(
            childStore.domain,
            childStore.adminToken,
            product
          );
          results.push({
            store: childStore.domain,
            productId: product.id,
            success: true,
            data: result,
          });
        } catch (error: any) {
          errors.push({
            store: childStore.domain,
            productId: product.id,
            success: false,
            error: error.message,
          });
        }
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
    console.error('Share error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to share products' },
      { status: 500 }
    );
  }
}


