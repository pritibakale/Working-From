export type WorkLocation = 'home' | 'office' | 'holiday' | 'leave' | null;

export interface DaySchedule {
  date: Date;
  location: WorkLocation;
  note?: string;
}

export interface Holiday {
  date: Date;
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
