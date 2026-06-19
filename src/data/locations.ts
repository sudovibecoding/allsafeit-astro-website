export interface Location {
  city: string;
  address: string[];
  phone: string;
  href: string;
  linkLabel: string;
}

export const LOCATIONS: Location[] = [
  {
    city: 'Pasadena',
    address: ['70 South Lake Ave, Suite 690', 'Pasadena, CA 91101'],
    phone: '8884002748',
    href: '/locations/managed-it-services-pasadena',
    linkLabel: 'Managed IT Pasadena',
  },
  {
    city: 'Los Angeles',
    address: ['1800 Vine St,', 'Los Angeles, CA 90028'],
    phone: '8884002748',
    href: '/locations/managed-it-services-los-angeles',
    linkLabel: 'Managed IT Los Angeles',
  },
  {
    city: 'Orange County',
    address: ['4695 MacArthur Ct 11th floor,', 'Newport Beach, CA 92660'],
    phone: '8884002748',
    href: '/locations/managed-it-services-orange-county',
    linkLabel: 'Managed IT Orange County',
  },
];
