import { NextRequest, NextResponse } from 'next/server';
import { getProductsFromStore } from '@/lib/shopify';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await connectDB();
    
    const userId = new mongoose.Types.ObjectId(user.id);
    const group = await Group.findOne({ _id: params.id, userId });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const products = await getProductsFromStore(
      group.parentStore.domain,
      group.parentStore.adminToken
    );

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Get group products error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}


