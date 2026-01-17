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

export interface CalendarEvent {
  id: string;
  name: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  color: string;     // hex color
}
