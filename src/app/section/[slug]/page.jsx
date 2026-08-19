import SectionPageView from '../../../components/SectionPageView';

export const runtime = 'edge';

export default async function SectionPage({ params }) {
  const { slug } = await params;
  return <SectionPageView slug={slug} />;
}
