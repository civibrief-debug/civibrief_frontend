import React, { Suspense } from 'react';
import SectionPageView from '../../../components/SectionPageView';

export const runtime = 'edge';

export default async function SectionPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || 'top-stories';
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #faf8f5)' }} />}>
      <SectionPageView slug={slug} />
    </Suspense>
  );
}
