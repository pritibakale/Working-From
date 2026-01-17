import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MonthlyCalendar } from '@/components';
import UserHeader from '@/components/UserHeader';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="h-screen flex flex-col p-3 md:p-4 overflow-hidden">
      <header className="shrink-0 mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Working From</h1>
          <p className="text-gray-400 text-sm">Plan your work schedule</p>
        </div>
        <UserHeader />
      </header>

      <main className="flex-1 min-h-0">
        <MonthlyCalendar />
      </main>
    </div>
  );
}
