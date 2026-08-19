import ArticleDetailView from '../../../components/ArticleDetailView';

export const runtime = 'edge';

export default async function ArticlePage({ params }) {
  const { id } = await params;
  return <ArticleDetailView id={id} />;
}
