import React, { Suspense } from 'react';
import ArticleDetailView from '../../../components/ArticleDetailView';

export default async function ArticlePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #faf8f5)' }} />}>
      <ArticleDetailView id={id} />
    </Suspense>
  );
}
