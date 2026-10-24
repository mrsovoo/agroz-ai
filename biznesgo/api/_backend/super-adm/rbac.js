// BiznesGO Super Admin RBAC (Role-Based Access Control) Matritsasi

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUPPORT: 'support',
  ANALYST: 'analyst'
};

// Resurslar va ruxsatlar xaritasi
const PERMISSIONS = {
  // 1. Dashboard & Analitika
  'dashboard:view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT, ROLES.ANALYST],
  'dashboard:export': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALYST],

  // 2. Bizneslar (Tenants)
  'tenants:view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT, ROLES.ANALYST],
  'tenants:manage': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'tenants:block': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // 3. Foydalanuvchilar
  'users:view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT, ROLES.ANALYST],
  'users:reset_phone': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT],
  'users:manage': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // 4. Katalog & Narxlar
  'catalog:view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT, ROLES.ANALYST],
  'catalog:manage': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // 5. Pul, Obuna & Tariflar
  'billing:view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALYST],
  'billing:manage_tariffs': [ROLES.SUPER_ADMIN],
  'billing:manage_invoices': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // 6. Aloqa & Broadcast
  'broadcast:send': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'support:manage': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT],

  // 7. Tizim & Feature Flags
  'system:view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'system:manage_flags': [ROLES.SUPER_ADMIN],
  'system:sectors_manage': [ROLES.SUPER_ADMIN],

  // 8. Adminlarni Boshqarish
  'admins:view': [ROLES.SUPER_ADMIN],
  'admins:manage': [ROLES.SUPER_ADMIN],

  // 9. Audit jurnali
  'audit:view': [ROLES.SUPER_ADMIN, ROLES.ANALYST],
  'audit:reveal_sensitive': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT]
};

function hasPermission(role, permission) {
  if (role === ROLES.SUPER_ADMIN) return true;
  const allowedRoles = PERMISSIONS[permission];
  return Array.isArray(allowedRoles) && allowedRoles.includes(role);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  hasPermission
};

