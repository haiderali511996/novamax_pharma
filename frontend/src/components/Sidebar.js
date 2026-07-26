'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';

function activeGroupLabel(pathname) {
  const group = NAV_GROUPS.find((g) => g.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)));
  return group?.label;
}

// Accordion-style mega menu: only one group's items are shown at a time, so
// the long list of modules doesn't turn into an unmanageable wall of links.
// Whichever group contains the page you're on expands automatically; click
// any group header to switch to it (collapsing whichever was open before).
export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openGroup, setOpenGroup] = useState(() => activeGroupLabel(pathname) || NAV_GROUPS[0]?.label);

  useEffect(() => {
    const active = activeGroupLabel(pathname);
    if (active) setOpenGroup(active);
  }, [pathname]);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block print:hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-lg font-bold text-emerald-700">NovaMax Pharma</p>
        <p className="text-xs text-slate-500">Internal ERP System</p>
      </div>
      <nav className="space-y-1 overflow-y-auto px-3 py-4" style={{ maxHeight: 'calc(100vh - 73px)' }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || user?.role === 'admin');
          if (visibleItems.length === 0) return null;
          const isOpen = openGroup === group.label;

          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.label)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <span>{group.label}</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isOpen && (
                <div className="mb-2 mt-0.5 space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-md px-3 py-1.5 text-sm ${
                          active ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
