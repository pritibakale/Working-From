import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET user settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      totalPaidLeaves: user.totalPaidLeaves || 0,
      weeklyEmailEnabled: user.weeklyEmailEnabled || false,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const updateData: { totalPaidLeaves?: number; weeklyEmailEnabled?: boolean } = {};

    if (body.totalPaidLeaves !== undefined) {
      updateData.totalPaidLeaves = body.totalPaidLeaves;
    }
    if (body.weeklyEmailEnabled !== undefined) {
      updateData.weeklyEmailEnabled = body.weeklyEmailEnabled;
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      totalPaidLeaves: user.totalPaidLeaves,
      weeklyEmailEnabled: user.weeklyEmailEnabled,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
