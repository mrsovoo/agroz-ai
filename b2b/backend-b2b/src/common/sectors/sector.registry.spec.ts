import { isSectorEnabled, SECTOR_REGISTRY } from './sector.registry';

describe('Sector Registry', () => {
  it('should have 6 registered sectors', () => {
    const keys = Object.keys(SECTOR_REGISTRY);
    expect(keys).toEqual([
      'pharmacy',
      'feed',
      'greenhouse',
      'seeds',
      'machinery',
      'specialist',
    ]);
  });

  it('should have ONLY pharmacy enabled currently', () => {
    expect(isSectorEnabled('pharmacy')).toBe(true);
    expect(SECTOR_REGISTRY.pharmacy.enabled).toBe(true);
  });

  it('should keep other sectors disabled until their release phase', () => {
    expect(isSectorEnabled('feed')).toBe(false);
    expect(isSectorEnabled('greenhouse')).toBe(false);
    expect(isSectorEnabled('seeds')).toBe(false);
    expect(isSectorEnabled('machinery')).toBe(false);
    expect(isSectorEnabled('specialist')).toBe(false);
  });

  it('should return false for unknown or invalid sectors', () => {
    expect(isSectorEnabled('unknown_sector')).toBe(false);
    expect(isSectorEnabled('')).toBe(false);
  });
});

