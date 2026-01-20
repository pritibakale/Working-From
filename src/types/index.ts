export type WorkLocation = 'home' | 'office' | 'holiday' | 'leave' | null;

export interface DaySchedule {
  date: Date;
  location: WorkLocation;
  note?: string;
}

export interface Holiday {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  name: string;
}

export interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  startDate: Date;
  endDate: Date;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export type EventType = 'event' | 'paid-leave';

// Day type for work schedule configuration
export type DayType = 'office' | 'home' | 'alternate' | null;

// Work schedule configuration (0=Sun, 1=Mon, ..., 6=Sat)
export interface WorkSchedule {
  days: {
    0: DayType; // Sunday
    1: DayType; // Monday
    2: DayType; // Tuesday
    3: DayType; // Wednesday
    4: DayType; // Thursday
    5: DayType; // Friday
    6: DayType; // Saturday
  };
  alternateReferenceDate: string; // ISO date for reference office day (for alternate days)
}

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  days: {
    0: null,      // Sunday - weekend
    1: 'office',  // Monday
    2: 'office',  // Tuesday
    3: 'home',    // Wednesday
    4: 'home',    // Thursday
    5: 'alternate', // Friday
    6: null,      // Saturday - weekend
  },
  alternateReferenceDate: '2026-01-23', // Reference Friday that is office
};

export interface CalendarEvent {
  id: string;
  name: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  color: string;     // hex color
  type: EventType;   // event type
}
