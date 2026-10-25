import React from 'react';

interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export const PageHeading: React.FC<PageHeadingProps> = ({ eyebrow, title, description }) => (
  <header className="space-y-2">
    <p className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
      {eyebrow}
    </p>
    <h1 className="font-serif text-2xl font-bold tracking-wide text-violet-900 sm:text-3xl">
      {title}
    </h1>
    <p className="max-w-2xl text-xs text-slate-600 sm:text-sm">{description}</p>
  </header>
);
