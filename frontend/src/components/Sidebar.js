'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-lg font-bold text-emerald-700">NovaMax Pharma</p>
        <p className="text-xs text-slate-500">Internal ERP System</p>
      </div>
      <nav className="space-y-5 overflow-y-auto px-3 py-4" style={{ maxHeight: 'calc(100vh - 73px)' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items
                .filter((item) => !item.adminOnly || user?.role === 'admin')
                .map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-md px-3 py-1.5 text-sm ${
                        active
                          ? 'bg-emerald-50 font-medium text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
