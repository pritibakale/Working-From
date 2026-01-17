import { MonthlyCalendar } from '@/components';

export default function Home() {
  return (
    <div className="h-screen flex flex-col p-3 md:p-4 overflow-hidden">
      <header className="shrink-0 mb-3">
        <h1 className="text-xl md:text-2xl font-bold">Working From</h1>
        <p className="text-gray-400 text-sm">Plan your work schedule</p>
      </header>

      <main className="flex-1 min-h-0">
        <MonthlyCalendar />
      </main>
    </div>
  );
}
