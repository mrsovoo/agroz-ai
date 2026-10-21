import {
  ContactType,
  CountryCode,
  Currency,
  DebtTransactionType,
  OutboxStatus,
  PaymentMethod,
  SaleStatus,
  Sector,
  UserRole,
} from './enums';

export interface BaseEntity {
  id: string; // UUIDv7
  country_id: CountryCode;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface UserSummary {
  id: string;
  phone: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  role: UserRole;
  is_active: boolean;
  country_id: CountryCode;
}

export interface BusinessSummary {
  id: string;
  name: string;
  sector: Sector;
  country_id: CountryCode;
  currency: Currency;
  language: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  is_active: boolean;
}

export interface BusinessUserSummary {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  sector: Sector;
  category: string;
  active_substance?: string | null;
  manufacturer?: string | null;
  unit: string;
  barcode?: string | null;
  target_species: string[];
  is_verified: boolean;
}

export interface BusinessProductSummary {
  id: string;
  business_id: string;
  catalog_product_id?: string | null;
  custom_name?: string | null;
  price: number; // Integer (tiyin/cents)
  currency: Currency;
  is_active: boolean;
}

export interface ProductBatchSummary {
  id: string;
  business_product_id: string;
  batch_no: string;
  expiry_date: Date;
  quantity: number;
  cost_price: number; // Integer (tiyin/cents)
  currency: Currency;
}

export interface ContactSummary {
  id: string;
  business_id: string;
  name: string;
  phone?: string | null;
  type: ContactType;
  balance: number; // Integer (tiyin)
  currency: Currency;
  country_id: CountryCode;
}

export interface SaleSummary {
  id: string;
  business_id: string;
  seller_id: string;
  contact_id?: string | null;
  total_amount: number; // Integer (tiyin)
  discount_amount: number; // Integer (tiyin)
  paid_amount: number; // Integer (tiyin)
  debt_amount: number; // Integer (tiyin)
  currency: Currency;
  payment_method: PaymentMethod;
  status: SaleStatus;
  created_at: Date;
}

export interface DebtTransactionSummary {
  id: string;
  business_id: string;
  contact_id: string;
  type: DebtTransactionType;
  amount: number; // Integer (tiyin)
  currency: Currency;
  created_at: Date;
}

export interface OutboxEventSummary {
  id: string;
  event_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  created_at: Date;
}
