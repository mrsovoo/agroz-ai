import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { MerchantsView } from './views/MerchantsView';
import { MapView } from './views/MapView';
import { BroadcastView } from './views/BroadcastView';
import { ArchiveView } from './views/ArchiveView';
import { SupportView } from './views/SupportView';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'merchants' | 'map' | 'broadcast' | 'archive' | 'support'>('dashboard');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-black text-slate-900 font-sans p-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
      {/* Outer Rounded iPad / Desktop App Frame matching the reference screenshot */}
      <div className="w-full max-w-[1600px] h-screen sm:h-[94vh] bg-[#F6F6F3] rounded-none sm:rounded-[36px] shadow-2xl flex overflow-hidden border border-white/10">
        {/* Left Vertical Icon Dock Sidebar */}
        <Sidebar 
          currentView={currentView} 
          onSelectView={setCurrentView}
          onOpenKeyModal={() => setShowKeyModal(true)}
        />

        {/* Right Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <Header 
            onSearch={setSearchQuery} 
            showKeyModal={showKeyModal}
            setShowKeyModal={setShowKeyModal}
          />

          {/* Main Scrollable View Area */}
          <main className="flex-1 overflow-y-auto px-6 sm:px-10 pb-8">
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'merchants' && <MerchantsView />}
            {currentView === 'map' && <MapView />}
            {currentView === 'support' && <SupportView />}
            {currentView === 'broadcast' && <BroadcastView />}
            {currentView === 'archive' && <ArchiveView />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
