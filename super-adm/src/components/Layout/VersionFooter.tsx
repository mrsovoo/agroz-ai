import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Activity } from 'lucide-react';

export const VersionFooter: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<{
    version: string;
    phase: string;
  }>({
    version: '1.0.0',
    phase: '1-bosqich: Poydevor (Auth, RBAC, ResourceTable, Audit)'
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    adminApi.getVersion()
      .then(res => {
        setVersionInfo({
          version: res.version,
          phase: res.phase
        });
        setIsOnline(true);
      })
      .catch(() => setIsOnline(false));
  }, []);

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/40 px-8 py-3.5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-mono text-slate-300">v{versionInfo.version}</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 font-medium">{versionInfo.phase}</span>
      </div>

      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
        <Activity className="w-3.5 h-3.5 text-blue-400" />
        <span>Backend API: /v1/admin/* (Barqaror)</span>
      </div>
    </footer>
  );
};

