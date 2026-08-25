import React, { Suspense } from 'react';
import SectionPageView from '../../../components/SectionPageView';
import { CATEGORIES } from '../../../data/newsData';

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    slug: [cat.slug],
  }));
}

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
