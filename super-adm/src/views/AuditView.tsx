import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { ResourceTable } from '../components/ResourceTable';
import { AuditLog, ResourceConfig } from '../types';
import { adminApi } from '../lib/api';

const actionBadges: Record<string, { label: string; color: string }> = {
  'auth:login_success': { label: 'Tizimga kirish', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' },
  'auth:login_failed': { label: 'Xato kirish', color: 'bg-red-950/60 text-red-300 border-red-800/60' },
  'admin:create': { label: 'Admin yaratildi', color: 'bg-blue-950/60 text-blue-300 border-blue-800/60' },
  'admin:role_change': { label: 'Rol o\'zgartirildi', color: 'bg-purple-950/60 text-purple-300 border-purple-800/60' },
  'admin:status_change': { label: 'Holat o\'zgartirildi', color: 'bg-amber-950/60 text-amber-300 border-amber-800/60' },
  'sensitive_data:reveal': { label: 'Sezgir ma\'lumot ochildi', color: 'bg-rose-950/80 text-rose-300 border-rose-800/80' }
};

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ limit: 100 });
      setLogs(res.logs);
    } catch (err: any) {
      setError(err.message || 'Audit jurnallarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const tableConfig: ResourceConfig<AuditLog> = {
    name: 'audit_logs',
    title: 'Audit Jurnali',
    searchKeys: ['action', 'admin_email', 'resource', 'reason', 'ip_address'],
    columns: [
      {
        key: 'action',
        header: 'Harakat / Amal',
        render: (item) => {
          const badge = actionBadges[item.action] || {
            label: item.action,
            color: 'bg-slate-800 text-slate-300 border-slate-700'
          };
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badge.color}`}>
              {badge.label}
            </span>
          );
        }
      },
      {
        key: 'admin_email',
        header: 'Mas\'ul Admin',
        render: (item) => (
          <span className="font-mono text-xs text-slate-200">
            {item.admin_email}
          </span>
        )
      },
      {
        key: 'resource',
        header: 'Resurs & ID',
        render: (item) => (
          <div className="text-xs">
            <span className="font-semibold text-slate-300">{item.resource}</span>
            {item.resource_id && (
              <span className="ml-1.5 font-mono text-slate-500">#{item.resource_id}</span>
            )}
          </div>
        )
      },
      {
        key: 'reason',
        header: 'Kiritilgan Sabab',
        render: (item) => (
          <div className="max-w-xs truncate text-xs text-slate-300" title={item.reason || ''}>
            {item.reason ? (
              <span className="italic text-amber-200/90 font-medium">"{item.reason}"</span>
            ) : (
              <span className="text-slate-600">-</span>
            )}
          </div>
        )
      },
      {
        key: 'ip_address',
        header: 'IP Manzil',
        render: (item) => (
          <span className="font-mono text-xs text-slate-400">
            {item.ip_address || '127.0.0.1'}
          </span>
        )
      },
      {
        key: 'created_at',
        header: 'Vaqt (Toshkent)',
        render: (item) => (
          <span className="text-xs text-slate-400 font-mono">
            {new Date(item.created_at).toLocaleString('uz-UZ', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        )
      }
    ],
    filters: [
      {
        key: 'action',
        label: 'Amal turi',
        type: 'select',
        options: [
          { label: 'Kirish muvaffaqiyatli', value: 'auth:login_success' },
          { label: 'Admin yaratish', value: 'admin:create' },
          { label: 'Rol o\'zgartirish', value: 'admin:role_change' },
          { label: 'Holat o\'zgartirish', value: 'admin:status_change' },
          { label: 'Sezgir ma\'lumot ochish', value: 'sensitive_data:reveal' }
        ]
      },
      {
        key: 'resource',
        label: 'Resurs',
        type: 'select',
        options: [
          { label: 'Admins', value: 'admins' },
          { label: 'Auth', value: 'auth' },
          { label: 'Tenants', value: 'tenants' }
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Audit va Xavfsizlik Jurnali</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Har bir admin harakati, ko'rish, o'zgartirish va sezgir ma'lumotlarni ochish sabablari bilan to'liq qayd etiladi
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      <ResourceTable
        config={tableConfig}
        data={logs}
        loading={loading}
        onRefresh={fetchLogs}
      />
    </div>
  );
};

