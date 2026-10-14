import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ExecutiveAnalytics from './components/ExecutiveAnalytics';
import LiveOrdersKDS from './components/LiveOrdersKDS';
import TableManager from './components/TableManager';
import { Menu, Activity, Utensils, LayoutGrid } from 'lucide-react';

export default function App() {
  // activeTab: 'analytics' | 'live-orders' | 'tables'
  const [activeTab, setActiveTab] = useState('analytics');
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'analytics':
        return 'Executive Analytics';
      case 'live-orders':
        return 'Lumiere Kitchen';
      case 'tables':
        return 'Table Manager';
      default:
        return 'Bistro BI';
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF1F5] flex flex-col md:flex-row font-sans antialiased text-slate-800">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200/90 px-4 h-14 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs shrink-0">
              XD
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* Small live status pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0 leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live</span>
        </div>
      </header>

      {/* Sidebar with Desktop Icon/Expanded mode and Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Canvas with responsive padding */}
      <main className="flex-1 min-w-0 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'analytics' && <ExecutiveAnalytics />}
          {activeTab === 'live-orders' && <LiveOrdersKDS />}
          {activeTab === 'tables' && <TableManager />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (for phones / small devices) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 px-6 h-16 flex items-center justify-around z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center gap-1 h-full px-3 transition-colors ${
            activeTab === 'analytics'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] leading-none">Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('live-orders')}
          className={`flex flex-col items-center justify-center gap-1 h-full px-3 transition-colors ${
            activeTab === 'live-orders'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] leading-none">Kitchen</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`flex flex-col items-center justify-center gap-1 h-full px-3 transition-colors ${
            activeTab === 'tables'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] leading-none">Tables</span>
        </button>
      </nav>
    </div>
  );
}
