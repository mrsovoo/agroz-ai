import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  trend?: { value: string; positive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const iconBgs = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 text-xs">
            {trend && (
              <span className={clsx('font-medium', trend.positive ? 'text-emerald-600' : 'text-rose-600')}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
      {Icon && (
        <div className={clsx('rounded-xl p-2.5 flex items-center justify-center', iconBgs[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
};

