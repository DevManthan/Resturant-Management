import React from 'react';
import {
  Activity,
  LayoutGrid,
  Utensils,
  User,
  PanelLeftClose,
  PanelLeft,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isExpanded,
  setIsExpanded,
  mobileOpen,
  setMobileOpen
}) {
  const showText = isExpanded || mobileOpen;

  const navItems = [
    {
      id: 'analytics',
      label: 'Executive Analytics',
      shortLabel: 'Analytics',
      icon: Activity,
      tooltip: 'Executive Analytics'
    },
    {
      id: 'live-orders',
      label: 'Live Kitchen Orders',
      shortLabel: 'Live Orders',
      icon: Utensils,
      tooltip: 'Lumiere Kitchen (KDS)'
    },
    {
      id: 'tables',
      label: 'Table Manager',
      shortLabel: 'Tables',
      icon: LayoutGrid,
      tooltip: 'Table Manager'
    }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-50 select-none shadow-[2px_0_12px_rgba(0,0,0,0.03)] ${
          mobileOpen
            ? 'fixed left-0 top-0 bottom-0 w-64 p-4 translate-x-0'
            : 'max-md:-translate-x-full max-md:fixed left-0 top-0 bottom-0'
        } ${isExpanded ? 'md:w-60 md:p-4' : 'md:w-20 md:p-3'}`}
      >
        <div>
          {/* Top Logo / Brand with XD Initials */}
          <div className="pb-4 mb-2 border-b border-slate-100 flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden ${showText ? 'px-1.5' : 'w-full justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs shrink-0 transition-transform duration-200 hover:scale-105">
                XD
              </div>
              {showText && (
                <div className="min-w-0 transition-opacity duration-300 ease-in-out whitespace-nowrap">
                  <div className="font-bold text-slate-900 text-sm tracking-tight truncate leading-tight">
                    Luxe Bistro
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                    Floor Manager
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="mt-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  title={!showText ? item.tooltip : undefined}
                  className={`w-full flex items-center rounded-xl transition-all duration-150 ease-in-out group cursor-pointer focus:outline-none ${
                    showText
                      ? 'px-3.5 h-11 gap-3.5'
                      : 'h-11 w-11 mx-auto justify-center'
                  } ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {showText && (
                    <span className="text-xs tracking-tight truncate whitespace-nowrap leading-none">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile / Settings */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {/* Toggle Collapse/Expand (Desktop only) */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse to icon mode' : 'Expand sidebar'}
            className={`hidden md:flex items-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 cursor-pointer focus:outline-none ${
              isExpanded ? 'w-full px-3 h-10 gap-3 text-xs font-medium' : 'h-10 w-10 mx-auto justify-center'
            }`}
          >
            {isExpanded ? (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap transition-opacity duration-200 leading-none">
                  Collapse View
                </span>
              </>
            ) : (
              <PanelLeft className="w-4 h-4 shrink-0" />
            )}
          </button>

          {/* User Profile Navigation Button */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              if (mobileOpen) setMobileOpen(false);
            }}
            title={!showText ? 'Owner Profile & Settings' : undefined}
            className={`w-full flex items-center rounded-xl transition-all duration-150 text-left group cursor-pointer focus:outline-none ${
              showText ? 'p-2.5 gap-3' : 'justify-center py-2'
            } ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs shrink-0 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900'
                  : 'bg-white border border-slate-200 text-slate-600 group-hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            {showText && (
              <div className="min-w-0 whitespace-nowrap">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-xs font-bold truncate leading-tight ${
                      activeTab === 'profile' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Owner Profile
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span
                    className={`text-[10px] font-semibold leading-none ${
                      activeTab === 'profile' ? 'text-emerald-300' : 'text-emerald-600'
                    }`}
                  >
                    Settings & DB
                  </span>
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
