import React, { Suspense } from 'react';
import SectionPageView from '../../../components/SectionPageView';

export const runtime = 'edge';

export default async function NewsCategoryPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const categorySlug = Array.isArray(slug) ? slug[slug.length - 1] : slug || 'top-stories';
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #090d16)' }} />}>
      <SectionPageView slug={categorySlug} />
    </Suspense>
  );
}

