import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Utensils,
  BookOpen,
  Hourglass,
  Check,
  Flame,
  Lock,
  Bell,
  Plus,
  Minus,
  CheckCheck,
  ArrowLeft,
  X,
  Users,
  QrCode,
  Share2,
  Sparkles
} from 'lucide-react';

// Custom Plate / Cloche Icon for "Ready for Service"
function ClocheIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v2" />
      <path d="M4 18h16" />
      <path d="M4 18a8 8 0 0 1 16 0" />
      <circle cx="12" cy="4" r="1" />
    </svg>
  );
}

// Custom Banknote with Coin Icon for "Pay" tab (matches user screenshot)
function BanknoteCoinIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="6" width="16" height="12" rx="2" />
      <circle cx="10" cy="12" r="2.5" />
      <path d="M19 9a3 3 0 1 1 0 6" />
    </svg>
  );
}

// Menu items matching user screenshot exactly
const MENU_ITEMS = [
  {
    id: 1,
    title: 'Seared Scallops',
    subtitle: 'Pea purée, crispy pancetta',
    price: 450,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    title: 'Atlantic Salmon',
    subtitle: 'Asparagus, lemon butter',
    price: 850,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    title: 'Lemon Tart',
    subtitle: 'Deconstructed, meringue',
    price: 350,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    title: 'Botanical Spritz',
    subtitle: 'Gin, rosemary, grapefruit',
    price: 400,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 5,
    title: 'Truffle Risotto',
    subtitle: 'Wild forest mushroom, aged parmesan',
    price: 750,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 6,
    title: 'Artisan Sourdough',
    subtitle: 'Cultured butter, Maldon salt flakes',
    price: 250,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 7,
    title: 'Sparkling Water',
    subtitle: 'San Pellegrino chilled 750ml',
    price: 180,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 8,
    title: 'Valrhona Chocolate Fondant',
    subtitle: 'Madagascar vanilla bean gelato',
    price: 520,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80'
  }
];

const CATEGORIES = ['All', 'Starters', 'Mains', 'Drinks', 'Desserts'];

export default function CustomerMenuOrdering({ tableId = '102', onExit, onBackToDashboard }) {
  // Normalize table number display (e.g. '102', '101')
  const tableNum = useMemo(() => {
    if (!tableId) return '102';
    const clean = tableId.toString().replace(/[^0-9]/g, '');
    return clean || '102';
  }, [tableId]);

  // Unique local ID for this browser tab/guest
  const guestId = useRef(Math.random().toString(36).substring(2, 9)).current;

  // Storage keys for this specific table (enables instant cross-person sync)
  const cartKey = `luxe_dine_table_${tableNum}_cart`;
  const ordersKey = `luxe_dine_table_${tableNum}_orders`;
  const billKey = `luxe_dine_table_${tableNum}_split`;

  // Navigation tabs: 'Menu' | 'Status' | 'Pay'
  const [activeTab, setActiveTab] = useState('Menu');

  // Selected category chip
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Shared Cart State for this Table
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default seed for demo: 3 items, ₹1050 (matching user screenshot)
    return { 1: 1, 3: 1, 6: 1 };
  });

  // Split bill toggle in Pay view
  const [splitBill, setSplitBill] = useState(() => {
    try {
      return localStorage.getItem(billKey) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Table partner notifications
  const [partnerNotice, setPartnerNotice] = useState(null);
  const [connectedGuests, setConnectedGuests] = useState(1);
  const [showShareQrModal, setShowShareQrModal] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [orderSentModal, setOrderSentModal] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);

  // Set up real-time sync across any 2 people sharing the same Table QR code
  useEffect(() => {
    const channelName = `luxe_dine_table_${tableNum}_channel`;
    let channel = null;

    try {
      channel = new BroadcastChannel(channelName);

      // Announce arrival to detect other seated guests at this table
      channel.postMessage({ type: 'GUEST_JOINED', guestId });

      channel.onmessage = (event) => {
        const { type, data, sender } = event.data || {};
        if (sender === guestId) return; // ignore self

        if (type === 'GUEST_JOINED') {
          setConnectedGuests((prev) => Math.max(prev, 2));
          // Respond so the newcomer knows we are here
          channel.postMessage({ type: 'GUEST_ACK', guestId });
          showNotice('A table partner joined Table #' + tableNum);
        } else if (type === 'GUEST_ACK') {
          setConnectedGuests((prev) => Math.max(prev, 2));
        } else if (type === 'CART_SYNC') {
          setCart(data.cart);
          if (data.dishTitle) {
            showNotice(`Table partner added ${data.dishTitle}`);
          } else {
            showNotice('Shared cart updated by table partner');
          }
        } else if (type === 'ORDER_PLACED') {
          setCart({});
          setOrderSentModal(true);
          showNotice('Order sent to kitchen by table partner!');
        } else if (type === 'SPLIT_BILL_SYNC') {
          setSplitBill(data.splitBill);
          showNotice(`Table partner ${data.splitBill ? 'enabled' : 'disabled'} Split Bill`);
        } else if (type === 'PAYMENT_DONE') {
          setPaymentSuccessModal(true);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment, falling back to storage listener');
    }

    // Cross-tab fallback via storage event
    const handleStorage = (e) => {
      if (e.key === cartKey && e.newValue) {
        try {
          const newCart = JSON.parse(e.newValue);
          setCart(newCart);
          showNotice('Shared table cart updated');
        } catch (err) {}
      } else if (e.key === billKey) {
        setSplitBill(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [tableNum]);

  const showNotice = (msg) => {
    setPartnerNotice(msg);
    setTimeout(() => {
      setPartnerNotice(null);
    }, 3200);
  };

  // Broadcast helper
  const broadcast = (type, data = {}) => {
    try {
      const channel = new BroadcastChannel(`luxe_dine_table_${tableNum}_channel`);
      channel.postMessage({ type, data, sender: guestId });
      channel.close();
    } catch (e) {}
  };

  // Cart quantity handlers with real-time sync
  const handleAddItem = (id) => {
    const dish = MENU_ITEMS.find((d) => d.id === id);
    const updated = {
      ...cart,
      [id]: (cart[id] || 0) + 1
    };
    setCart(updated);
    try {
      localStorage.setItem(cartKey, JSON.stringify(updated));
    } catch (e) {}
    broadcast('CART_SYNC', { cart: updated, dishTitle: dish?.title });
  };

  const handleRemoveItem = (id) => {
    const updated = { ...cart };
    const current = updated[id] || 0;
    if (current <= 1) {
      delete updated[id];
    } else {
      updated[id] = current - 1;
    }
    setCart(updated);
    try {
      localStorage.setItem(cartKey, JSON.stringify(updated));
    } catch (e) {}
    broadcast('CART_SYNC', { cart: updated });
  };

  // Split bill toggle with real-time sync
  const handleToggleSplitBill = () => {
    const nextVal = !splitBill;
    setSplitBill(nextVal);
    try {
      localStorage.setItem(billKey, nextVal ? 'true' : 'false');
    } catch (e) {}
    broadcast('SPLIT_BILL_SYNC', { splitBill: nextVal });
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    if (selectedCategory === 'All') return MENU_ITEMS;
    return MENU_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  // Cart calculations
  const { totalItems, totalPrice } = useMemo(() => {
    let itemsCount = 0;
    let priceSum = 0;
    Object.entries(cart).forEach(([idStr, qty]) => {
      const id = parseInt(idStr, 10);
      const dish = MENU_ITEMS.find((d) => d.id === id);
      if (dish && qty > 0) {
        itemsCount += qty;
        priceSum += dish.price * qty;
      }
    });
    return { totalItems: itemsCount, totalPrice: priceSum };
  }, [cart]);

  // Send to kitchen action
  const handleSendToKitchen = () => {
    setCart({});
    try {
      localStorage.setItem(cartKey, JSON.stringify({}));
    } catch (e) {}
    setOrderSentModal(true);
    broadcast('ORDER_PLACED', { tableNum });
  };

  // Pay Now action
  const handlePayNow = () => {
    setPaymentSuccessModal(true);
    broadcast('PAYMENT_DONE', { tableNum });
  };

  const tableShareUrl = `${window.location.origin}/?table=${tableNum}`;
  const tableQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=25-45-35&bgcolor=240-244-248&data=${encodeURIComponent(
    tableShareUrl
  )}`;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#102A43] flex flex-col items-center justify-start antialiased font-sans select-none">
      {/* Optional Top Return to Dashboard bar (if manager tested it) */}
      {(onBackToDashboard || onExit) && (
        <div className="w-full bg-[#3D5245] text-slate-200 text-xs py-1.5 px-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-100">
              Scanned QR: Table #{tableNum}
            </span>
          </div>
          <button
            onClick={onExit || onBackToDashboard}
            className="flex items-center gap-1 font-bold text-white hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Manager Dashboard</span>
          </button>
        </div>
      )}

      {/* Real-time Order Sync Toast (when table partner adds items or updates) */}
      {partnerNotice && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#475B4B] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Users className="w-3.5 h-3.5 text-emerald-200" />
          <span>{partnerNotice}</span>
        </div>
      )}

      {/* Main Mobile-First Container (Max 440px width centered, responsive full-width on mobile) */}
      <div className="w-full max-w-[440px] min-h-screen flex flex-col relative pb-28 bg-[#F0F4F8]">
        {/* ========================================================================= */}
        {/* 1. TOP BRAND HEADER: 'Luxe Dine' with 'Table #...' badge */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-30 bg-[#F0F4F8]/95 backdrop-blur-md px-5 pt-4 pb-3 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#475B4B]" />
            <h1 className="text-xl font-bold tracking-tight text-[#3D5245]">
              Luxe Dine
            </h1>
          </div>

          {/* Table Badge & Share QR Pill */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowShareQrModal(true)}
              title="Share this table's QR with someone dining with you"
              className="p-1 rounded-full text-[#475B4B] hover:bg-[#DCE6EF] transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Table Badge */}
            <div className="px-3 py-1 rounded-full bg-[#DCE6EF] text-[#475569] text-xs font-semibold tracking-wide shadow-2xs flex items-center gap-1.5">
              <span>Table #{tableNum}</span>
              {connectedGuests > 1 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="2 guests connected at Table"></span>
              )}
            </div>
          </div>
        </header>

        {/* Live Shared Table Banner if 2 guests connected */}
        {connectedGuests > 1 && (
          <div className="mx-4 mb-2 px-3 py-1 bg-emerald-100/70 border border-emerald-300/60 rounded-xl text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              Shared Table Order Active (2 guests)
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Live Sync</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: MENU SCREEN */}
        {/* ========================================================================= */}
        {activeTab === 'Menu' && (
          <main className="flex-1 flex flex-col px-4 space-y-3.5">
            {/* Horizontal Scrolling Category Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#475B4B] text-white shadow-xs'
                        : 'bg-[#DDE6EE] text-[#486581] hover:bg-[#D4DFE8]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Vertical list of food item cards */}
            <div className="space-y-3 pt-1">
              {filteredDishes.map((dish) => {
                const quantity = cart[dish.id] || 0;

                return (
                  <div
                    key={dish.id}
                    className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(16,42,67,0.04)] border border-slate-100 flex items-center gap-3.5 transition-all"
                  >
                    {/* Dish Image on Left */}
                    <img
                      src={dish.image}
                      alt={dish.title}
                      className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover shrink-0 bg-slate-100"
                      loading="lazy"
                    />

                    {/* Dish Title, Subtitle, Price & Button */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                      <div>
                        <h3 className="font-bold text-[15px] text-[#102A43] leading-snug truncate">
                          {dish.title}
                        </h3>
                        <p className="text-xs text-[#627D98] mt-0.5 truncate font-normal">
                          {dish.subtitle}
                        </p>
                      </div>

                      {/* Price in INR & Interactive '+ Add' / Quantity selector */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-[15px] text-[#102A43]">
                          ₹{dish.price}
                        </span>

                        {quantity === 0 ? (
                          <button
                            onClick={() => handleAddItem(dish.id)}
                            className="bg-[#E2E8F0] hover:bg-[#D8E1EC] active:bg-[#CBD5E1] text-[#334155] font-semibold px-3.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Decrement Button */}
                            <button
                              onClick={() => handleRemoveItem(dish.id)}
                              className="w-6 h-6 rounded-full bg-[#DCE5ED] text-[#475B4B] hover:bg-[#D0DDE7] active:scale-95 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            </button>

                            {/* Quantity */}
                            <span className="text-xs font-bold text-[#102A43] w-3 text-center">
                              {quantity}
                            </span>

                            {/* Increment Button */}
                            <button
                              onClick={() => handleAddItem(dish.id)}
                              className="w-6 h-6 rounded-full bg-[#475B4B] text-white hover:bg-[#3D5041] active:scale-95 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STATUS SCREEN */}
        {/* ========================================================================= */}
        {activeTab === 'Status' && (
          <main className="flex-1 flex flex-col px-4 pt-1 space-y-4">
            {/* Page Title & Subtitle */}
            <div className="pt-1">
              <h2 className="text-2xl font-bold tracking-tight text-[#102A43]">
                Order Status
              </h2>
              <p className="text-xs text-[#627D98] mt-1 font-medium">
                Your culinary journey is underway.
              </p>
            </div>

            {/* Vertical Timeline Card */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(16,42,67,0.04)] border border-slate-100 space-y-4">
              {/* Step 1: Order Received (Completed) */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-9 h-9 rounded-full bg-[#475B4B] text-white flex items-center justify-center shrink-0 shadow-xs z-10">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-sm text-[#102A43] leading-tight">
                    Order Received
                  </h4>
                  <p className="text-xs text-[#627D98] mt-1 font-medium">
                    7:15 PM • Kitchen acknowledged (Table #{tableNum})
                  </p>
                </div>
                {/* Connector line */}
                <div className="absolute left-[17px] top-9 bottom-[-16px] w-[2px] bg-slate-200"></div>
              </div>

              {/* Step 2: Preparing in Kitchen (Active) */}
              <div className="flex items-start gap-3.5 relative pt-2">
                <div className="w-9 h-9 rounded-full bg-[#8A9E8E] text-[#1B3521] flex items-center justify-center shrink-0 z-10 ring-4 ring-[#E4ECE6]">
                  <Flame className="w-4.5 h-4.5 fill-[#1B3521]" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-sm text-[#3D5245] leading-tight">
                    Preparing in Kitchen
                  </h4>
                  <p className="text-xs text-[#627D98] mt-1 leading-relaxed">
                    Our chefs are carefully crafting your dishes.
                  </p>
                </div>
                {/* Connector line */}
                <div className="absolute left-[17px] top-11 bottom-[-16px] w-[2px] bg-slate-200"></div>
              </div>

              {/* Step 3: Ready for Service (Pending) */}
              <div className="flex items-start gap-3.5 relative pt-2">
                <div className="w-9 h-9 rounded-full bg-[#E2EBF2] text-[#627D98] flex items-center justify-center shrink-0 z-10">
                  <ClocheIcon className="w-4.5 h-4.5" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-sm text-[#627D98] leading-tight">
                    Ready for Service
                  </h4>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Awaiting your dedicated server.
                  </p>
                </div>
                {/* Connector line */}
                <div className="absolute left-[17px] top-11 bottom-[-16px] w-[2px] bg-slate-200"></div>
              </div>

              {/* Step 4: Served (Pending) */}
              <div className="flex items-start gap-3.5 pt-2">
                <div className="w-9 h-9 rounded-full bg-[#E2EBF2] text-[#627D98] flex items-center justify-center shrink-0 z-10">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-sm text-[#627D98] leading-tight">
                    Served
                  </h4>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Enjoy your meal at Table #{tableNum}.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PAY SCREEN */}
        {/* ========================================================================= */}
        {activeTab === 'Pay' && (
          <main className="flex-1 flex flex-col px-4 pt-1 space-y-3.5">
            {/* Split Bill Card */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(16,42,67,0.04)] border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#102A43]">Split Bill</h3>
                <p className="text-xs text-[#627D98] mt-0.5">Divide the total evenly among seated guests</p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleToggleSplitBill}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                  splitBill ? 'bg-[#475B4B]' : 'bg-[#DCE6EF]'
                }`}
                aria-label="Toggle split bill"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                    splitBill ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Invoice Summary Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(16,42,67,0.04)] border border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#102A43]">Invoice Summary</h3>
                <span className="text-[11px] font-bold text-[#475B4B] bg-[#DCE6EF] px-2 py-0.5 rounded-full">
                  Table #{tableNum}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#102A43] text-xs">Truffle Risotto</p>
                    <p className="text-[#627D98] text-[11px]">x1</p>
                  </div>
                  <span className="font-medium text-[#102A43]">$38.00</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#102A43] text-xs">Pan-Seared Scallops</p>
                    <p className="text-[#627D98] text-[11px]">x2</p>
                  </div>
                  <span className="font-medium text-[#102A43]">$46.00</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#102A43] text-xs">Artisan Sourdough</p>
                    <p className="text-[#627D98] text-[11px]">x1</p>
                  </div>
                  <span className="font-medium text-[#102A43]">$12.00</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#102A43] text-xs">Sparkling Water</p>
                    <p className="text-[#627D98] text-[11px]">x1</p>
                  </div>
                  <span className="font-medium text-[#102A43]">$8.00</span>
                </div>
              </div>

              {/* Subtotal, Tax, Gratuity */}
              <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-[#627D98]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#102A43] font-medium">$104.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8.5%)</span>
                  <span className="text-[#102A43] font-medium">$8.84</span>
                </div>
                <div className="flex justify-between">
                  <span>Gratuity (18% included)</span>
                  <span className="text-[#102A43] font-medium">$18.72</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-base text-[#102A43]">Total</span>
                <span className="font-bold text-xl text-[#102A43]">
                  {splitBill ? '$65.78' : '$131.56'}
                </span>
              </div>
              {splitBill && (
                <p className="text-[11px] text-right text-emerald-700 font-medium -mt-2">
                  (Split for 2 guests: $65.78 each)
                </p>
              )}
            </div>

            {/* Pay Now Button */}
            <button
              onClick={handlePayNow}
              className="w-full bg-[#475B4B] hover:bg-[#3D5041] active:bg-[#324235] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Pay Now</span>
            </button>
          </main>
        )}

        {/* ========================================================================= */}
        {/* STICKY DARK GREEN FLOATING CART BAR (Shown on Menu tab) */}
        {/* ========================================================================= */}
        {activeTab === 'Menu' && totalItems > 0 && (
          <aside className="fixed bottom-[68px] left-0 right-0 z-30 px-4 pointer-events-none">
            <div className="max-w-[440px] mx-auto pointer-events-auto">
              <div className="bg-[#475B4B] text-white rounded-2xl p-3 sm:p-3.5 shadow-lg flex items-center justify-between">
                {/* Total Items & Price */}
                <div>
                  <div className="text-xs font-bold text-emerald-100/90 leading-tight">
                    {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                  </div>
                  <div className="text-lg font-bold tracking-tight text-white leading-tight mt-0.5">
                    ₹{totalPrice}
                  </div>
                </div>

                {/* Send to Kitchen Button */}
                <button
                  onClick={handleSendToKitchen}
                  className="bg-white text-[#475B4B] font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Send to Kitchen
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ========================================================================= */}
        {/* FLOATING ACTION BELL BUTTON */}
        {/* ========================================================================= */}
        <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-40 z-30 pointer-events-auto">
          <button
            onClick={() => setShowNotificationToast(true)}
            className="w-11 h-11 rounded-full bg-[#475B4B] hover:bg-[#3D5041] active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer"
            aria-label="Server Bell Notifications"
          >
            <Bell className="w-5 h-5 fill-white text-white" />
          </button>
        </div>

        {/* Toast when Bell clicked */}
        {showNotificationToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#102A43] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span>Table #{tableNum} server notified!</span>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="ml-1 text-slate-300 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FIXED BOTTOM NAVIGATION BAR: 'Menu', 'Status', 'Pay' */}
        {/* ========================================================================= */}
        <nav
          aria-label="Main Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 h-16 flex items-center justify-center"
        >
          <div className="w-full max-w-[440px] flex items-center justify-around h-full px-3">
            {/* Menu Tab */}
            <button
              onClick={() => setActiveTab('Menu')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer transition-colors ${
                activeTab === 'Menu'
                  ? 'text-[#475B4B] font-bold'
                  : 'text-[#94A3B8] hover:text-[#64748B]'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[11px] leading-none">Menu</span>
            </button>

            {/* Status Tab */}
            <button
              onClick={() => setActiveTab('Status')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer transition-colors ${
                activeTab === 'Status'
                  ? 'text-[#475B4B] font-bold'
                  : 'text-[#94A3B8] hover:text-[#64748B]'
              }`}
            >
              <Hourglass className="w-5 h-5" />
              <span className="text-[11px] leading-none">Status</span>
            </button>

            {/* Pay Tab */}
            <button
              onClick={() => setActiveTab('Pay')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer transition-colors ${
                activeTab === 'Pay'
                  ? 'text-[#475B4B] font-bold'
                  : 'text-[#94A3B8] hover:text-[#64748B]'
              }`}
            >
              <BanknoteCoinIcon className="w-5 h-5" />
              <span className="text-[11px] leading-none">Pay</span>
            </button>
          </div>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* SHARE TABLE QR CODE MODAL (When guest taps QR icon on top) */}
      {/* ========================================================================= */}
      {showShareQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-[#102A43]">Share Table #{tableNum}</span>
              <button
                onClick={() => setShowShareQrModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#627D98]">
              Let your table partner scan this QR with their phone to view and share this order in real-time!
            </p>

            <div className="w-40 h-40 bg-[#F0F4F8] p-2 rounded-2xl mx-auto flex items-center justify-center border border-slate-200">
              <img
                src={tableQrImg}
                alt={`Table ${tableNum} QR`}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(tableShareUrl);
                showNotice('Table QR Link copied to clipboard!');
                setShowShareQrModal(false);
              }}
              className="w-full bg-[#475B4B] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-[#3D5041] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Table Link</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER SENT MODAL */}
      {/* ========================================================================= */}
      {orderSentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#475B4B] flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h3 className="font-bold text-base text-[#102A43]">Order Sent to Kitchen</h3>
            <p className="text-xs text-[#627D98]">
              Kitchen acknowledged Table #{tableNum}. Check the Status tab for real-time progress.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setOrderSentModal(false);
                  setActiveTab('Status');
                }}
                className="w-full bg-[#475B4B] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#3D5041] transition-colors cursor-pointer"
              >
                View Order Status
              </button>
              <button
                onClick={() => setOrderSentModal(false)}
                className="w-full bg-slate-100 text-[#102A43] font-semibold py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Stay on Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAYMENT SUCCESS MODAL */}
      {/* ========================================================================= */}
      {paymentSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#475B4B] flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h3 className="font-bold text-base text-[#102A43]">Payment Successful</h3>
            <p className="text-xs text-[#627D98]">
              Thank you for dining at Luxe Dine. Your payment has been received for Table #{tableNum}.
            </p>
            <button
              onClick={() => {
                setPaymentSuccessModal(false);
                setActiveTab('Menu');
              }}
              className="w-full bg-[#475B4B] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#3D5041] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
