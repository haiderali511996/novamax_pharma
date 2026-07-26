'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HELP_SECTIONS } from '@/lib/helpContent';

export default function HelpSectionPage() {
  const { slug } = useParams();
  const index = HELP_SECTIONS.findIndex((s) => s.slug === slug);
  const section = HELP_SECTIONS[index];

  if (!section) {
    return (
      <div>
        <p className="text-sm text-slate-500">Section not found.</p>
        <Link href="/help" className="text-sm text-emerald-700 hover:underline">
          Back to User Guide
        </Link>
      </div>
    );
  }

  const prev = HELP_SECTIONS[index - 1];
  const next = HELP_SECTIONS[index + 1];

  return (
    <div className="max-w-3xl">
      <Link href="/help" className="text-sm text-emerald-700 hover:underline">
        &larr; User Guide
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-bold text-slate-800">{section.label}</h1>
      <p className="mb-6 text-sm text-slate-500">{section.intro}</p>

      <div className="space-y-8">
        {section.topics.map((topic) => (
          <div key={topic.heading}>
            <h2 className="mb-2 text-base font-semibold text-slate-800">{topic.heading}</h2>
            <div className="space-y-1.5">
              {topic.body.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-600">
                  {line}
                </p>
              ))}
            </div>
            {topic.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/docs/screenshots/${topic.image}`}
                alt={topic.heading}
                className="mt-3 w-full rounded-lg border border-slate-200 shadow-sm"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-between border-t border-slate-200 pt-4 text-sm">
        {prev ? (
          <Link href={`/help/${prev.slug}`} className="text-emerald-700 hover:underline">
            &larr; {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/help/${next.slug}`} className="text-emerald-700 hover:underline">
            {next.label} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
