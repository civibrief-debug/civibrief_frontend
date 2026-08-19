import SectionPageView from '../../../components/SectionPageView';

export const runtime = 'edge';

export default async function NewsCategoryPage({ params }) {
  const { slug } = await params;
  const categorySlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
  return <SectionPageView slug={categorySlug} />;
}
