export type BusinessSector =
  | 'pharmacy'
  | 'feed'
  | 'greenhouse'
  | 'seeds'
  | 'machinery'
  | 'specialist';

export interface SectorConfig {
  key: BusinessSector;
  name: string;
  enabled: boolean;
  description: string;
}

export const SECTOR_REGISTRY: Record<BusinessSector, SectorConfig> = {
  pharmacy: {
    key: 'pharmacy',
    name: 'Veterinariya va agro dorixona',
    enabled: true, // Hozir FAQAT shu sektor yoqilgan
    description: 'Veterinariya va agronomik preparatlar, dorivor vositalar savdosi',
  },
  feed: {
    key: 'feed',
    name: 'Ozuqa yem',
    enabled: false,
    description: 'Chorvachilik va parrandachilik ozuqa yemlari',
  },
  greenhouse: {
    key: 'greenhouse',
    name: 'Issiqxona',
    enabled: false,
    description: 'Issiqxona xo‘jaliklari va jihozlari',
  },
  seeds: {
    key: 'seeds',
    name: 'Urug‘chilik',
    enabled: false,
    description: 'Ekin va ko‘chat urug‘lari',
  },
  machinery: {
    key: 'machinery',
    name: 'Agro texnika',
    enabled: false,
    description: 'Qishloq xo‘jaligi texnikalari va ehtiyot qismlari',
  },
  specialist: {
    key: 'specialist',
    name: 'Agro va vet mutaxassis',
    enabled: false,
    description: 'Veterinarlar, agronomlar va xizmat ko‘rsatuvchi mutaxassislar',
  },
};

export function isSectorEnabled(sector: string): boolean {
  return SECTOR_REGISTRY[sector as BusinessSector]?.enabled ?? false;
}

