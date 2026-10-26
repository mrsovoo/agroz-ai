import type { BusinessId, BusinessScoped, CountryId, CurrencyCode, ID, ISODate, ISODateTime, Locale, Money, SectorCode, Timestamps, UserId } from './common';
import type { Role } from './permissions';

export interface BusinessRequisites {
  legalName: string;
  inn: string;
  address: string;
  phone: string;
  bankAccount?: string;
  bankName?: string;
  mfo?: string;
}

export interface BusinessSettings {
  currency: CurrencyCode;
  locale: Locale;
  dateFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD';
  numberGrouping: 'space' | 'comma';
  receipt: { header: string; footer: string; showLogo: boolean; paperWidth: '58mm' | '80mm' };
  paymentMethods: { cash: boolean; card: boolean; debt: boolean; mixed: boolean };
  pricing: { defaultMarkupPercent: number; allowSellerDiscount: boolean; maxDiscountPercent: number; roundToMinor: Money };
  inventory: { allowNegativeStock: boolean; lowStockAlerts: boolean; requireReasonForAdjustments: boolean };
  notifications: { lowStock: boolean; overdueDebts: boolean; sectorAlerts: boolean; dailySummary: boolean };
  wholesale: { enabled: boolean; defaultCreditLimit: Money; defaultPaymentTermDays: number };
  sector: Record<string, string | number | boolean>;
}

export interface Business extends Timestamps {
  id: BusinessId;
  countryId: CountryId;
  sector: SectorCode;
  name: string;
  requisites: BusinessRequisites;
  settings: BusinessSettings;
}

export interface Category extends BusinessScoped {
  name: string;
}

export interface ProductUnit {
  code: string;
  label: string;
  factor: number;
  step: number;
  retailPrice?: Money;
  wholesalePrice?: Money;
  sellable: boolean;
}

export type ProductStatus = 'active' | 'inactive' | 'archived';
export type AttributeValue = string | number | boolean | string[] | null;

export interface Product extends BusinessScoped, Timestamps {
  sector: SectorCode;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: ID;
  manufacturer?: string;
  baseUnit: string;
  primaryUnit: string;
  units: ProductUnit[];
  stock: number;
  minStock: number;
  purchasePrice: Money;
  retailPrice: Money;
  wholesalePrice: Money;
  minWholesaleQty: number;
  status: ProductStatus;
  attributes: Record<string, AttributeValue>;
}

export type CustomerType = 'retail' | 'wholesale';

export interface CustomerPrice {
  productId: ID;
  price: Money;
}

export interface Customer extends BusinessScoped, Timestamps {
  name: string;
  phone: string;
  type: CustomerType;
  creditLimit: Money;
  paymentTermDays: number;
  address?: string;
  note?: string;
  prices: CustomerPrice[];
  archived: boolean;
}

export type DebtStatus = 'open' | 'partial' | 'paid' | 'overdue';

export interface Debt extends BusinessScoped, Timestamps {
  customerId: ID;
  saleId?: ID;
  sourceRef?: string;
  amount: Money;
  paid: Money;
  dueDate: ISODate;
  note?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'debt';

export interface DebtPayment extends BusinessScoped, Timestamps {
  debtId: ID;
  customerId: ID;
  amount: Money;
  method: Exclude<PaymentMethod, 'debt'>;
  receiptNo: string;
  userId: UserId;
  note?: string;
}

export interface SaleLine {
  productId: ID;
  name: string;
  unitCode: string;
  unitLabel: string;
  qty: number;
  baseQty: number;
  unitPrice: Money;
  priceMode: 'retail' | 'wholesale' | 'customer';
  discount: Money;
  total: Money;
  cost: Money;
  allocations?: { lotId: ID; lotLabel: string; baseQty: number; note?: string }[];
  serialNumbers?: string[];
}

export interface SalePayment {
  method: PaymentMethod;
  amount: Money;
}

export interface Sale extends BusinessScoped, Timestamps {
  number: string;
  customerId?: ID;
  employeeId: UserId;
  shiftId?: ID;
  lines: SaleLine[];
  subtotal: Money;
  discount: Money;
  total: Money;
  payments: SalePayment[];
  status: 'completed' | 'refunded';
  clientRequestId: string;
  wholesaleOrderId?: ID;
  note?: string;
}

export type StockMovementType =
  | 'receipt'
  | 'sale'
  | 'issue'
  | 'adjustment'
  | 'count'
  | 'repack'
  | 'waste'
  | 'return';

export interface StockMovement extends BusinessScoped, Timestamps {
  productId: ID;
  type: StockMovementType;
  baseQty: number;
  stockAfter: number;
  reason: string;
  ref?: string;
  userId: UserId;
}

export interface GoodsReceiptLine {
  productId: ID;
  baseQty: number;
  unitCost: Money;
  extra: Record<string, string>;
}

export interface GoodsReceipt extends BusinessScoped, Timestamps {
  number: string;
  supplierId?: ID;
  purchaseOrderId?: ID;
  lines: GoodsReceiptLine[];
  total: Money;
  userId: UserId;
  note?: string;
}

/** 3-bosqichli yuk taqqoslash natijasi */
export interface ThreeWayReconciliationItem {
  productId: ID;
  productName: string;
  orderedQty: number;      // 1-bosqich: Biz buyurtma bergan
  invoicedQty: number;     // 2-bosqich: Hamkor yuborgan invoysdagi
  receivedQty: number;     // 3-bosqich: Omborda amalda qabul qilingan
  status: 'match' | 'missing' | 'surplus' | 'discrepancy';
  difference: number;
}

export interface Supplier extends BusinessScoped, Timestamps {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  inn?: string;
  archived: boolean;
}

export interface SupplierTransaction extends BusinessScoped, Timestamps {
  supplierId: ID;
  type: 'invoice' | 'payment';
  amount: Money;
  ref?: string;
  note?: string;
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'in_transit' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrderLine {
  productId: ID;
  baseQty: number;
  receivedBaseQty: number;
  unitCost: Money;
}

export interface PurchaseOrder extends BusinessScoped, Timestamps {
  number: string;
  supplierId: ID;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  expectedAt?: ISODate;
  note?: string;
}

export interface Employee extends BusinessScoped, Timestamps {
  name: string;
  phone: string;
  role: Role;
  status: 'active' | 'invited' | 'disabled';
}

export interface Shift extends BusinessScoped {
  employeeId: UserId;
  openedAt: ISODateTime;
  closedAt?: ISODateTime;
  openingCash: Money;
  closingCash?: Money;
  note?: string;
}

export interface Expense extends BusinessScoped, Timestamps {
  category: 'rent' | 'salary' | 'utilities' | 'transport' | 'other';
  amount: Money;
  date: ISODate;
  note?: string;
}

export interface AppAlert {
  id: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  title: string;
  description?: string;
  link?: string;
  source: 'core' | SectorCode;
}

