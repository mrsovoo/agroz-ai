import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { MerchantsView } from './views/MerchantsView';
import { BroadcastView } from './views/BroadcastView';
import { ArchiveView } from './views/ArchiveView';
import { SupportView } from './views/SupportView';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'merchants' | 'broadcast' | 'archive' | 'support'>('dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'merchants' && <MerchantsView />}
          {currentView === 'support' && <SupportView />}
          {currentView === 'broadcast' && <BroadcastView />}
          {currentView === 'archive' && <ArchiveView />}
        </main>
      </div>
    </div>
  );
}

export default App;

