'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    function poll() {
      api
        .get('/notifications', { isRead: 'false' })
        .then(({ unreadCount: count }) => {
          if (active) setUnreadCount(count || 0);
        })
        .catch(() => {});
    }
    poll();
    const interval = setInterval(poll, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 print:hidden">
      <div />
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative rounded-md p-2 hover:bg-slate-50" aria-label="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-500">
            <path
              d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
