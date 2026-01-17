import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Holiday from '@/models/Holiday';
import { initializeDatabase } from '@/lib/db-init';

let dbInitialized = false;

// GET all holidays for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const holidays = await Holiday.find({ userId: session.user.id }).sort({ date: 1 });

    const formattedHolidays = holidays.map((holiday) => ({
      id: holiday._id.toString(),
      name: holiday.name,
      date: holiday.date,
    }));

    return NextResponse.json(formattedHolidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

// POST create new holiday
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Initialize database indexes on first request
    if (!dbInitialized) {
      await initializeDatabase();
      dbInitialized = true;
    }

    const body = await request.json();

    const holiday = await Holiday.create({
      userId: session.user.id,
      name: body.name,
      date: body.date,
    });

    return NextResponse.json({
      id: holiday._id.toString(),
      name: holiday.name,
      date: holiday.date,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}
