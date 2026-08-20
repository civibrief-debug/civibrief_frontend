import React, { Suspense } from 'react';
import SectionPageView from '../../../components/SectionPageView';

export default async function SectionPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || 'top-stories';
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #090d16)' }} />}>
      <SectionPageView slug={slug} />
    </Suspense>
  );
}


