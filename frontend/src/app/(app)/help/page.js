'use client';

import Link from 'next/link';
import { HELP_SECTIONS } from '@/lib/helpContent';

export default function HelpIndexPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">User Guide</h1>
      <p className="mb-6 text-sm text-slate-500">
        A plain-language walkthrough of every module in NovaMax ERP, with screenshots of the real system. Pick a section below.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HELP_SECTIONS.map((section) => (
          <Link
            key={section.slug}
            href={`/help/${section.slug}`}
            className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
          >
            <p className="font-semibold text-emerald-700">{section.label}</p>
            <p className="mt-1 text-sm text-slate-500">{section.intro}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
