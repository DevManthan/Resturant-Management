import React, { useState, useEffect, useRef } from 'react';
import {
  Utensils,
  Clock,
  AlertTriangle,
  Play,
  Check,
  Bell,
  Maximize,
  Minimize,
  CheckCircle2
} from 'lucide-react';
import { ordersApi } from '../services/api';

export default function LiveOrdersKDS() {
  const kdsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('22:26');
  const [mobileColumnFilter, setMobileColumnFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fullscreen event listener (handles Esc key or browser exit)
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

  // Live Digital Clock state
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

  // Sync with PostgreSQL KDS queue on mount
  useEffect(() => {
    const loadKdsOrders = async () => {
      try {
        const res = await ordersApi.getKds();
        if (res && res.data && res.data.length > 0) {
          // Map backend orders if present
          const mapped = res.data.map((o) => ({
            id: String(o.order_id),
            table: o.table_id?.startsWith('#') ? o.table_id : `#${o.table_id || '101'}`,
            type: o.booking_id ? 'Dine-In' : 'Online / Takeaway',
            timeElapsed: '05:00',
            targetTime: 'Target: 20m',
            status: o.order_status || 'pending',
            items: (o.items || []).map((i) => ({
              name: `${i.quantity}x ${i.item_name}`,
              done: false,
              note: i.note || ''
            }))
          }));
          setOrders(mapped);
        }
      } catch (err) {
        console.warn('Could not sync KDS from PostgreSQL:', err.message);
      }
    };
    loadKdsOrders();
  }, []);

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
      showToast(`Order ${currentOrder.table} served & completed!`);
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

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div
      ref={kdsRef}
      className={`w-full flex-1 flex flex-col gap-4 sm:gap-5 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 sm:p-6 lg:p-8 bg-[#EEF1F5] overflow-y-auto'
          : 'min-h-[calc(100vh-6rem)]'
      }`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KDS Header - Full Width with ONLY Fullscreen button */}
      <div className="w-full bg-white px-5 sm:px-6 h-18 sm:h-20 rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between shrink-0">
        {/* Left: Brand / Kitchen Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shadow-xs">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
              Lumiere Kitchen
            </h1>
            <p className="text-[11px] text-slate-400 mt-1 font-medium leading-none">
              Live Kitchen Display System (KDS)
            </p>
          </div>
        </div>

        {/* Center: Big Digital Clock */}
        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-wider tabular-nums leading-none">
          {currentTime}
        </div>

        {/* Right: ONLY Fullscreen Button (Requested by user) */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`flex items-center gap-2 px-3.5 sm:px-4 h-10 rounded-xl transition-all border shadow-xs cursor-pointer ${
              isFullscreen
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F11)'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold hidden sm:inline leading-none">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="text-xs font-bold hidden sm:inline leading-none">Fullscreen Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile-Only Column Switcher Pills */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold shrink-0">
        <button
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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

      {/* 3 Kanban Columns - Full Width & Height Stretch */}
      <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
        {/* COLUMN 1: PENDING */}
        {(mobileColumnFilter === 'all' || mobileColumnFilter === 'pending') && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col p-4 sm:p-5 flex-1 min-h-[500px]">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h2 className="text-base font-bold text-slate-900 leading-none">Pending Tickets</h2>
              </div>
              <span className="h-6 px-2.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center justify-center leading-none">
                {pendingOrders.length} {pendingOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {/* Tickets Scroll Area */}
            <div className="flex-1 space-y-3.5 overflow-y-auto pr-0.5">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="h-6 px-2.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center leading-none shadow-2xs">
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

                    {/* Items List with Interactive Completion Checkboxes */}
                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-800">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div
                            onClick={() => toggleItemDone(order.id, idx)}
                            className={`leading-tight cursor-pointer select-none transition-all hover:opacity-75 flex items-center gap-2 ${
                              item.done ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                            title="Click to check item"
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                                item.done
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {item.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{item.name}</span>
                          </div>
                          {item.note && (
                            <div className="ml-5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5 text-[11px] font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.note}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => advanceOrder(order.id)}
                      className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer leading-none"
                    >
                      <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                      <span>Start Preparing</span>
                    </button>
                  </div>
                </div>
              ))}

              {pendingOrders.length === 0 && (
                <div className="py-24 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>No pending tickets in queue</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COLUMN 2: PREPARING */}
        {(mobileColumnFilter === 'all' || mobileColumnFilter === 'preparing') && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col p-4 sm:p-5 flex-1 min-h-[500px]">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h2 className="text-base font-bold text-slate-900 leading-none">In Preparation</h2>
              </div>
              <span className="h-6 px-2.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold inline-flex items-center justify-center leading-none">
                {preparingOrders.length} {preparingOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {/* Tickets Scroll Area */}
            <div className="flex-1 space-y-3.5 overflow-y-auto pr-0.5">
              {preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="h-6 px-2.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center leading-none shadow-2xs">
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

                    {/* Items List with Interactive Completion Checkboxes */}
                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-800">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleItemDone(order.id, idx)}
                          className={`leading-tight cursor-pointer select-none transition-all hover:opacity-75 flex items-center gap-2 ${
                            item.done ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                          title="Click to check item"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                              item.done
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {item.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => advanceOrder(order.id)}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer leading-none"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Mark Ready for Pickup</span>
                    </button>
                  </div>
                </div>
              ))}

              {preparingOrders.length === 0 && (
                <div className="py-24 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>No orders currently in prep</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COLUMN 3: READY */}
        {(mobileColumnFilter === 'all' || mobileColumnFilter === 'ready') && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col p-4 sm:p-5 flex-1 min-h-[500px]">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h2 className="text-base font-bold text-slate-900 leading-none">Ready for Pickup</h2>
              </div>
              <span className="h-6 px-2.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center justify-center leading-none">
                {readyOrders.length} {readyOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {/* Tickets Scroll Area */}
            <div className="flex-1 space-y-3.5 overflow-y-auto pr-0.5">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="h-6 px-2.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center leading-none shadow-2xs">
                        {order.type}
                      </span>
                      <div className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 text-sm font-bold font-mono leading-none ${
                            order.isOverdue ? 'text-rose-500' : 'text-emerald-600'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{order.timeElapsed}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold block mt-1 leading-none ${
                            order.isOverdue ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {order.targetTime}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {order.table}
                    </div>

                    {/* Items List with Interactive Completion Checkboxes */}
                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-800">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleItemDone(order.id, idx)}
                          className={`leading-tight cursor-pointer select-none transition-all hover:opacity-75 flex items-center gap-2 ${
                            item.done ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                          title="Click to check item"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                              item.done
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {item.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => advanceOrder(order.id)}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer leading-none"
                    >
                      <Bell className="w-4 h-4 shrink-0" />
                      <span>Served & Dismiss</span>
                    </button>
                  </div>
                </div>
              ))}

              {readyOrders.length === 0 && (
                <div className="py-24 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>No orders ready for pickup</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
