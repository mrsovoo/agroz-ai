import React, { useState, useEffect } from 'react';
import { authStorage, adminApi } from './lib/api';
import { AdminUser } from './types';
import { LoginView } from './views/LoginView';
import { AdminsView } from './views/AdminsView';
import { AuditView } from './views/AuditView';
import { DashboardView } from './views/DashboardView';
import { TenantsView } from './views/TenantsView';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { VersionFooter } from './components/Layout/VersionFooter';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Verify session
    adminApi.getMe()
      .then(res => {
        setCurrentUser(res.user);
        authStorage.setUser(res.user);
      })
      .catch(() => {
        authStorage.clear();
        setCurrentUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Tizim yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onSuccess={(user) => setCurrentUser(user)} />;
  }

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'B2B Katta Data va Boshqaruv Paneli';
      case 'tenants':
        return 'B2B Dorixonalar va Bizneslar (Aylanma & Manba)';
      case 'admins':
        return 'Adminlar va Rollar (RBAC)';
      case 'audit':
        return 'Audit Jurnali va Xavfsizlik';
      default:
        return 'Super Admin';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        user={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <TopBar
          title={getTabTitle()}
          user={currentUser}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView onNavigateToTenants={() => setCurrentTab('tenants')} />
          )}
          {currentTab === 'tenants' && <TenantsView />}
          {currentTab === 'admins' && <AdminsView />}
          {currentTab === 'audit' && <AuditView />}
        </main>

        <VersionFooter />

        {/* Profil va Xavfsizlik Sozlamalari Modali */}
        <ProfileSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={currentUser}
          onUserUpdated={(updated) => setCurrentUser(updated)}
        />
      </div>
    </div>
  );
}

export default App;

