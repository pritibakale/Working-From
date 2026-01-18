import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Event from '@/models/Event';
import Holiday from '@/models/Holiday';
import { WeekDay } from '@/lib/email';

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

function getLocationColor(location: 'office' | 'home' | null): string {
  if (location === 'office') return '#3b82f6';
  if (location === 'home') return '#22c55e';
  return '#6b7280';
}

function getLocationText(day: WeekDay): string {
  if (day.isHoliday) return `Holiday: ${day.holidayName}`;
  if (day.isPaidLeave) return 'Paid Leave';
  if (day.location === 'office') return 'Work from Office';
  if (day.location === 'home') return 'Work from Home';
  return 'Weekend';
}

function generateEmailHtml(data: {
  userName: string;
  weekStart: string;
  weekEnd: string;
  days: WeekDay[];
  stats: { officeDays: number; wfhDays: number; holidays: number; paidLeaves: number };
}): string {
  const daysHtml = data.days
    .map((day) => {
      const bgColor = day.isHoliday
        ? '#a855f7'
        : day.isPaidLeave
        ? '#f97316'
        : getLocationColor(day.location);
      const textColor = day.location || day.isHoliday || day.isPaidLeave ? '#ffffff' : '#9ca3af';

      const eventsHtml = day.events.length > 0
        ? day.events
            .map(
              (e) =>
                `<div style="background-color: ${e.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 4px;">${e.name}</div>`
            )
            .join('')
        : '';

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #374151;">
            <div style="font-weight: 600;">${day.dayName}</div>
            <div style="font-size: 12px; color: #9ca3af;">${day.date}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #374151;">
            <div style="background-color: ${bgColor}; color: ${textColor}; padding: 6px 12px; border-radius: 6px; display: inline-block; font-size: 14px;">
              ${getLocationText(day)}
            </div>
            ${eventsHtml}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a1a; color: #ffffff; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #262626; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #3b82f6; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Weekly Schedule</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${data.weekStart} - ${data.weekEnd}</p>
        </div>

        <div style="padding: 24px;">
          <p style="margin: 0 0 20px 0; color: #d1d5db;">Hi ${data.userName}, here's your schedule for the upcoming week:</p>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #374151;">
                <th style="padding: 12px; text-align: left; font-size: 14px;">Day</th>
                <th style="padding: 12px; text-align: left; font-size: 14px;">Schedule</th>
              </tr>
            </thead>
            <tbody>
              ${daysHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding: 16px; background-color: #374151; border-radius: 8px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px;">Week Summary</h3>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <span style="background-color: #3b82f6; padding: 4px 12px; border-radius: 4px; font-size: 14px;">Office: ${data.stats.officeDays}</span>
              <span style="background-color: #22c55e; padding: 4px 12px; border-radius: 4px; font-size: 14px;">WFH: ${data.stats.wfhDays}</span>
              ${data.stats.holidays > 0 ? `<span style="background-color: #a855f7; padding: 4px 12px; border-radius: 4px; font-size: 14px;">Holidays: ${data.stats.holidays}</span>` : ''}
              ${data.stats.paidLeaves > 0 ? `<span style="background-color: #f97316; padding: 4px 12px; border-radius: 4px; font-size: 14px;">Leaves: ${data.stats.paidLeaves}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="padding: 16px 24px; background-color: #1f1f1f; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">Sent from Working From App</p>
          <p style="margin: 8px 0 0 0;">To unsubscribe, update your preferences in the app settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
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

    const html = generateEmailHtml({
      userName: user.name || 'there',
      weekStart,
      weekEnd,
      days,
      stats,
    });

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Preview email error:', error);
    return new NextResponse('Failed to generate preview', { status: 500 });
  }
}
