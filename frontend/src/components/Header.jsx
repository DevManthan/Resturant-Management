import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Sparkles,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function Header({
  activeTab,
  dateRange,
  setDateRange,
  onTriggerEOD,
  isEODRunning,
  notifications,
  onClearNotification
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const titles = {
    dashboard: 'Executive BI Dashboard',
    heatmaps: 'Hourly Revenue Heatmap & Peak Traffic',
    margins: 'Category Profit Margin & Contribution Matrix',
    inventory: 'Live Menu Stock & 86 Item Toggles',
    reports: 'End-of-Day (EOD) Automated Reports',
    floorplan: 'Real-Time Floorplan & Dining Occupancy',
    reviews: 'Guest Satisfaction & Service Quality Ratings',
    settings: 'Restaurant Configuration & Fiscal Parameters',
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-soft">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Luxe Dine SaaS</span>
          <span>/</span>
          <span className="text-slate-600 capitalize">{activeTab}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
          {titles[activeTab] || 'Owner Portal'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Clock & Operating Badge */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span className="font-mono text-slate-700 font-semibold">{currentTime}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-700 font-medium">Dining Active</span>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-1 text-xs font-medium">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateRange === 'today'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('7d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateRange === '7d'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateRange === '30d'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            30 Days
          </button>
        </div>

        {/* EOD Batch Trigger CTA */}
        <button
          onClick={onTriggerEOD}
          disabled={isEODRunning}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          title="Executes the midnight aggregation batch algorithm manually"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEODRunning ? 'animate-spin' : ''}`} />
          <span>{isEODRunning ? 'Syncing EOD...' : 'Run EOD Batch'}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 text-slate-600 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-card shadow-dropdown border border-slate-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">Operational Alerts</span>
                <span className="text-xs text-brand-600 font-medium">{unreadCount} active</span>
              </div>
              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No active alerts</p>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-subtle border text-xs transition-colors ${
                        item.type === 'warning'
                          ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                          : item.type === 'alert'
                          ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                          : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {item.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          {item.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                          {item.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{item.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-80 leading-relaxed">{item.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
