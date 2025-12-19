import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await connectDB();
    const { action } = await request.json(); // 'sync' or 'unsync'

    const userId = new mongoose.Types.ObjectId(user.id);
    const group = await Group.findOne({ _id: params.id, userId });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    group.isSyncing = action === 'sync';
    await group.save();

    return NextResponse.json({
      group,
      message: action === 'sync' ? 'Sync started' : 'Sync stopped',
    });
  } catch (error: any) {
    console.error('Sync toggle error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to toggle sync' },
      { status: 500 }
    );
  }
}


