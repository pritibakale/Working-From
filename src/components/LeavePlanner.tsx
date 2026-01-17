'use client';

import { useState } from 'react';
import { LeaveBalance, LeaveRequest } from '@/types';

// Sample leave data - in a real app this would come from props or API
const sampleLeaveBalance: LeaveBalance[] = [
  { type: 'Casual Leave', total: 12, used: 4, remaining: 8 },
  { type: 'Sick Leave', total: 10, used: 2, remaining: 8 },
  { type: 'Earned Leave', total: 15, used: 5, remaining: 10 },
  { type: 'Comp Off', total: 3, used: 1, remaining: 2 },
];

const sampleLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    startDate: new Date(2026, 1, 14),
    endDate: new Date(2026, 1, 14),
    type: 'Casual Leave',
    status: 'approved',
    reason: "Valentine's Day",
  },
  {
    id: '2',
    startDate: new Date(2026, 2, 16),
    endDate: new Date(2026, 2, 18),
    type: 'Earned Leave',
    status: 'pending',
    reason: 'Family vacation',
  },
];

function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return start.getTime() === end.getTime() ? startStr : `${startStr} - ${endStr}`;
}

function getStatusColor(status: LeaveRequest['status']): string {
  switch (status) {
    case 'approved':
      return 'text-green-400 bg-green-400';
    case 'pending':
      return 'text-yellow-400 bg-yellow-400';
    case 'rejected':
      return 'text-red-400 bg-red-400';
    default:
      return 'text-gray-400 bg-gray-400';
  }
}

export default function LeavePlanner() {
  const [activeTab, setActiveTab] = useState<'balance' | 'requests'>('balance');

  const totalRemaining = sampleLeaveBalance.reduce((sum, l) => sum + l.remaining, 0);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Leave Planner</h2>
        <span className="text-sm px-3 py-1 rounded-lg bg-[var(--accent-leave)] bg-opacity-20 text-[var(--accent-leave)]">
          {totalRemaining} days available
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            activeTab === 'balance'
              ? 'bg-[var(--accent-leave)] bg-opacity-20 text-[var(--accent-leave)]'
              : 'text-gray-400 hover:bg-[var(--card-border)]'
          }`}
        >
          Balance
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            activeTab === 'requests'
              ? 'bg-[var(--accent-leave)] bg-opacity-20 text-[var(--accent-leave)]'
              : 'text-gray-400 hover:bg-[var(--card-border)]'
          }`}
        >
          Requests
        </button>
      </div>

      {activeTab === 'balance' ? (
        <div className="space-y-4">
          {sampleLeaveBalance.map((leave, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{leave.type}</span>
                <span className="text-gray-400">
                  {leave.remaining} / {leave.total} remaining
                </span>
              </div>
              <div className="h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-leave)] rounded-full transition-all"
                  style={{ width: `${(leave.remaining / leave.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sampleLeaveRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No leave requests</p>
          ) : (
            sampleLeaveRequests.map((request) => (
              <div
                key={request.id}
                className="p-3 rounded-lg bg-[var(--card-border)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{request.type}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded bg-opacity-20 capitalize ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDateRange(request.startDate, request.endDate)}
                </div>
                {request.reason && (
                  <p className="text-sm text-gray-500">{request.reason}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-[var(--card-border)]">
        <button className="w-full py-3 rounded-lg bg-[var(--accent-leave)] bg-opacity-20 text-[var(--accent-leave)] hover:bg-opacity-30 transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Leave
        </button>
      </div>
    </div>
  );
}
