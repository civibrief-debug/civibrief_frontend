import React, { Suspense } from 'react';
import SectionPageView from '../../../components/SectionPageView';
import { CATEGORIES } from '../../../data/newsData';

export function generateStaticParams() {
  return (CATEGORIES || []).map(c => ({ slug: [c.slug] }));
}

export const dynamicParams = true;

export default async function NewsCategoryPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const categorySlug = Array.isArray(slug) ? slug[slug.length - 1] : slug || 'top-stories';
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #faf8f5)' }} />}>
      <SectionPageView slug={categorySlug} />
    </Suspense>
  );
}
