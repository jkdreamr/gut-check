import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface SearchProps {
  searchParams: Promise<{ did?: string }> | { did?: string };
}

export default async function PresentationPage({ searchParams }: SearchProps) {
  const params = await Promise.resolve(searchParams);
  const did = params?.did ? decodeURIComponent(params.did) : undefined;
  redirect(did ? `/demo?did=${encodeURIComponent(did)}` : '/demo');
}
