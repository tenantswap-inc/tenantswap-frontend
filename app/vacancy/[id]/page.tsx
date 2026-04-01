import type { Metadata } from 'next';
import VacancyPublicPage from './VacancyPublicPage';

interface Props {
  params: Promise<{ id: string }>;
}

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tenantswap.africa';

async function fetchVacancy(id: string) {
  try {
    const res = await fetch(`${apiBase}/vacancy/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json() as {
      data: {
        id: string;
        apartmentType: string;
        state: string;
        city: string;
        area: string | null;
        features: string[];
        createdAt: string;
        user: { id: string; fullName: string; profilePhotoUrl: string | null };
      };
    };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vacancy = await fetchVacancy(id);

  if (!vacancy) {
    return {
      title: 'Vacancy Alert | TenantSwap',
      description: 'Find your next home on TenantSwap — Zero Agent Fees.',
    };
  }

  const location = [vacancy.area, vacancy.city, vacancy.state].filter(Boolean).join(', ');
  const title = `${vacancy.apartmentType} Available in ${vacancy.city} — TenantSwap`;
  const description = `A ${vacancy.apartmentType} is available in ${location}. Features: ${vacancy.features.join(', ')}. Find zero-fee apartments on TenantSwap Nigeria.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/vacancy/${vacancy.id}`,
      siteName: 'TenantSwap Nigeria',
      images: [{ url: `${siteUrl}/assets/TenantSwap Logo Combination.png`, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/assets/TenantSwap Logo Combination.png`],
    },
  };
}

export default async function VacancyPage({ params }: Props) {
  const { id } = await params;
  const vacancy = await fetchVacancy(id);
  return <VacancyPublicPage vacancy={vacancy} vacancyId={id} />;
}
