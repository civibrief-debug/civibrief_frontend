import React, { Suspense } from 'react';
import ArticleDetailView from '../../../components/ArticleDetailView';

export const runtime = 'edge';

export default async function ArticlePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #090d16)' }} />}>
      <ArticleDetailView id={id} />
    </Suspense>
  );
}



