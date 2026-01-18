'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkLocation, CalendarEvent, Holiday } from '@/types';
import EventModal from './EventModal';
import HolidayModal from './HolidayModal';

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

function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getEventsForDate(events: CalendarEvent[], dateStr: string): CalendarEvent[] {
  return events.filter((event) => {
    return dateStr >= event.startDate && dateStr <= event.endDate;
  });
}

function getHolidayForDate(holidays: Holiday[], dateStr: string): Holiday | undefined {
  return holidays.find((holiday) => holiday.date === dateStr);
}

function isPaidLeaveDate(events: CalendarEvent[], dateStr: string): boolean {
  return events.some(
    (event) => event.type === 'paid-leave' && dateStr >= event.startDate && dateStr <= event.endDate
  );
}

export default function MonthlyCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, []);

  // Fetch holidays from API
  const fetchHolidays = useCallback(async () => {
    try {
      const response = await fetch('/api/holidays');
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    }
  }, []);

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEvents(), fetchHolidays()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchEvents, fetchHolidays]);

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

  // Create a set of holiday dates for quick lookup
  const holidayDatesSet = new Set(holidays.map((h) => h.date));

  // Calculate monthly totals (excluding holidays and paid leaves)
  let wfoCount = 0;
  let wfhCount = 0;
  let paidLeaveCount = 0;


  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateString(currentYear, currentMonth, day);
    // Skip if this day is a holiday
    if (holidayDatesSet.has(dateStr)) continue;

    const location = getWorkLocation(currentYear, currentMonth, day);
    const hasPaidLeave = isPaidLeaveDate(events, dateStr);

    // Count paid leave days (only on work days)
    if (hasPaidLeave && location) {
      paidLeaveCount++;
      continue; // Don't count as work day
    }

    if (location === 'office') wfoCount++;
    if (location === 'home') wfhCount++;
  }


  const handleDayClick = (day: number) => {
    const dateStr = formatDateString(currentYear, currentMonth, day);
    setSelectedDate(dateStr);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(event.startDate);
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      const isExisting = events.some((e) => e.id === event.id);

      if (isExisting) {
        // Update existing event
        const response = await fetch(`/api/events/${event.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (response.ok) {
          const updatedEvent = await response.json();
          setEvents((prev) =>
            prev.map((e) => (e.id === event.id ? updatedEvent : e))
          );
        }
      } else {
        // Create new event
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (response.ok) {
          const newEvent = await response.json();
          setEvents((prev) => [...prev, newEvent]);
        }
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleAddHoliday = async (holiday: Holiday) => {
    try {
      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holiday),
      });
      if (response.ok) {
        const newHoliday = await response.json();
        setHolidays((prev) => [...prev, newHoliday]);
      }
    } catch (error) {
      console.error('Failed to add holiday:', error);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const response = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setHolidays((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete holiday:', error);
    }
  };

  // Count holidays in current month
  const holidayCount = holidays.filter((h) => {
    const [year, month] = h.date.split('-').map(Number);
    return year === currentYear && month === currentMonth + 1;
  }).length;

  if (isLoading) {
    return (
      <div className="card p-3 md:p-4 h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p className="mt-2 text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="card p-3 md:p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold">Monthly Schedule</h2>
          <button
            onClick={() => setHolidayModalOpen(true)}
            className="px-2 py-1 text-xs bg-[var(--accent-leave)] hover:bg-[var(--accent-leave)]/80 text-white rounded-lg transition-colors"
          >
            Holidays
          </button>
        </div>
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

          const dateStr = formatDateString(currentYear, currentMonth, day);
          const dayEvents = getEventsForDate(events, dateStr);
          const holiday = getHolidayForDate(holidays, dateStr);

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`flex flex-col p-1 rounded border transition-colors hover:bg-[var(--card-border)] cursor-pointer overflow-hidden
                ${holiday ? 'border-[var(--accent-leave)] bg-[var(--accent-leave)]/10' : 'border-[var(--card-border)]'}
                ${isToday ? 'ring-2 ring-white ring-opacity-50' : ''}`}
            >
              <span className={`text-[10px] md:text-xs ${location || holiday ? '' : 'text-gray-600'}`}>{day}</span>
              {holiday && (
                <div
                  className="px-1 py-0.5 rounded text-[9px] md:text-[10px] font-medium w-full text-center truncate bg-[var(--accent-leave)] text-white"
                  title={holiday.name}
                >
                  {holiday.name}
                </div>
              )}
              {!holiday && location && (
                <div
                  className={`px-1 py-0.5 rounded text-[9px] md:text-[10px] font-medium w-full text-center truncate
                    ${location === 'office' ? 'bg-[var(--accent-office)] text-white' : ''}
                    ${location === 'home' ? 'bg-[var(--accent-home)] text-white' : ''}`}
                >
                  {location === 'office' ? 'Office' : 'WFH'}
                </div>
              )}
              <div className="flex-1 min-h-0 flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className="px-1 py-0.5 rounded text-[8px] md:text-[9px] font-medium text-white truncate cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all"
                    style={{ backgroundColor: event.color }}
                    title={`${event.name} (click to edit)`}
                  >
                    {event.name}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[8px] text-gray-400 px-1">+{dayEvents.length - 2} more</div>
                )}
              </div>
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
        <div className="flex-1 p-2 rounded-lg bg-[var(--accent-leave)]">
          <div className="text-lg md:text-xl font-bold text-white">{holidayCount}</div>
          <div className="text-[10px] md:text-xs text-white/80">Holidays</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-[#f97316]">
          <div className="text-lg md:text-xl font-bold text-white">{paidLeaveCount}</div>
          <div className="text-[10px] md:text-xs text-white/80">Paid Leave</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-[var(--card-border)]">
          <div className="text-lg md:text-xl font-bold text-white">{wfoCount + wfhCount}</div>
          <div className="text-[10px] md:text-xs text-white/80">Work Days</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-[var(--card-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium bg-[var(--accent-home)] text-white">WFH</div>
          <span className="text-xs text-gray-400">Work from Home</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium bg-[var(--accent-office)] text-white">Office</div>
          <span className="text-xs text-gray-400">Work from Office</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium bg-[var(--accent-leave)] text-white">Holiday</div>
          <span className="text-xs text-gray-400">Office Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium bg-[#f97316] text-white">Leave</div>
          <span className="text-xs text-gray-400">Paid Leave</span>
        </div>
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedDate}
        existingEvent={selectedEvent}
      />

      <HolidayModal
        isOpen={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        holidays={holidays}
        onAddHoliday={handleAddHoliday}
        onDeleteHoliday={handleDeleteHoliday}
      />
    </div>
  );
}
