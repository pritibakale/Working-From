'use client';

import { useState } from 'react';
import { Holiday } from '@/types';

// Sample holidays - in a real app this would come from props or API
const sampleHolidays: Holiday[] = [
  { date: new Date(2026, 0, 1), name: "New Year's Day" },
  { date: new Date(2026, 0, 26), name: 'Republic Day' },
  { date: new Date(2026, 2, 17), name: 'Holi' },
  { date: new Date(2026, 3, 14), name: 'Good Friday' },
  { date: new Date(2026, 7, 15), name: 'Independence Day' },
  { date: new Date(2026, 9, 2), name: 'Gandhi Jayanti' },
  { date: new Date(2026, 9, 20), name: 'Dussehra' },
  { date: new Date(2026, 10, 9), name: 'Diwali' },
  { date: new Date(2026, 11, 25), name: 'Christmas' },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function isUpcoming(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function HolidayView() {
  const [showPast, setShowPast] = useState(false);

  const upcomingHolidays = sampleHolidays.filter((h) => isUpcoming(h.date));
  const pastHolidays = sampleHolidays.filter((h) => !isUpcoming(h.date));
  const displayedHolidays = showPast ? sampleHolidays : upcomingHolidays;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Office Holidays</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {upcomingHolidays.length} upcoming
          </span>
          <button
            onClick={() => setShowPast(!showPast)}
            className="text-sm px-3 py-1 rounded-lg bg-[var(--card-border)] hover:bg-[var(--accent-holiday)] hover:bg-opacity-20 transition-colors"
          >
            {showPast ? 'Hide past' : 'Show all'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayedHolidays.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No holidays to display</p>
        ) : (
          displayedHolidays.map((holiday, index) => {
            const upcoming = isUpcoming(holiday.date);
            const daysUntil = getDaysUntil(holiday.date);

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg
                  ${upcoming ? 'day-holiday' : 'bg-[var(--card-border)] opacity-60'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--accent-holiday)] bg-opacity-30">
                    <svg className="w-5 h-5 text-[var(--accent-holiday)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{holiday.name}</p>
                    <p className="text-sm text-gray-400">{formatDate(holiday.date)}</p>
                  </div>
                </div>
                {upcoming && (
                  <span className="text-sm px-2 py-1 rounded bg-[var(--accent-holiday)] bg-opacity-20 text-[var(--accent-holiday)]">
                    {daysUntil === 0
                      ? 'Today'
                      : daysUntil === 1
                      ? 'Tomorrow'
                      : `${daysUntil} days`}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--card-border)]">
        <button className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Import Holiday Schedule
        </button>
      </div>
    </div>
  );
}
