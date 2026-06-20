export interface CrisisResource {
  countryCode: string;
  countryName: string;
  organization: string;
  hotlineNumber: string;
  hotlineDisplay: string;
  websiteUrl?: string;
  availableHours: string;
  language: string;
}

// Cached locally on device so crisis resources work offline
export const CRISIS_RESOURCES: Record<string, CrisisResource> = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    organization: '988 Suicide & Crisis Lifeline',
    hotlineNumber: '988',
    hotlineDisplay: '988',
    websiteUrl: 'https://988lifeline.org',
    availableHours: '24/7',
    language: 'en',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    organization: 'Samaritans',
    hotlineNumber: '116123',
    hotlineDisplay: '116 123',
    websiteUrl: 'https://samaritans.org',
    availableHours: '24/7',
    language: 'en',
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    organization: 'Lifeline',
    hotlineNumber: '131114',
    hotlineDisplay: '13 11 14',
    websiteUrl: 'https://lifeline.org.au',
    availableHours: '24/7',
    language: 'en',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    organization: 'Crisis Services Canada',
    hotlineNumber: '18334564566',
    hotlineDisplay: '1-833-456-4566',
    websiteUrl: 'https://crisisservicescanada.ca',
    availableHours: '24/7',
    language: 'en',
  },
  IE: {
    countryCode: 'IE',
    countryName: 'Ireland',
    organization: 'Samaritans',
    hotlineNumber: '116123',
    hotlineDisplay: '116 123',
    websiteUrl: 'https://samaritans.org/ireland',
    availableHours: '24/7',
    language: 'en',
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    organization: 'Lifeline',
    hotlineNumber: '0800543354',
    hotlineDisplay: '0800 543 354',
    websiteUrl: 'https://lifeline.org.nz',
    availableHours: '24/7',
    language: 'en',
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    organization: 'SADAG',
    hotlineNumber: '0800456789',
    hotlineDisplay: '0800 456 789',
    websiteUrl: 'https://sadag.org',
    availableHours: '24/7',
    language: 'en',
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    organization: 'TelefonSeelsorge',
    hotlineNumber: '08001110111',
    hotlineDisplay: '0800 111 0 111',
    websiteUrl: 'https://telefonseelsorge.de',
    availableHours: '24/7',
    language: 'de',
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    organization: 'Numéro national prévention suicide',
    hotlineNumber: '3114',
    hotlineDisplay: '3114',
    websiteUrl: 'https://3114.fr',
    availableHours: '24/7',
    language: 'fr',
  },
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    organization: 'Teléfono de la Esperanza',
    hotlineNumber: '717003717',
    hotlineDisplay: '717 003 717',
    availableHours: '24/7',
    language: 'es',
  },
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    organization: 'Telefono Amico',
    hotlineNumber: '0223272327',
    hotlineDisplay: '02 2327 2327',
    availableHours: 'Business hours',
    language: 'it',
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    organization: 'CVV — Centro de Valorização da Vida',
    hotlineNumber: '188',
    hotlineDisplay: '188',
    websiteUrl: 'https://cvv.org.br',
    availableHours: '24/7',
    language: 'pt',
  },
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    organization: 'SAPTEL',
    hotlineNumber: '5552598121',
    hotlineDisplay: '55 5259-8121',
    availableHours: '24/7',
    language: 'es',
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    organization: 'iCall',
    hotlineNumber: '9152987821',
    hotlineDisplay: '9152987821',
    websiteUrl: 'https://icallhelpline.org',
    availableHours: 'Mon-Sat 8am-10pm',
    language: 'en',
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    organization: 'Inochi no Denwa',
    hotlineNumber: '0570783556',
    hotlineDisplay: '0570-783-556',
    availableHours: '24/7',
    language: 'ja',
  },
};

export const COUNTRIES = Object.values(CRISIS_RESOURCES).map((r) => ({
  code: r.countryCode,
  name: r.countryName,
  resource: r,
}));

export function getCrisisResource(countryCode: string): CrisisResource {
  return (
    CRISIS_RESOURCES[countryCode] ||
    CRISIS_RESOURCES['US'] // fallback to US 988
  );
}
