export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OWNER = 'owner',
  SELLER = 'seller',
}

export enum Sector {
  PHARMACY = 'pharmacy',
  FEED = 'feed',
  GREENHOUSE = 'greenhouse',
  SEEDS = 'seeds',
  MACHINERY = 'machinery',
}

export enum CountryCode {
  UZ = 'UZ',
  KZ = 'KZ',
  KG = 'KG',
  TJ = 'TJ',
  TM = 'TM',
}

export enum Currency {
  UZS = 'UZS',
  KZT = 'KZT',
  KGS = 'KGS',
  TJS = 'TJS',
  USD = 'USD',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  DEBT = 'debt',
  TRANSFER = 'transfer',
  MIXED = 'mixed',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum DebtTransactionType {
  CREDIT = 'credit', // Qarz olish (berilgan qarz)
  PAYMENT = 'payment', // Qarzni to'lash (qaytarilgan pul)
  ADJUSTMENT = 'adjustment',
}

export enum OutboxStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  FAILED = 'failed',
}
