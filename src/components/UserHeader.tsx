'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function UserHeader() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <Image
          src={session.user.image}
          alt={session.user.name || 'User'}
          width={32}
          height={32}
          className="rounded-full"
        />
      )}
      <div className="hidden md:block">
        <p className="text-sm font-medium">{session.user.name}</p>
        <p className="text-xs text-gray-400">{session.user.email}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="px-3 py-1.5 text-xs bg-[var(--card-border)] hover:bg-[var(--card-border)]/80 rounded-lg transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
