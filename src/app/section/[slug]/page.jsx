import React, { Suspense } from 'react';
import SectionPageView from '../../../components/SectionPageView';
import { CATEGORIES } from '../../../data/newsData';

export function generateStaticParams() {
  const baseSlugs = (CATEGORIES || []).map(c => ({ slug: c.slug }));
  const extraSlugs = [
    { slug: 'world' },
    { slug: 'business' },
    { slug: 'economy' },
    { slug: 'ai' },
    { slug: 'climate' },
    { slug: 'entertainment' },
    { slug: 'news' },
    { slug: 'briefings' }
  ];
  return [...baseSlugs, ...extraSlugs];
}

export const dynamicParams = true;

export default async function SectionPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || 'top-stories';
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #faf8f5)' }} />}>
      <SectionPageView slug={slug} />
    </Suspense>
  );
}
