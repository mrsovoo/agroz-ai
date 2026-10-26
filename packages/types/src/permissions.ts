export type Role = 'OWNER' | 'SELLER' | 'WAREHOUSE_MANAGER' | 'ACCOUNTANT';
export const ROLES: Role[] = ['OWNER', 'SELLER', 'WAREHOUSE_MANAGER', 'ACCOUNTANT'];

export type Permission =
  | 'dashboard.view'
  | 'finance.view'
  | 'pos.use'
  | 'pos.discount'
  | 'sales.view'
  | 'products.view'
  | 'products.edit'
  | 'products.viewCost'
  | 'inventory.view'
  | 'inventory.receive'
  | 'inventory.adjust'
  | 'inventory.count'
  | 'customers.view'
  | 'customers.edit'
  | 'debts.view'
  | 'debts.collect'
  | 'suppliers.view'
  | 'suppliers.edit'
  | 'purchases.view'
  | 'purchases.edit'
  | 'purchases.receive'
  | 'wholesale.view'
  | 'wholesale.edit'
  | 'employees.view'
  | 'employees.manage'
  | 'shifts.use'
  | 'shifts.viewAll'
  | 'reports.view'
  | 'expenses.view'
  | 'settings.manage'
  | 'sector.view'
  | 'sector.edit';

const ALL: Permission[] = [
  'dashboard.view', 'finance.view', 'pos.use', 'pos.discount', 'sales.view', 'products.view', 'products.edit',
  'products.viewCost', 'inventory.view', 'inventory.receive', 'inventory.adjust', 'inventory.count', 'customers.view',
  'customers.edit', 'debts.view', 'debts.collect', 'suppliers.view', 'suppliers.edit', 'purchases.view',
  'purchases.edit', 'purchases.receive', 'wholesale.view', 'wholesale.edit', 'employees.view', 'employees.manage',
  'shifts.use', 'shifts.viewAll', 'reports.view', 'expenses.view', 'settings.manage', 'sector.view', 'sector.edit',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: ALL,
  SELLER: [
    'pos.use', 'sales.view', 'products.view', 'customers.view', 'customers.edit', 'debts.view', 'debts.collect',
    'shifts.use', 'sector.view', 'wholesale.view',
  ],
  WAREHOUSE_MANAGER: [
    'dashboard.view', 'products.view', 'products.edit', 'products.viewCost', 'inventory.view', 'inventory.receive',
    'inventory.adjust', 'inventory.count', 'suppliers.view', 'purchases.view', 'purchases.edit', 'purchases.receive',
    'sector.view', 'sector.edit', 'wholesale.view',
  ],
  ACCOUNTANT: [
    'dashboard.view', 'finance.view', 'sales.view', 'products.view', 'products.viewCost', 'customers.view',
    'debts.view', 'debts.collect', 'suppliers.view', 'purchases.view', 'reports.view', 'expenses.view',
    'shifts.viewAll', 'sector.view', 'wholesale.view',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<Role, { uz: string; ru: string }> = {
  OWNER: { uz: 'Egasi', ru: 'Владелец' },
  SELLER: { uz: 'Sotuvchi', ru: 'Продавец' },
  WAREHOUSE_MANAGER: { uz: 'Omborchi', ru: 'Кладовщик' },
  ACCOUNTANT: { uz: 'Buxgalter', ru: 'Бухгалтер' },
};

