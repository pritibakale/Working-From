import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

// GET all events for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const events = await Event.find({ userId: session.user.id }).sort({ startDate: 1 });

    const formattedEvents = events.map((event) => ({
      id: event._id.toString(),
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      color: event.color,
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST create new event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const event = await Event.create({
      userId: session.user.id,
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      color: body.color,
    });

    return NextResponse.json({
      id: event._id.toString(),
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      color: event.color,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
