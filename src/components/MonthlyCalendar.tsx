'use client';

import { useState } from 'react';
import { WorkLocation } from '@/types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_OF_WEEK_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Reference Friday that is a WFO day (Jan 23, 2026)
const REFERENCE_OFFICE_FRIDAY = new Date(2026, 0, 23);

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function getWorkLocation(year: number, month: number, day: number): WorkLocation {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();

  // Weekend - no work
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null;
  }

  // Monday (1) and Tuesday (2) - Office
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    return 'office';
  }

  // Wednesday (3) and Thursday (4) - Home
  if (dayOfWeek === 3 || dayOfWeek === 4) {
    return 'home';
  }

  // Friday (5) - Alternate (Jan 23, 2026 is Office)
  if (dayOfWeek === 5) {
    // Calculate weeks difference from reference Friday
    const diffTime = date.getTime() - REFERENCE_OFFICE_FRIDAY.getTime();
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
    // Even weeks from reference = Office, Odd weeks = Home
    return diffWeeks % 2 === 0 ? 'office' : 'home';
  }

  return null;
}

export default function MonthlyCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Calculate monthly totals
  let wfoCount = 0;
  let wfhCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const location = getWorkLocation(currentYear, currentMonth, day);
    if (location === 'office') wfoCount++;
    if (location === 'home') wfhCount++;
  }

  return (
    <div className="card p-3 md:p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="text-base md:text-lg font-semibold">Monthly Schedule</h2>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 hover:bg-[var(--card-border)] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm md:text-base font-medium min-w-[120px] md:min-w-[140px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 hover:bg-[var(--card-border)] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 md:gap-1 shrink-0">
        {DAYS_OF_WEEK.map((day, i) => (
          <div key={day} className="text-center text-xs text-gray-400 py-1">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{DAYS_OF_WEEK_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 md:gap-1 flex-1 min-h-0">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="border border-[var(--card-border)] rounded" />;
          }

          const location = getWorkLocation(currentYear, currentMonth, day);
          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          return (
            <div
              key={day}
              className={`flex flex-col p-1 rounded border border-[var(--card-border)] transition-colors hover:bg-[var(--card-border)]
                ${isToday ? 'ring-2 ring-white ring-opacity-50' : ''}`}
            >
              <span className={`text-[10px] md:text-xs ${location ? '' : 'text-gray-600'}`}>{day}</span>
              {location && (
                <div
                  className={`mt-auto px-1 py-0.5 rounded text-[9px] md:text-[10px] font-medium w-full text-center truncate
                    ${location === 'office' ? 'bg-[var(--accent-office)] text-white' : ''}
                    ${location === 'home' ? 'bg-[var(--accent-home)] text-white' : ''}`}
                >
                  {location === 'office' ? 'Office' : 'WFH'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex gap-2 md:gap-3 mt-2 pt-2 border-t border-[var(--card-border)] shrink-0">
        <div className="flex-1 p-2 rounded-lg bg-[var(--accent-office)]">
          <div className="text-lg md:text-xl font-bold text-white">{wfoCount}</div>
          <div className="text-[10px] md:text-xs text-white/80">Office</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-[var(--accent-home)]">
          <div className="text-lg md:text-xl font-bold text-white">{wfhCount}</div>
          <div className="text-[10px] md:text-xs text-white/80">WFH</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-[var(--card-border)]">
          <div className="text-lg md:text-xl font-bold text-white">{wfoCount + wfhCount}</div>
          <div className="text-[10px] md:text-xs text-white/80">Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 pt-2 border-t border-[var(--card-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium bg-[var(--accent-home)] text-white">WFH</div>
          <span className="text-xs text-gray-400">Work from Home</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium bg-[var(--accent-office)] text-white">Office</div>
          <span className="text-xs text-gray-400">Work from Office</span>
        </div>
      </div>
    </div>
  );
}
