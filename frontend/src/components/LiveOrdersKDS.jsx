import React, { useState, useEffect, useRef } from 'react';
import {
  Utensils,
  Clock,
  SlidersHorizontal,
  Settings,
  AlertTriangle,
  Play,
  Check,
  Bell,
  Maximize,
  Minimize,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ordersApi } from '../services/api';

export default function LiveOrdersKDS() {
  const kdsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('22:26');
  const [mobileColumnFilter, setMobileColumnFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state for the 3 header buttons
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Filter & sort state
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Dine-In' | 'UberEats' | 'Takeaway'
  const [sortBy, setSortBy] = useState('fifo'); // 'fifo' | 'overdue'

  // KDS settings state
  const [kdsSettings, setKdsSettings] = useState({
    soundChime: true,
    slaAlert: true,
    station: 'All Stations'
  });

  // Completed / Served orders history
  const [completedOrders, setCompletedOrders] = useState([
    {
      id: '101',
      table: '#101',
      type: 'Dine-In',
      completedAt: '10:14 PM',
      items: [
        { name: '2x Truffle Tagliatelle', done: true },
        { name: '1x Tiramisu', done: true }
      ]
    },
    {
      id: '105',
      table: '#105',
      type: 'UberEats',
      completedAt: '09:52 PM',
      items: [
        { name: '1x Wagyu Tenderloin', done: true },
        { name: '2x Sparkling Water', done: true }
      ]
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fullscreen event listener (Esc key or exit button)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const elem = kdsRef.current || document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        showToast('Entered Fullscreen Mode');
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
        showToast('Exited Fullscreen Mode');
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err.message);
    }
  };

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

  const toggleItemDone = (orderId, itemIdx) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const newItems = [...order.items];
        newItems[itemIdx] = {
          ...newItems[itemIdx],
          done: !newItems[itemIdx].done
        };
        return { ...order, items: newItems };
      })
    );
  };

  const advanceOrder = async (orderId) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    let nextStatus = '';
    if (currentOrder.status === 'pending') {
      nextStatus = 'preparing';
    } else if (currentOrder.status === 'preparing') {
      nextStatus = 'ready';
    } else if (currentOrder.status === 'ready') {
      nextStatus = 'completed';
      // Record in history drawer
      setCompletedOrders((prev) => [
        {
          ...currentOrder,
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
      showToast(`Order ${currentOrder.table} served & archived to history!`);
    }

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

    try {
      await ordersApi.updateStatus(orderId, nextStatus);
    } catch (err) {
      console.warn('Failed to update order status in PostgreSQL backend:', err.message);
    }
  };

  // Recall order from history back to queue
  const handleRecallOrder = async (order) => {
    setCompletedOrders((prev) => prev.filter((o) => o.id !== order.id));
    setOrders((prev) => [
      ...prev,
      {
        ...order,
        status: 'ready'
      }
    ]);
    showToast(`Order ${order.table} recalled to Ready queue!`);
    try {
      await ordersApi.updateStatus(order.id, 'ready');
    } catch (err) {
      console.warn('Failed to recall order in PostgreSQL backend:', err.message);
    }
  };

  // Filter & sort orders
  const filteredOrders = orders
    .filter((o) => (typeFilter === 'All' ? true : o.type.toLowerCase() === typeFilter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'overdue') {
        return (b.isOverdue ? 1 : 0) - (a.isOverdue ? 1 : 0);
      }
      return 0;
    });

  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending');
  const preparingOrders = filteredOrders.filter((o) => o.status === 'preparing');
  const readyOrders = filteredOrders.filter((o) => o.status === 'ready');

  return (
    <div
      ref={kdsRef}
      className={`space-y-4 sm:space-y-6 ${
        isFullscreen ? 'fixed inset-0 z-50 p-5 sm:p-7 bg-[#EEF1F5] overflow-y-auto' : ''
      }`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KDS Header with exact symmetrical alignment matching Image 2 */}
      <div className="flex items-center justify-between bg-white px-5 sm:px-6 h-18 sm:h-20 rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Left: Brand / Kitchen Name */}
        <div className="flex items-center gap-2.5">
          <Utensils className="w-5 h-5 text-slate-900 shrink-0" />
          <span className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
            Lumiere Kitchen
          </span>
          {typeFilter !== 'All' && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
              {typeFilter}
            </span>
          )}
        </div>

        {/* Center: Big Digital Clock */}
        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-wider tabular-nums leading-none">
          {currentTime}
        </div>

        {/* Right: Actions (Fullscreen + 3 buttons from Image 2) */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-slate-600">
          {/* Fullscreen Button (Requested by user: that actually works and converts to exit fullscreen) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border shadow-xs cursor-pointer ${
              isFullscreen
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F11)'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-amber-400" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Filter tickets button (Image 2 - button 1) */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors border shadow-xs cursor-pointer ${
              typeFilter !== 'All' || sortBy !== 'fifo'
                ? 'bg-blue-50 text-blue-600 border-blue-300'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200/70'
            }`}
            title="Filter Orders & Priority Sort"
            aria-label="Filter tickets"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Ticket history button (Image 2 - button 2) */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200/70 shadow-xs cursor-pointer relative"
            title="Order History & Recall"
            aria-label="History"
          >
            <Clock className="w-4 h-4" />
            {completedOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                {completedOrders.length}
              </span>
            )}
          </button>

          {/* Settings button (Image 2 - button 3) */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200/70 shadow-xs cursor-pointer"
            title="KDS Settings"
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
                            onClick={() => toggleItemDone(order.id, idx)}
                            className={`leading-tight cursor-pointer select-none transition-all hover:opacity-75 flex items-center gap-2 ${
                              item.done ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                            title="Click to toggle item completion"
                          >
                            <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                              item.done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {item.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{item.name}</span>
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
                            onClick={() => toggleItemDone(order.id, idx)}
                            className={`leading-tight cursor-pointer select-none transition-all hover:opacity-75 flex items-center gap-2 ${
                              item.done ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                            title="Click to toggle item completion"
                          >
                            <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                              item.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {item.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{item.name}</span>
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

      {/* 1. FILTER & PRIORITY MODAL (Triggered by Button 1) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-slate-200/90 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Filter KDS Tickets</h3>
                  <p className="text-[11px] text-slate-400">Order channel and priority sorting.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Channel */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Order Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Dine-In', 'UberEats', 'Takeaway'].map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setTypeFilter(channel)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        typeFilter === channel
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Sorting */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Queue Priority Sort</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSortBy('fifo')}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      sortBy === 'fifo'
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Standard FIFO (Arrival Time)</span>
                    {sortBy === 'fifo' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortBy('overdue')}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      sortBy === 'overdue'
                        ? 'bg-rose-50/70 border-rose-300 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>SLA Escalation (Overdue First)</span>
                    {sortBy === 'overdue' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('All');
                  setSortBy('fifo');
                  showToast('Filters reset to default');
                }}
                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFilterModalOpen(false);
                  showToast(`Showing ${typeFilter} tickets (${sortBy === 'overdue' ? 'Overdue First' : 'FIFO'})`);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. HISTORY & RECALL MODAL (Triggered by Button 2) */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200/90 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Completed Tickets History</h3>
                  <p className="text-[11px] text-slate-400">Archived tickets from this active shift.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {completedOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  No completed tickets archived yet this shift.
                </div>
              ) : (
                completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{order.table}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-bold">
                          {order.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Completed at {order.completedAt}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-600 text-[11px] font-medium">
                        {order.items.map((i) => i.name).join(', ')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRecallOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold shadow-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer text-[11px]"
                      title="Recall ticket back to KDS Ready Queue"
                    >
                      <RotateCcw className="w-3 h-3 text-blue-600" />
                      <span>Recall</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {completedOrders.length} ticket(s) recorded in shift buffer.
              </span>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. KDS SETTINGS MODAL (Triggered by Button 3) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-slate-200/90 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">KDS Preferences</h3>
                  <p className="text-[11px] text-slate-400">Display and audio settings.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Sound Chime Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  {kdsSettings.soundChime ? (
                    <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 block">Sound Chime</span>
                    <span className="text-[10px] text-slate-500">Audio bell on incoming order</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setKdsSettings({ ...kdsSettings, soundChime: !kdsSettings.soundChime })
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 relative flex items-center cursor-pointer ${
                    kdsSettings.soundChime ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                      kdsSettings.soundChime ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SLA Alert Threshold Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">SLA 80% Flash</span>
                    <span className="text-[10px] text-slate-500">Pulse red when ticket nears SLA</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setKdsSettings({ ...kdsSettings, slaAlert: !kdsSettings.slaAlert })
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 relative flex items-center cursor-pointer ${
                    kdsSettings.slaAlert ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                      kdsSettings.slaAlert ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Station Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Station Display Mode</label>
                <select
                  value={kdsSettings.station}
                  onChange={(e) => setKdsSettings({ ...kdsSettings, station: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all text-xs"
                >
                  <option value="All Stations">All Stations (Master KDS)</option>
                  <option value="Hot Line / Grill">Hot Line / Grill</option>
                  <option value="Cold Pantry & Desserts">Cold Pantry & Desserts</option>
                  <option value="Beverage / Bar">Beverage / Bar</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  showToast('KDS preferences saved!');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition-all cursor-pointer text-center"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
