'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  initialDate: string;
  existingEvent?: CalendarEvent | null;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  existingEvent,
}: EventModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [color, setColor] = useState(PRESET_COLORS[8]); // default blue

  useEffect(() => {
    if (existingEvent) {
      setName(existingEvent.name);
      setStartDate(existingEvent.startDate);
      setEndDate(existingEvent.endDate);
      setColor(existingEvent.color);
    } else {
      setName('');
      setStartDate(initialDate);
      setEndDate(initialDate);
      setColor(PRESET_COLORS[8]);
    }
  }, [existingEvent, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const event: CalendarEvent = {
      id: existingEvent?.id || crypto.randomUUID(),
      name: name.trim(),
      startDate,
      endDate,
      color,
    };

    onSave(event);
    onClose();
  };

  const handleDelete = () => {
    if (existingEvent && onDelete) {
      onDelete(existingEvent.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {existingEvent ? 'Edit Event' : 'Add Event'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--card-border)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter event name"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:border-gray-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                    color === presetColor ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--card-bg)]' : ''
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {existingEvent && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-[var(--card-border)] hover:bg-[var(--card-border)]/80 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm bg-[var(--accent-office)] hover:bg-[var(--accent-office)]/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {existingEvent ? 'Update' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
