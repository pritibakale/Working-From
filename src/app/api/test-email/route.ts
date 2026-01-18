import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Event from '@/models/Event';
import Holiday from '@/models/Holiday';
import { sendWeeklyEmail, WeekDay } from '@/lib/email';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Reference Friday that is a WFO day (Jan 23, 2026)
const REFERENCE_OFFICE_FRIDAY = new Date(2026, 0, 23);

function getWorkLocation(date: Date): 'office' | 'home' | null {
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) return null;
  if (dayOfWeek === 1 || dayOfWeek === 2) return 'office';
  if (dayOfWeek === 3 || dayOfWeek === 4) return 'home';

  if (dayOfWeek === 5) {
    const diffTime = date.getTime() - REFERENCE_OFFICE_FRIDAY.getTime();
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
    return diffWeeks % 2 === 0 ? 'office' : 'home';
  }

  return null;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get next Monday
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    // Get the week dates (Monday to Sunday)
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(nextMonday);
      date.setDate(nextMonday.getDate() + i);
      weekDates.push(date);
    }

    const weekStart = formatDisplayDate(weekDates[0]);
    const weekEnd = formatDisplayDate(weekDates[6]);

    // Fetch user's events and holidays
    const startStr = formatDate(weekDates[0]);
    const endStr = formatDate(weekDates[6]);

    const [events, holidays] = await Promise.all([
      Event.find({
        userId: user._id,
        $or: [
          { startDate: { $lte: endStr }, endDate: { $gte: startStr } },
        ],
      }),
      Holiday.find({
        userId: user._id,
        date: { $gte: startStr, $lte: endStr },
      }),
    ]);

    const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));

    // Build week data
    const days: WeekDay[] = weekDates.map((date) => {
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay();
      const isHoliday = holidayMap.has(dateStr);
      const holidayName = holidayMap.get(dateStr);

      const dayEvents = events.filter(
        (e) => dateStr >= e.startDate && dateStr <= e.endDate
      );

      const isPaidLeave = dayEvents.some((e) => e.type === 'paid-leave');
      const regularEvents = dayEvents
        .filter((e) => e.type !== 'paid-leave')
        .map((e) => ({ name: e.name, color: e.color }));

      let location = getWorkLocation(date);
      if (isHoliday || isPaidLeave) {
        location = null;
      }

      return {
        date: formatDisplayDate(date),
        dayName: DAYS[dayOfWeek],
        dayNumber: dayOfWeek,
        location,
        isHoliday,
        holidayName,
        isPaidLeave,
        events: regularEvents,
      };
    });

    // Calculate stats
    const stats = {
      officeDays: days.filter((d) => d.location === 'office').length,
      wfhDays: days.filter((d) => d.location === 'home').length,
      holidays: days.filter((d) => d.isHoliday).length,
      paidLeaves: days.filter((d) => d.isPaidLeave).length,
    };

    // Send test email
    const result = await sendWeeklyEmail(session.user.email, {
      userName: user.name || 'there',
      weekStart,
      weekEnd,
      days,
      stats,
    });

    if (result.success) {
      return NextResponse.json({ message: 'Test email sent successfully' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
