import { getCollection } from 'astro:content';
import { SERVICE_COLUMNS } from '../data/navigation';

export type NavLink = { label: string; href: string; emphasis?: boolean };

/** Build service nav from local MDX collections (canonical URLs). */
export async function fetchServiceNavColumns(): Promise<
  Array<{ header: NavLink; items: NavLink[] }>
> {
  const services = await getCollection('services', ({ data }) => data.status === 'published');

  return SERVICE_COLUMNS.map(({ category, header }) => ({
    header: { label: header, href: `/services/${category}`, emphasis: true },
    items: services
      .filter((s) => s.id.startsWith(`${category}/`))
      .sort((a, b) => (a.data.projectNumber ?? 999) - (b.data.projectNumber ?? 999))
      .map((s) => ({
        label: s.data.navHeading || s.data.name,
        href: `/services/${s.id}`,
      })),
  }));
}

/** Build industry nav from local MDX collections (canonical URLs). */
export async function fetchIndustryNavLinks(): Promise<NavLink[]> {
  const industries = await getCollection('industries', ({ data }) => data.status === 'published');

  return industries
    .sort((a, b) => (a.data.projectNumber ?? 999) - (b.data.projectNumber ?? 999))
    .map((s) => ({
      label: s.data.navHeading || s.data.name,
      href: `/industries/${s.id}`,
    }));
}
