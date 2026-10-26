export type ID = string;
export type BusinessId = ID;
export type CountryId = 'UZ' | 'KZ' | 'KG' | 'TJ';
export type UserId = ID;

/**
 * Money in integer minor units (tiyin). 1 so'm = 100 tiyin.
 * Never use floating point for financial calculations!
 */
export type Money = number;

export type ISODateTime = string;
export type ISODate = string;

export type CurrencyCode = 'UZS' | 'USD' | 'RUB' | 'KZT';
export type Locale = 'uz' | 'ru';

export type SectorCode = 'pharmacy' | 'feed' | 'seeds' | 'greenhouse' | 'machinery';
export const SECTOR_CODES: SectorCode[] = ['pharmacy', 'feed', 'seeds', 'greenhouse', 'machinery'];

export interface BusinessScoped {
  id: ID;
  businessId: BusinessId;
}

export interface Timestamps {
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

