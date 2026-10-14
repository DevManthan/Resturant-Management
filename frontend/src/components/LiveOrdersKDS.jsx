import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Clock,
  SlidersHorizontal,
  Settings,
  AlertTriangle,
  Play,
  Check,
  Bell
} from 'lucide-react';

export default function LiveOrdersKDS() {
  const [currentTime, setCurrentTime] = useState('22:26');
  const [mobileColumnFilter, setMobileColumnFilter] = useState('all');

  // Clock state
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live order tickets
  const [orders, setOrders] = useState([
    {
      id: '102',
      table: '#102',
      type: 'Dine-In',
      timeElapsed: '08:45',
      targetTime: 'Target: 15m',
      status: 'pending',
      items: [
        { name: '1x Truffle Risotto', done: false },
        { name: '2x Scallops', done: false, note: 'No Garlic' }
      ]
    },
    {
      id: '103',
      table: '#103',
      type: 'UberEats',
      timeElapsed: '02:10',
      targetTime: 'Target: 20m',
      status: 'pending',
      items: [{ name: '1x Beef Wellington', done: false }]
    },
    {
      id: '205',
      table: '#205',
      type: 'Dine-In',
      timeElapsed: '12:20',
      targetTime: 'Target: 25m',
      status: 'preparing',
      items: [
        { name: '1x Atlantic Salmon', done: true },
        { name: '1x Lemon Tart', done: false }
      ]
    },
    {
      id: '108',
      table: '#108',
      type: 'Dine-In',
      timeElapsed: '15:10',
      targetTime: 'Overdue',
      isOverdue: true,
      status: 'ready',
      items: [
        { name: '2x Ribeye Steak', done: true },
        { name: '1x Caesar Salad', done: true }
      ]
    }
  ]);

  const advanceOrder = (orderId) => {
    setOrders((prev) =>
      prev
        .map((order) => {
          if (order.id !== orderId) return order;
          if (order.status === 'pending') {
            return {
              ...order,
              status: 'preparing',
              timeElapsed: '00:01',
              targetTime: 'Target: 25m'
            };
          }
          if (order.status === 'preparing') {
            return {
              ...order,
              status: 'ready',
              items: order.items.map((i) => ({ ...i, done: true }))
            };
          }
          if (order.status === 'ready') {
            return null; // Completed / Served
          }
          return order;
        })
        .filter(Boolean)
    );
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KDS Header with exact symmetrical alignment matching Image 2 */}
      <div className="flex items-center justify-between bg-white px-5 sm:px-6 h-18 sm:h-20 rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Left: Brand / Kitchen Name */}
        <div className="flex items-center gap-2.5">
          <Utensils className="w-5 h-5 text-slate-900 shrink-0" />
          <span className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
            Lumiere Kitchen
          </span>
        </div>

        {/* Center: Big Digital Clock */}
        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-wider tabular-nums leading-none">
          {currentTime}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-slate-600">
          <button
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/70 shadow-xs"
            aria-label="Filter tickets"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/70 shadow-xs"
            aria-label="History"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/70 shadow-xs"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile-Only Column Switcher Pills */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setMobileColumnFilter('all')}
          className={`h-8 px-3 rounded-xl border flex items-center justify-center leading-none transition-all ${
            mobileColumnFilter === 'all'
              ? 'bg-black text-white border-black shadow-xs'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setMobileColumnFilter('pending')}
          className={`h-8 px-3 rounded-xl border flex items-center justify-center leading-none transition-all ${
            mobileColumnFilter === 'pending'
              ? 'bg-[#E68A00] text-white border-[#E68A00] shadow-xs'
              : 'bg-white text-amber-700 border-amber-200'
          }`}
        >
          Pending ({pendingOrders.length})
        </button>
        <button
          onClick={() => setMobileColumnFilter('preparing')}
          className={`h-8 px-3 rounded-xl border flex items-center justify-center leading-none transition-all ${
            mobileColumnFilter === 'preparing'
              ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-xs'
              : 'bg-white text-blue-700 border-blue-200'
          }`}
        >
          Preparing ({preparingOrders.length})
        </button>
        <button
          onClick={() => setMobileColumnFilter('ready')}
          className={`h-8 px-3 rounded-xl border flex items-center justify-center leading-none transition-all ${
            mobileColumnFilter === 'ready'
              ? 'bg-[#10B981] text-white border-[#10B981] shadow-xs'
              : 'bg-white text-emerald-700 border-emerald-200'
          }`}
        >
          Ready ({readyOrders.length})
        </button>
      </div>

      {/* 3 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* COLUMN 1: PENDING */}
        {(mobileColumnFilter === 'all' || mobileColumnFilter === 'pending') && (
          <div className="bg-[#FFF8E6] rounded-2xl p-4 sm:p-5 border border-amber-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] min-h-[480px] sm:min-h-[620px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-amber-200/60 mb-4">
                <h2 className="text-base font-bold text-[#92400E] leading-none">Pending</h2>
                <span className="h-6 px-3 rounded-full bg-[#FDE68A] text-[#92400E] border border-amber-300 text-xs font-bold shadow-xs inline-flex items-center justify-center leading-none">
                  {pendingOrders.length} {pendingOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>

              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="h-6 px-2.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center leading-none">
                          {order.type}
                        </span>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-sm font-bold text-amber-600 font-mono leading-none">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{order.timeElapsed}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-none">
                            {order.targetTime}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                        {order.table}
                      </div>

                      {/* Items List */}
                      <div className="mt-4 space-y-2 text-xs font-semibold text-slate-800">
                        {order.items.map((item, idx) => (
                          <div key={idx}>
                            <div className="leading-tight">{item.name}</div>
                            {item.note && (
                              <div className="mt-2 p-2.5 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] flex items-center gap-2 text-xs font-bold leading-none">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{item.note}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      <button
                        onClick={() => advanceOrder(order.id)}
                        className="w-full h-11 bg-[#E68A00] hover:bg-[#D97706] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] leading-none"
                      >
                        <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                        <span>Start Preparing</span>
                      </button>
                    </div>
                  </div>
                ))}

                {pendingOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-amber-800/60 font-semibold">
                    No pending tickets in queue
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COLUMN 2: PREPARING */}
        {(mobileColumnFilter === 'all' || mobileColumnFilter === 'preparing') && (
          <div className="bg-[#EEF5FF] rounded-2xl p-4 sm:p-5 border border-blue-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] min-h-[480px] sm:min-h-[620px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-blue-200/60 mb-4">
                <h2 className="text-base font-bold text-[#1E40AF] leading-none">Preparing</h2>
                <span className="h-6 px-3 rounded-full bg-[#DBEAFE] text-[#1E40AF] border border-blue-300 text-xs font-bold shadow-xs inline-flex items-center justify-center leading-none">
                  {preparingOrders.length} {preparingOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>

              <div className="space-y-4">
                {preparingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-blue-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="h-6 px-2.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center leading-none">
                          {order.type}
                        </span>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-sm font-bold text-blue-600 font-mono leading-none">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{order.timeElapsed}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-none">
                            {order.targetTime}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                        {order.table}
                      </div>

                      {/* Items List */}
                      <div className="mt-4 space-y-2 text-xs font-semibold text-slate-800">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`leading-tight ${
                              item.done ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      <button
                        onClick={() => advanceOrder(order.id)}
                        className="w-full h-11 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] leading-none"
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Mark Ready</span>
                      </button>
                    </div>
                  </div>
                ))}

                {preparingOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-blue-800/60 font-semibold">
                    No orders currently in prep
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COLUMN 3: READY */}
        {(mobileColumnFilter === 'all' || mobileColumnFilter === 'ready') && (
          <div className="bg-[#EAFBF3] rounded-2xl p-4 sm:p-5 border border-emerald-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] min-h-[480px] sm:min-h-[620px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-emerald-200/60 mb-4">
                <h2 className="text-base font-bold text-[#065F46] leading-none">Ready</h2>
                <span className="h-6 px-3 rounded-full bg-[#D1FAE5] text-[#065F46] border border-emerald-300 text-xs font-bold shadow-xs inline-flex items-center justify-center leading-none">
                  {readyOrders.length} {readyOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>

              <div className="space-y-4">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="h-6 px-2.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center leading-none">
                          {order.type}
                        </span>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-sm font-bold text-rose-500 font-mono leading-none">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{order.timeElapsed}</span>
                          </div>
                          <span className="text-[10px] text-rose-600 font-bold block mt-1 leading-none">
                            {order.targetTime}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                        {order.table}
                      </div>

                      {/* Items List */}
                      <div className="mt-4 space-y-2 text-xs font-semibold text-slate-800">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`leading-tight ${
                              item.done ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      <button
                        onClick={() => advanceOrder(order.id)}
                        className="w-full h-11 bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] leading-none"
                      >
                        <Bell className="w-4 h-4 shrink-0" />
                        <span>Served</span>
                      </button>
                    </div>
                  </div>
                ))}

                {readyOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-emerald-800/60 font-semibold">
                    No orders ready for pickup
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
