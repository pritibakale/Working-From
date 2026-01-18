import { Resend } from 'resend';

// Initialize Resend only when API key is available
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  location: 'office' | 'home' | null;
  isHoliday: boolean;
  holidayName?: string;
  isPaidLeave: boolean;
  events: { name: string; color: string }[];
}

interface WeeklyEmailData {
  userName: string;
  weekStart: string;
  weekEnd: string;
  days: WeekDay[];
  stats: {
    officeDays: number;
    wfhDays: number;
    holidays: number;
    paidLeaves: number;
  };
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

function generateEmailHtml(data: WeeklyEmailData): string {
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

export async function sendWeeklyEmail(
  to: string,
  data: WeeklyEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Working From <noreply@resend.dev>',
      to: [to],
      subject: `Your Week Ahead: ${data.weekStart} - ${data.weekEnd}`,
      html: generateEmailHtml(data),
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: String(error) };
  }
}

export type { WeeklyEmailData, WeekDay };
