import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const user = await requireAuth();
    await connectDB();
    
    // Convert userId string to ObjectId for proper MongoDB query
    const userId = new mongoose.Types.ObjectId(user.id);
    const groups = await Group.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Get groups error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();
    const data = await request.json();

    const { name, parentStore, childStores, syncType } = data;

    if (!name || !parentStore || !parentStore.domain || !parentStore.adminToken) {
      return NextResponse.json(
        { error: 'Name, parentStore domain and adminToken are required' },
        { status: 400 }
      );
    }

    // Convert userId string to ObjectId
    const userId = new mongoose.Types.ObjectId(user.id);

    const group = new Group({
      name,
      userId,
      parentStore,
      childStores: childStores || [],
      syncType: syncType || 'async',
      isSyncing: false,
    });

    await group.save();

    return NextResponse.json({ group }, { status: 201 });
  } catch (error: any) {
    console.error('Create group error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create group' },
      { status: 500 }
    );
  }
}


