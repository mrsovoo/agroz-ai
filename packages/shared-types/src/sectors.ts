import { Sector } from './enums';

export interface SectorDefinition {
  key: Sector;
  name: string;
  enabled: boolean;
  description: string;
}

export const SECTOR_REGISTRY: Record<Sector, SectorDefinition> = {
  [Sector.PHARMACY]: {
    key: Sector.PHARMACY,
    name: 'Veterinariya va agro dorixona',
    enabled: true, // Only pharmacy is enabled currently
    description: 'Veterinariya va agronomik preparatlar, dorivor vositalar savdosi',
  },
  [Sector.FEED]: {
    key: Sector.FEED,
    name: 'Ozuqa yem',
    enabled: false,
    description: 'Chorvachilik va parrandachilik ozuqa yemlari',
  },
  [Sector.GREENHOUSE]: {
    key: Sector.GREENHOUSE,
    name: 'Issiqxona',
    enabled: false,
    description: 'Issiqxona xo‘jaliklari va jihozlari',
  },
  [Sector.SEEDS]: {
    key: Sector.SEEDS,
    name: 'Urug‘chilik',
    enabled: false,
    description: 'Ekin va ko‘chat urug‘lari',
  },
  [Sector.MACHINERY]: {
    key: Sector.MACHINERY,
    name: 'Agro texnika',
    enabled: false,
    description: 'Qishloq xo‘jaligi texnikalari va ehtiyot qismlari',
  },
  [Sector.SPECIALIST]: {
    key: Sector.SPECIALIST,
    name: 'Agro va vet mutaxassis',
    enabled: false,
    description: 'Veterinarlar, agronomlar va xizmat ko‘rsatuvchi mutaxassislar',
  },
};

export function isSectorEnabled(sector: Sector | string): boolean {
  const found = SECTOR_REGISTRY[sector as Sector];
  return found?.enabled ?? false;
}

