import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

// DELETE holiday
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    // Only delete if the holiday belongs to the user
    const holiday = await Holiday.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
