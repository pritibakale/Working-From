import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Event from '@/models/Event';
import Holiday from '@/models/Holiday';
import { sendWeeklyEmail, WeekDay, WeeklyEmailData } from '@/lib/email';

// Reference Friday that is a WFO day (Jan 23, 2026)
const REFERENCE_OFFICE_FRIDAY = new Date(2026, 0, 23);

function getWorkLocation(year: number, month: number, day: number): 'office' | 'home' | null {
  const date = new Date(year, month, day);
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

function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find all users with weekly email enabled
    const users = await User.find({ weeklyEmailEnabled: true });

    if (users.length === 0) {
      return NextResponse.json({ message: 'No users with weekly email enabled' });
    }

    // Calculate next week's dates (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;

    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    nextMonday.setHours(0, 0, 0, 0);

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const user of users) {
      try {
        // Fetch user's events and holidays
        const [events, holidays] = await Promise.all([
          Event.find({ userId: user._id.toString() }),
          Holiday.find({ userId: user._id.toString() }),
        ]);

        const holidayDatesMap = new Map(holidays.map((h) => [h.date, h.name]));

        const weekDays: WeekDay[] = [];
        let officeDays = 0;
        let wfhDays = 0;
        let holidayCount = 0;
        let paidLeaveCount = 0;

        // Generate data for each day of the week
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(nextMonday);
          currentDate.setDate(nextMonday.getDate() + i);

          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const day = currentDate.getDate();
          const dateStr = formatDateString(year, month, day);

          const location = getWorkLocation(year, month, day);
          const isHoliday = holidayDatesMap.has(dateStr);
          const holidayName = holidayDatesMap.get(dateStr);

          // Check for paid leave
          const isPaidLeave = events.some(
            (e) => e.type === 'paid-leave' && dateStr >= e.startDate && dateStr <= e.endDate
          );

          // Get other events for the day
          const dayEvents = events
            .filter(
              (e) => e.type !== 'paid-leave' && dateStr >= e.startDate && dateStr <= e.endDate
            )
            .map((e) => ({ name: e.name, color: e.color }));

          weekDays.push({
            date: formatDisplayDate(currentDate),
            dayName: DAY_NAMES[currentDate.getDay()],
            dayNumber: day,
            location,
            isHoliday,
            holidayName,
            isPaidLeave,
            events: dayEvents,
          });

          // Update stats
          if (isHoliday) {
            holidayCount++;
          } else if (isPaidLeave && location) {
            paidLeaveCount++;
          } else if (location === 'office') {
            officeDays++;
          } else if (location === 'home') {
            wfhDays++;
          }
        }

        const weekEnd = new Date(nextMonday);
        weekEnd.setDate(nextMonday.getDate() + 6);

        const emailData: WeeklyEmailData = {
          userName: user.name,
          weekStart: formatDisplayDate(nextMonday),
          weekEnd: formatDisplayDate(weekEnd),
          days: weekDays,
          stats: {
            officeDays,
            wfhDays,
            holidays: holidayCount,
            paidLeaves: paidLeaveCount,
          },
        };

        const result = await sendWeeklyEmail(user.email, emailData);
        results.push({ email: user.email, ...result });
      } catch (error) {
        results.push({
          email: user.email,
          success: false,
          error: String(error),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Sent ${successCount} emails, ${failCount} failed`,
      results,
    });
  } catch (error) {
    console.error('Weekly email cron error:', error);
    return NextResponse.json({ error: 'Failed to send weekly emails' }, { status: 500 });
  }
}
