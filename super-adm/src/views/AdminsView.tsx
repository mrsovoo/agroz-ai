import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, UserCheck, UserX, X, Loader2 } from 'lucide-react';
import { ResourceTable } from '../components/ResourceTable';
import { AdminUser, AdminRole, ResourceConfig } from '../types';
import { adminApi } from '../lib/api';

const roleColors: Record<AdminRole, string> = {
  super_admin: 'bg-red-950/60 text-red-300 border-red-800/60',
  admin: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
  support: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  analyst: 'bg-purple-950/60 text-purple-300 border-purple-800/60'
};

const roleLabels: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support: 'Qo\'llab-quvvatlash',
  analyst: 'Tahlilchi'
};

export const AdminsView: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleChangeAdmin, setRoleChangeAdmin] = useState<AdminUser | null>(null);

  // New admin form
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'support' as AdminRole
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listAdmins();
      setAdmins(res.admins);
    } catch (err: any) {
      setError(err.message || 'Adminlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await adminApi.createAdmin(formData);
      setIsAddModalOpen(false);
      setFormData({ full_name: '', email: '', password: '', role: 'support' });
      await fetchAdmins();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    const nextStatus = admin.status === 'active' ? 'suspended' : 'active';
    const confirmText = nextStatus === 'suspended'
      ? `Haqiqatan ham ${admin.full_name} (${admin.email}) akkauntini to'xtatmoqchimisiz?`
      : `${admin.full_name} akkauntini faollashtirasizmi?`;
    
    if (!window.confirm(confirmText)) return;

    try {
      await adminApi.toggleAdminStatus(admin.id, nextStatus);
      await fetchAdmins();
    } catch (err: any) {
      alert(err.message || 'Holatni o\'zgartirishda xatolik');
    }
  };

  const handleChangeRole = async (adminId: string, newRole: AdminRole) => {
    try {
      await adminApi.updateAdminRole(adminId, newRole);
      setRoleChangeAdmin(null);
      await fetchAdmins();
    } catch (err: any) {
      alert(err.message || 'Rolni o\'zgartirishda xatolik');
    }
  };

  const tableConfig: ResourceConfig<AdminUser> = {
    name: 'admins',
    title: 'Adminlar va Rollar',
    searchKeys: ['full_name', 'email'],
    columns: [
      {
        key: 'full_name',
        header: 'To\'liq Ism',
        render: (item) => (
          <div>
            <div className="font-semibold text-white">{item.full_name}</div>
            <div className="text-[11px] text-slate-400 font-mono">ID: {item.id}</div>
          </div>
        )
      },
      {
        key: 'email',
        header: 'Email Manzil',
        isSensitive: true // Masked by default in Phase 1
      },
      {
        key: 'role',
        header: 'Roli',
        render: (item) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleColors[item.role]}`}>
            {roleLabels[item.role]}
          </span>
        )
      },
      {
        key: 'status',
        header: 'Holati',
        render: (item) => (
          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium border ${
            item.status === 'active'
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
              : 'bg-red-950/50 text-red-300 border-red-800/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{item.status === 'active' ? 'Faol' : 'To\'xtatilgan'}</span>
          </span>
        )
      },
      {
        key: 'two_factor_enabled',
        header: '2FA',
        render: (item) => (
          <span className="text-xs font-mono text-emerald-400">
            {item.two_factor_enabled ? 'Yoqilgan' : 'O\'chiq'}
          </span>
        )
      },
      {
        key: 'created_at',
        header: 'Yaratilgan Sana',
        render: (item) => (
          <span className="text-xs text-slate-400 font-mono">
            {new Date(item.created_at).toLocaleDateString('uz-UZ', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )
      }
    ],
    filters: [
      {
        key: 'role',
        label: 'Rol',
        type: 'select',
        options: [
          { label: 'Super Admin', value: 'super_admin' },
          { label: 'Admin', value: 'admin' },
          { label: 'Qo\'llab-quvvatlash', value: 'support' },
          { label: 'Tahlilchi', value: 'analyst' }
        ]
      },
      {
        key: 'status',
        label: 'Holat',
        type: 'select',
        options: [
          { label: 'Faol', value: 'active' },
          { label: 'To\'xtatilgan', value: 'suspended' }
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* View Header with Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Adminlar va Rollar Boshqaruvi</h1>
          <p className="text-xs text-slate-400 mt-1">
            RBAC ruxsatlar matritsasi va xodimlar akkauntlarini nazorat qilish
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yangi Admin Qo'shish</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Resource Table */}
      <ResourceTable
        config={tableConfig}
        data={admins}
        loading={loading}
        onRefresh={fetchAdmins}
        actions={(admin) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setRoleChangeAdmin(admin)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
            >
              Rolni o'zgartirish
            </button>
            <button
              onClick={() => handleToggleStatus(admin)}
              className={`p-1 rounded border transition-colors ${
                admin.status === 'active'
                  ? 'bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/50'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
              }`}
              title={admin.status === 'active' ? 'Akkauntni to\'xtatish' : 'Faollashtirish'}
            >
              {admin.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      />

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Yangi Admin Yaratish</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">To'liq Ism</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Ali Valiyev"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Manzil</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="ali@biznesgo.uz"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dastlabki Parol</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Roli (RBAC)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as AdminRole }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="super_admin">Super Admin (To'liq huquq)</option>
                  <option value="admin">Admin (Boshqaruv, katalog, sozlamalar)</option>
                  <option value="support">Qo'llab-quvvatlash (Foydalanuvchilar, support)</option>
                  <option value="analyst">Tahlilchi (Faqat o'qish, hisobotlar)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {formSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Yaratish</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleChangeAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-white text-sm">
              Rolni o'zgartirish: <span className="text-blue-400">{roleChangeAdmin.full_name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Yangi rolni tanlang. Amal audit jurnaliga to'liq yoziladi.
            </p>

            <div className="space-y-2">
              {(['super_admin', 'admin', 'support', 'analyst'] as AdminRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => handleChangeRole(roleChangeAdmin.id, r)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${
                    roleChangeAdmin.role === r
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{roleLabels[r]}</span>
                  {roleChangeAdmin.role === r && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRoleChangeAdmin(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

