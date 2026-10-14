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
          <div className="pb-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden w-full">
              <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-black text-sm tracking-wider shadow-sm shrink-0 mx-auto transition-transform duration-200 hover:scale-105">
                XD
              </div>
              {(isExpanded || mobileOpen) && (
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
                className="md:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="mt-5 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showText = isExpanded || mobileOpen;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  title={!showText ? item.tooltip : undefined}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 ease-in-out group ${
                    showText
                      ? 'px-3.5 h-11 gap-3.5'
                      : 'h-11 w-11 mx-auto justify-center'
                  } ${
                    isActive
                      ? showText
                        ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-black pl-2.5 shadow-sm'
                        : 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? showText
                          ? 'text-black'
                          : 'text-blue-600'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {showText && (
                    <span className="text-xs tracking-tight font-semibold truncate transition-opacity duration-300 ease-in-out whitespace-nowrap leading-none">
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
            className={`hidden md:flex items-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 ${
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

          {/* User Avatar */}
          <div
            className={`flex items-center rounded-xl ${
              isExpanded || mobileOpen
                ? 'p-2.5 gap-3 bg-slate-50 border border-slate-100'
                : 'justify-center py-2'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            {(isExpanded || mobileOpen) && (
              <div className="min-w-0 transition-opacity duration-300 ease-in-out whitespace-nowrap">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  Manager
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-[10px] text-emerald-600 font-semibold leading-none">
                    Online
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
