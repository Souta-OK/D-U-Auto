import { NextRequest, NextResponse } from 'next/server';
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

    return NextResponse.json({ group });
  } catch (error: any) {
    console.error('Get group error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await connectDB();
    const data = await request.json();

    // Remove userId from data if present (users can't change ownership)
    const { userId, ...updateData } = data;

    const userIdObj = new mongoose.Types.ObjectId(user.id);
    const group = await Group.findOneAndUpdate(
      { _id: params.id, userId: userIdObj },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error: any) {
    console.error('Update group error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await connectDB();
    
    const userId = new mongoose.Types.ObjectId(user.id);
    const group = await Group.findOneAndDelete({ _id: params.id, userId });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Delete group error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete group' },
      { status: 500 }
    );
  }
}


