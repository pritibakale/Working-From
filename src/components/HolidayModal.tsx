'use client';

import { useState } from 'react';
import { Holiday } from '@/types';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holidays: Holiday[];
  onAddHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function HolidayModal({
  isOpen,
  onClose,
  holidays,
  onAddHoliday,
  onDeleteHoliday,
}: HolidayModalProps) {
  const today = new Date();
  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const [pickerYear, setPickerYear] = useState(today.getFullYear());

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
  const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (pickerMonth === 0) {
        setPickerMonth(11);
        setPickerYear(pickerYear - 1);
      } else {
        setPickerMonth(pickerMonth - 1);
      }
    } else {
      if (pickerMonth === 11) {
        setPickerMonth(0);
        setPickerYear(pickerYear + 1);
      } else {
        setPickerMonth(pickerMonth + 1);
      }
    }
  };

  const handleDateSelect = (day: number) => {
    const dateStr = formatDateString(pickerYear, pickerMonth, day);
    setSelectedDate(dateStr);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedDate) return;

    onAddHoliday({
      id: crypto.randomUUID(),
      name: name.trim(),
      date: selectedDate,
    });

    setName('');
    setSelectedDate('');
  };

  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  // Check if a date already has a holiday
  const holidayDates = new Set(holidays.map(h => h.date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Manage Holidays</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--card-border)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Calendar Picker */}
          <div className="flex-1 flex flex-col">
            <form onSubmit={handleAdd} className="mb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Holiday name"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:border-gray-500 mb-2"
              />
              {selectedDate && (
                <div className="text-sm text-gray-400 mb-2">
                  Selected: <span className="text-white font-medium">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <button
                type="submit"
                disabled={!name.trim() || !selectedDate}
                className="w-full px-4 py-2 text-sm bg-[var(--accent-leave)] hover:bg-[var(--accent-leave)]/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                Add Holiday
              </button>
            </form>

            {/* Mini Calendar */}
            <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-3 flex-1">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-[var(--card-border)] rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium">
                  {MONTHS[pickerMonth]} {pickerYear}
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-[var(--card-border)] rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_OF_WEEK.map((day, i) => (
                  <div key={i} className="text-center text-[10px] text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateStr = formatDateString(pickerYear, pickerMonth, day);
                  const isSelected = selectedDate === dateStr;
                  const hasHoliday = holidayDates.has(dateStr);
                  const isToday =
                    day === today.getDate() &&
                    pickerMonth === today.getMonth() &&
                    pickerYear === today.getFullYear();

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`aspect-square flex items-center justify-center text-xs rounded transition-colors
                        ${isSelected ? 'bg-[var(--accent-leave)] text-white' : ''}
                        ${hasHoliday && !isSelected ? 'bg-[var(--accent-leave)]/30 text-[var(--accent-leave)]' : ''}
                        ${!isSelected && !hasHoliday ? 'hover:bg-[var(--card-border)]' : ''}
                        ${isToday && !isSelected ? 'ring-1 ring-white/50' : ''}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Holiday list */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-sm font-medium mb-2 text-gray-400">Added Holidays</div>
            <div className="flex-1 overflow-y-auto min-h-0 bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-2">
              {sortedHolidays.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  No holidays added yet
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedHolidays.map((holiday) => {
                    const dateObj = new Date(holiday.date + 'T00:00:00');
                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between p-2 bg-[var(--card-bg)] rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-leave)] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-xs truncate">{holiday.name}</div>
                            <div className="text-[10px] text-gray-400">{formattedDate}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteHoliday(holiday.id)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {holidays.length} holiday{holidays.length !== 1 ? 's' : ''} added
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[var(--card-border)] hover:bg-[var(--card-border)]/80 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
