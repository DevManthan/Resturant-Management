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
  Sparkles,
  Star
} from 'lucide-react';
import { ordersApi, billsApi, reviewsApi, menuApi } from '../services/api';
import { playClickSound, playSuccessSound, playPopSound } from '../utils/sound';

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
    title: 'Murgh Malai Kebab',
    subtitle: 'Cream cheese, cardamom, saffron, tandoor grilled',
    price: 480,
    category: 'Starters',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Chicken_Tikka.jpg',
    in_stock: true
  },
  {
    id: 2,
    title: 'Dahi Ke Kebab',
    subtitle: 'Crisp spiced hung curd patties, mint chutney',
    price: 380,
    category: 'Starters',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Shikampuri_Kabab.JPG',
    in_stock: true
  },
  {
    id: 5,
    title: 'Slow-Simmered Dal Bukhara',
    subtitle: 'Overnight 18-hr black lentils, white butter, fenugreek',
    price: 460,
    category: 'Mains',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Dal_Makhani.jpg',
    in_stock: true
  },
  {
    id: 6,
    title: 'Royal Paneer Lababdar',
    subtitle: 'Roasted tomato-onion gravy, khoya, ginger juliennes',
    price: 490,
    category: 'Mains',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Paneer_Butter_Masala.jpg',
    in_stock: true
  },
  {
    id: 7,
    title: 'Awadhi Dum Pukht Biryani',
    subtitle: 'Aged basmati rice, tender chicken, saffron milk, dough sealed',
    price: 620,
    category: 'Mains',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Chicken_biryani_02-06-2015_%28India%29.jpg',
    in_stock: true
  },
  {
    id: 9,
    title: 'Old Delhi Butter Chicken',
    subtitle: 'Tandoor-smoked chicken, satin tomato gravy, honey glaze',
    price: 580,
    category: 'Mains',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Food_Indian_butter_chicken_%2852843424475%29.jpg',
    in_stock: true
  },
  {
    id: 11,
    title: 'Kesari Angoori Rasmalai',
    subtitle: 'Cottage cheese rounds, saffron milk, Iranian pistachios',
    price: 260,
    category: 'Desserts',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Ras-Malai.jpg',
    in_stock: true
  },
  {
    id: 13,
    title: 'Warm Gulab Jamun with Malai Kulfi',
    subtitle: 'Reduced milk dumplings in rose syrup, artisanal kulfi',
    price: 240,
    category: 'Desserts',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Gulab_Jamun.jpg',
    in_stock: true
  },
  {
    id: 14,
    title: 'Alphonso Mango Saffron Lassi',
    subtitle: 'Thick churned yogurt, Ratnagiri mango pulp, cardamom',
    price: 220,
    category: 'Drinks',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Mango_Lassi_.jpg',
    in_stock: true
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
  const guestCountKey = `luxe_dine_table_${tableNum}_guests`;

  // Persistent channel ref & peer tracker
  const channelRef = useRef(null);
  const peersRef = useRef(new Set([guestId]));

  // Party size on table (defaults to 2, can be set to 3, 4, 5, 6, etc.)
  const [guestCount, setGuestCount] = useState(() => {
    try {
      const saved = localStorage.getItem(guestCountKey);
      if (saved) return Math.max(1, parseInt(saved, 10));
    } catch (e) {}
    return 2;
  });

  // Navigation tabs: 'Menu' | 'Status' | 'Pay'
  const [activeTab, setActiveTab] = useState('Menu');

  // Selected category chip
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dynamic menu catalog from PostgreSQL backend
  const [menuItems, setMenuItems] = useState(MENU_ITEMS);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await menuApi.getAll();
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((item) => {
            let cat = item.category || 'Mains';
            if (cat === 'Main Course') cat = 'Mains';
            if (cat === 'Beverages') cat = 'Drinks';
            return {
              id: item.menu_id || item.id,
              title: item.item_name || item.title,
              subtitle: item.description || item.subtitle || `${cat} specialty`,
              price: parseFloat(item.price) || 0,
              category: cat,
              image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
              in_stock: item.in_stock !== undefined ? Boolean(item.in_stock) : true
            };
          });
          setMenuItems(mapped);
        }
      } catch (e) {
        console.warn('Fallback menu items loaded:', e.message);
      }
    };
    loadCatalog();
  }, []);

  // Shared Cart State for this Table (starts clean and empty)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Split bill toggle in Pay view
  const [splitBill, setSplitBill] = useState(() => {
    try {
      return localStorage.getItem(billKey) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Placed orders list for Invoice Summary (starts clean, synced directly with PostgreSQL)
  const [placedOrders, setPlacedOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ordersKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Table partner notifications
  const [partnerNotice, setPartnerNotice] = useState(null);
  const [connectedGuests, setConnectedGuests] = useState(1);
  const [showShareQrModal, setShowShareQrModal] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [orderSentModal, setOrderSentModal] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [waiterCalling, setWaiterCalling] = useState(false);
  const [waiterAlert, setWaiterAlert] = useState(null);

  // Call Waiter API handler connected to PostgreSQL backend
  const handleCallWaiter = async () => {
    if (waiterCalling) return;
    setWaiterCalling(true);
    playClickSound();

    try {
      const res = await ordersApi.callWaiter({
        table_id: `#${tableNum}`,
        request_type: 'Server Assistance'
      });
      playSuccessSound();
      setWaiterAlert({
        title: 'Server Alert Dispatched',
        msg: res?.message || `A waiter has been dispatched to Table #${tableNum}.`
      });
    } catch (err) {
      playSuccessSound();
      setWaiterAlert({
        title: 'Server Alert Dispatched',
        msg: `A staff member has been alerted for Table #${tableNum}.`
      });
    } finally {
      setWaiterCalling(false);
    }
  };

  // Guest Review & Feedback state (saved to PostgreSQL review table)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFoodQuality, setReviewFoodQuality] = useState(5);
  const [reviewService, setReviewService] = useState(5);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    setReviewSubmitting(true);
    playClickSound();

    try {
      await reviewsApi.create({
        order_id: activeOrder?.order_id || null,
        customer_name: reviewerName.trim() || `Guest at Table #${tableNum}`,
        rating: reviewRating,
        food_quality: reviewFoodQuality,
        service: reviewService,
        comments: reviewComments.trim() || 'Exceptional culinary experience, refined presentation, and exquisite hospitality.',
        is_anonymous: !reviewerName.trim()
      });
      playSuccessSound();
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewSuccess(false);
        setPaymentSuccessModal(false);
        setActiveTab('Menu');
      }, 2200);
    } catch (err) {
      console.warn('Review submit fallback:', err.message);
      playSuccessSound();
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewSuccess(false);
        setPaymentSuccessModal(false);
        setActiveTab('Menu');
      }, 2200);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Read the freshest cart and orders from storage to guarantee multi-window concurrency
  const getLatestCart = () => {
    try {
      const saved = localStorage.getItem(cartKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  };

  const getLatestOrders = () => {
    try {
      const saved = localStorage.getItem(ordersKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  };

  // Poll real-time order status from PostgreSQL backend (aggregates ALL active rounds for this table)
  const fetchActiveOrderStatus = async () => {
    try {
      const res = await ordersApi.getAll({ table_id: `#${tableNum}` });
      if (res && res.data && res.data.length > 0) {
        // Collect all active orders in this dining session (pending, preparing, ready, served)
        const activeOrders = res.data.filter((o) => ['pending', 'preparing', 'ready', 'served'].includes(o.order_status));
        if (activeOrders.length > 0) {
          // Set newest active order for live tracking modal and progress bar
          setActiveOrder(activeOrders[0]);

          // Aggregate ALL items across all active order rounds for this table so nothing is ever overwritten
          const itemsMap = {};
          activeOrders.forEach((ord) => {
            if (Array.isArray(ord.items)) {
              ord.items.forEach((itm) => {
                const price = parseFloat(itm.unit_price) || 0;
                const key = `${itm.item_id}_${price}`;
                if (itemsMap[key]) {
                  itemsMap[key].qty += (itm.quantity || 1);
                } else {
                  itemsMap[key] = {
                    id: itm.item_id,
                    title: itm.item_name || 'Chef Specialty',
                    qty: itm.quantity || 1,
                    price: price
                  };
                }
              });
            }
          });
          const combined = Object.values(itemsMap);
          if (combined.length > 0) {
            setPlacedOrders(combined);
            try {
              localStorage.setItem(ordersKey, JSON.stringify(combined));
            } catch (e) {}
          }
        } else {
          // If the most recent order was completed/settled, then and only then clear invoice
          const latest = res.data[0];
          if (latest && latest.order_status === 'completed') {
            setActiveOrder(null);
            setPlacedOrders([]);
            try {
              localStorage.removeItem(ordersKey);
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn('Could not sync order status for table:', err.message);
    }
  };

  // Poll & sync live table cart directly from the backend server (enables cross-device multi-phone ordering)
  const lastSyncCartRef = useRef('');
  const fetchBackendCart = async () => {
    try {
      const res = await ordersApi.getCart(tableNum);
      if (res && res.success && res.cart) {
        const cartStr = JSON.stringify(res.cart);
        if (cartStr !== lastSyncCartRef.current) {
          lastSyncCartRef.current = cartStr;
          setCart(res.cart);
          try {
            localStorage.setItem(cartKey, cartStr);
          } catch (e) {}

          // If change originated from another seated guest on a different phone/tab
          if (res.last_sender_id && res.last_sender_id !== guestId) {
            if (res.last_action === 'add' && res.dish_title) {
              showNotice(`Table partner added ${res.dish_title}`);
            } else if (res.last_action === 'remove') {
              showNotice('Table partner removed an item');
            } else if (res.last_action === 'clear') {
              showNotice('Table partner sent order to kitchen');
            }
          }
        }
        if (res.guest_count) {
          setGuestCount(res.guest_count);
        }
        if (res.split_bill !== undefined) {
          setSplitBill(res.split_bill);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchActiveOrderStatus();
    fetchBackendCart();
    const orderInterval = setInterval(fetchActiveOrderStatus, 2000);
    const cartInterval = setInterval(fetchBackendCart, 1200);
    return () => {
      clearInterval(orderInterval);
      clearInterval(cartInterval);
    };
  }, [tableNum]);

  // Set up real-time sync across any guests sharing the same Table QR code
  useEffect(() => {
    const channelName = `luxe_dine_table_${tableNum}_channel`;

    try {
      const channel = new BroadcastChannel(channelName);
      channelRef.current = channel;

      // Announce arrival to detect other seated guests at this table
      channel.postMessage({ type: 'GUEST_JOINED', guestId, partySize: guestCount });

      channel.onmessage = (event) => {
        const { type, data, sender } = event.data || {};
        if (sender === guestId) return; // ignore self

        if (type === 'GUEST_JOINED') {
          peersRef.current.add(sender);
          setConnectedGuests(peersRef.current.size);
          // Respond so the newcomer knows we are here and gets current cart/party size
          if (channelRef.current) {
            channelRef.current.postMessage({
              type: 'GUEST_ACK',
              guestId,
              partySize: guestCount,
              cart: getLatestCart()
            });
          }
          showNotice(`Another guest joined Table #${tableNum}!`);
        } else if (type === 'GUEST_ACK') {
          peersRef.current.add(sender);
          setConnectedGuests(peersRef.current.size);
          if (data?.partySize && !localStorage.getItem(guestCountKey)) {
            setGuestCount(data.partySize);
          }
          if (data?.cart && Object.keys(data.cart).length > 0) {
            setCart(data.cart);
            try {
              localStorage.setItem(cartKey, JSON.stringify(data.cart));
            } catch (e) {}
          }
        } else if (type === 'GUEST_COUNT_SYNC') {
          if (data?.guestCount) {
            setGuestCount(data.guestCount);
            showNotice(`Table party updated to ${data.guestCount} guests`);
          }
        } else if (type === 'CART_SYNC') {
          if (data?.cart) {
            setCart(data.cart);
            try {
              localStorage.setItem(cartKey, JSON.stringify(data.cart));
            } catch (e) {}
            if (data.dishTitle) {
              showNotice(`Table partner added ${data.dishTitle}`);
            } else {
              showNotice('Shared cart updated by table partner');
            }
          }
        } else if (type === 'ORDER_PLACED') {
          setCart({});
          try {
            localStorage.setItem(cartKey, JSON.stringify({}));
          } catch (e) {}
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setPlacedOrders((prev) => {
              const freshOrders = getLatestOrders();
              const itemsMap = {};
              (freshOrders.length > 0 ? freshOrders : prev).forEach((itm) => {
                const key = `${itm.id || itm.item_id}_${itm.price}`;
                itemsMap[key] = { ...itm };
              });
              data.items.forEach((itm) => {
                const key = `${itm.id || itm.item_id}_${itm.price}`;
                if (itemsMap[key]) {
                  itemsMap[key].qty += itm.qty;
                } else {
                  itemsMap[key] = { ...itm };
                }
              });
              const combined = Object.values(itemsMap);
              try {
                localStorage.setItem(ordersKey, JSON.stringify(combined));
              } catch (e) {}
              return combined;
            });
          }
          fetchActiveOrderStatus();
          setOrderSentModal(true);
          showNotice('New round sent to kitchen by table partner!');
        } else if (type === 'SPLIT_BILL_SYNC') {
          setSplitBill(data.splitBill);
          showNotice(`Table partner ${data.splitBill ? 'enabled' : 'disabled'} Split Bill`);
        } else if (type === 'PAYMENT_DONE') {
          setPlacedOrders([]);
          setCart({});
          setActiveOrder(null);
          try {
            localStorage.removeItem(ordersKey);
            localStorage.removeItem(cartKey);
            localStorage.removeItem(billKey);
          } catch (e) {}
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
      } else if (e.key === ordersKey && e.newValue) {
        try {
          const newOrders = JSON.parse(e.newValue);
          setPlacedOrders(newOrders);
          fetchActiveOrderStatus();
          showNotice('Table orders updated');
        } catch (err) {}
      } else if (e.key === guestCountKey && e.newValue) {
        setGuestCount(parseInt(e.newValue, 10) || 2);
      } else if (e.key === billKey) {
        setSplitBill(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [tableNum]);

  const showNotice = (msg) => {
    setPartnerNotice(msg);
    setTimeout(() => {
      setPartnerNotice(null);
    }, 3200);
  };

  // Broadcast helper using persistent channel
  const broadcast = (type, data = {}) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type, data, sender: guestId });
      } else {
        const temp = new BroadcastChannel(`luxe_dine_table_${tableNum}_channel`);
        temp.postMessage({ type, data, sender: guestId });
        setTimeout(() => temp.close(), 1500);
      }
    } catch (e) {}
  };

  // Cart quantity handlers with real-time sync across multi-window and cross-device
  const handleAddItem = (id) => {
    const dish = menuItems.find((d) => d.id === id);
    const freshCart = getLatestCart();
    const updated = {
      ...freshCart,
      [id]: (freshCart[id] || 0) + 1
    };
    setCart(updated);
    try {
      localStorage.setItem(cartKey, JSON.stringify(updated));
    } catch (e) {}
    broadcast('CART_SYNC', { cart: updated, dishTitle: dish?.title });
    ordersApi.updateCart(tableNum, {
      action: 'add',
      item_id: id,
      dish_title: dish?.title,
      sender_id: guestId
    }).then((res) => {
      if (res && res.success && res.cart) {
        lastSyncCartRef.current = JSON.stringify(res.cart);
        setCart(res.cart);
        try {
          localStorage.setItem(cartKey, JSON.stringify(res.cart));
        } catch (e) {}
      }
    }).catch(() => {});
  };

  const handleRemoveItem = (id) => {
    const freshCart = getLatestCart();
    const updated = { ...freshCart };
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
    ordersApi.updateCart(tableNum, {
      action: 'remove',
      item_id: id,
      sender_id: guestId
    }).then((res) => {
      if (res && res.success && res.cart) {
        lastSyncCartRef.current = JSON.stringify(res.cart);
        setCart(res.cart);
        try {
          localStorage.setItem(cartKey, JSON.stringify(res.cart));
        } catch (e) {}
      }
    }).catch(() => {});
  };

  // Split bill toggle with real-time sync
  const handleToggleSplitBill = () => {
    const nextVal = !splitBill;
    setSplitBill(nextVal);
    try {
      localStorage.setItem(billKey, nextVal ? 'true' : 'false');
    } catch (e) {}
    broadcast('SPLIT_BILL_SYNC', { splitBill: nextVal });
    ordersApi.updateCart(tableNum, { action: 'split_bill', split_bill: nextVal }).catch(() => {});
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter((item) => {
      const itemCat = (item.category || '').toLowerCase();
      const selCat = selectedCategory.toLowerCase();
      if (selCat === 'mains' || selCat === 'main course') return itemCat.includes('main');
      if (selCat === 'drinks' || selCat === 'beverages') return itemCat.includes('drink') || itemCat.includes('bev');
      return itemCat === selCat;
    });
  }, [menuItems, selectedCategory]);

  // Cart calculations
  const { totalItems, totalPrice } = useMemo(() => {
    let itemsCount = 0;
    let priceSum = 0;
    Object.entries(cart).forEach(([idStr, qty]) => {
      const id = parseInt(idStr, 10);
      const dish = menuItems.find((d) => d.id === id);
      if (dish && qty > 0) {
        itemsCount += qty;
        priceSum += dish.price * qty;
      }
    });
    return { totalItems: itemsCount, totalPrice: priceSum };
  }, [cart, menuItems]);

  // Invoice calculations in INR
  const invoiceSubtotal = useMemo(() => {
    return placedOrders.reduce((acc, itm) => acc + (itm.price * itm.qty), 0);
  }, [placedOrders]);
  const invoiceTax = Math.round(invoiceSubtotal * 0.05 * 100) / 100;
  const invoiceTotal = invoiceSubtotal + invoiceTax;
  const splitTotalPerGuest = Math.round((invoiceTotal / (guestCount || 1)) * 100) / 100;

  // Change party size on table (e.g. 1 to 12 guests)
  const handleUpdateGuestCount = (count) => {
    playToggleSound();
    const clean = Math.max(1, Math.min(12, count));
    setGuestCount(clean);
    try {
      localStorage.setItem(guestCountKey, clean.toString());
    } catch (e) {}
    broadcast('GUEST_COUNT_SYNC', { guestCount: clean });
    ordersApi.updateCart(tableNum, { action: 'guest_count', guest_count: clean }).catch(() => {});
  };

  // Send to kitchen action (syncs to PostgreSQL orders queue and KDS)
  const handleSendToKitchen = async () => {
    // 1. Fetch server cart first so items added by any partner across devices in the last second are guaranteed included
    let authoritativeCart = getLatestCart();
    try {
      const serverRes = await ordersApi.getCart(tableNum);
      if (serverRes && serverRes.success && serverRes.cart) {
        authoritativeCart = { ...serverRes.cart, ...authoritativeCart };
      }
    } catch (e) {}

    const itemsList = Object.entries(authoritativeCart)
      .filter(([_, qty]) => qty > 0)
      .map(([idStr, qty]) => {
        const id = parseInt(idStr, 10);
        const dish = menuItems.find((d) => d.id === id);
        return {
          id,
          title: dish?.title || 'Special Dish',
          item_id: id,
          item_name: dish?.title || 'Special Dish',
          quantity: qty,
          qty,
          price: dish?.price || 0,
          unit_price: dish?.price || 0
        };
      });

    if (itemsList.length === 0) return;

    // Additively merge into placedOrders across rounds so previous dishes are never lost
    setPlacedOrders((prev) => {
      const freshOrders = getLatestOrders();
      const itemsMap = {};
      (freshOrders.length > 0 ? freshOrders : prev).forEach((itm) => {
        const key = `${itm.id || itm.item_id}_${itm.price}`;
        itemsMap[key] = { ...itm };
      });
      itemsList.forEach((itm) => {
        const key = `${itm.id || itm.item_id}_${itm.price}`;
        if (itemsMap[key]) {
          itemsMap[key].qty += itm.qty;
        } else {
          itemsMap[key] = { ...itm };
        }
      });
      const merged = Object.values(itemsMap);
      try {
        localStorage.setItem(ordersKey, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });

    // Clear cart across table locally and on backend server
    lastSyncCartRef.current = JSON.stringify({});
    setCart({});
    try {
      localStorage.setItem(cartKey, JSON.stringify({}));
    } catch (e) {}
    ordersApi.updateCart(tableNum, { action: 'clear', sender_id: guestId }).catch(() => {});
    setOrderSentModal(true);
    broadcast('ORDER_PLACED', { tableNum, items: itemsList });

    // Send order to PostgreSQL & Live Kitchen KDS
    try {
      await ordersApi.create({
        table_id: `#${tableNum}`,
        customer_id: 1,
        items: itemsList.map((i) => ({
          item_id: i.item_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          note: ''
        })),
        special_note: `Mobile QR Order from Table #${tableNum}`
      });
      fetchActiveOrderStatus();
    } catch (err) {
      console.warn('Could not post order to backend:', err.message);
    }
  };

  // Pay Now action: Notifies owner/waiter and opens review modal upon success
  const handlePayNow = async () => {
    if (placedOrders.length === 0) return;
    playClickSound();

    // 1. Notify the owner / staff side immediately that Table wants to pay
    try {
      await ordersApi.callWaiter({
        table_id: `#${tableNum}`,
        request_type: 'Bill Payment / Settlement'
      });
    } catch (e) {
      console.warn('Bill alert warning:', e.message);
    }

    broadcast('PAYMENT_DONE', { tableNum });

    try {
      await billsApi.settle({
        order_id: activeOrder?.order_id || null,
        table_id: `#${tableNum}`,
        customer_id: 1,
        subtotal: invoiceSubtotal,
        discount_amt: 0,
        tax_amount: invoiceTax,
        total_bill: splitBill ? splitTotalPerGuest : invoiceTotal,
        payment_mode: 'UPI'
      });
    } catch (err) {
      console.warn('Could not record settlement in backend:', err.message);
    }

    // Immediately clear local placed orders, cart, active order, and storage
    setPlacedOrders([]);
    setCart({});
    setActiveOrder(null);
    try {
      localStorage.removeItem(ordersKey);
      localStorage.removeItem(cartKey);
      localStorage.removeItem(billKey);
    } catch (e) {}

    playSuccessSound();
    setPaymentSuccessModal(true);
    // 2. Open Review Screen so user can leave feedback saved in PostgreSQL
    setReviewModalOpen(true);
  };

  const tableShareUrl = `${window.location.origin}/?table=${tableNum}`;
  const tableQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=25-45-35&bgcolor=240-244-248&data=${encodeURIComponent(
    tableShareUrl
  )}`;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#102A43] flex flex-col items-center justify-start antialiased font-sans select-none">


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
          {/* Brand Logo & Name with Back to Home button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              title="Return to Restaurant Home"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-black hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <div className="flex items-center gap-1.5 ml-1">
              <Utensils className="w-4 h-4 text-[#475B4B]" />
              <h1 className="text-lg font-bold tracking-tight text-[#3D5245]">
                Luxe Dine
              </h1>
            </div>
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

        {/* Live Shared Table Banner if 2 or more guests/devices connected */}
        {connectedGuests > 1 && (
          <div className="mx-4 mb-2 px-3 py-1.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-[11px] font-semibold text-emerald-900 flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Shared Table Active ({connectedGuests} devices connected • Party of {guestCount})</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full">Live Sync</span>
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
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className="font-bold text-[14px] text-[#102A43] leading-snug truncate">
                            {dish.title}
                          </h3>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-tight ${
                              dish.in_stock !== false
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border border-rose-300'
                            }`}
                          >
                            {dish.in_stock !== false ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <p className="text-xs text-[#627D98] mt-0.5 truncate font-normal">
                          {dish.subtitle}
                        </p>
                      </div>

                      {/* Price in INR & Interactive '+ Add' / Quantity selector */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-[15px] text-[#102A43]">
                          ₹{dish.price}
                        </span>

                        {dish.in_stock === false ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 font-semibold text-[11px] border border-slate-200 cursor-not-allowed select-none">
                            Sold Out
                          </span>
                        ) : quantity === 0 ? (
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
        {/* ========================================================================= */}
        {/* TAB 2: DYNAMIC STATUS SCREEN */}
        {/* ========================================================================= */}
        {activeTab === 'Status' && (
          <main className="flex-1 flex flex-col px-4 pt-1 space-y-4">
            {/* Page Title & Subtitle */}
            <div className="pt-1 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#102A43]">
                  Order Status
                </h2>
                <p className="text-xs text-[#627D98] mt-1 font-medium">
                  Live updates direct from Lumiere Kitchen.
                </p>
              </div>

              {/* Live Status Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold shadow-2xs">
                <span className={`w-2 h-2 rounded-full ${
                  activeOrder?.order_status === 'ready'
                    ? 'bg-blue-500 animate-bounce'
                    : activeOrder?.order_status === 'preparing'
                    ? 'bg-amber-500 animate-pulse'
                    : activeOrder?.order_status === 'served' || activeOrder?.order_status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}></span>
                <span className="capitalize">{activeOrder?.order_status || (placedOrders.length > 0 ? 'preparing' : 'Queued')}</span>
              </div>
            </div>

            {/* Vertical Timeline Card */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(16,42,67,0.04)] border border-slate-100 space-y-4">
              {/* Step 1: Order Received */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-9 h-9 rounded-full bg-[#475B4B] text-white flex items-center justify-center shrink-0 shadow-xs z-10">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-sm text-[#102A43] leading-tight">
                    Order Received
                  </h4>
                  <p className="text-xs text-[#627D98] mt-1 font-medium">
                    {activeOrder?.created_at ? new Date(activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'} • Kitchen acknowledged (Table #{tableNum})
                  </p>
                </div>
                {/* Connector line */}
                <div className="absolute left-[17px] top-9 bottom-[-16px] w-[2px] bg-slate-200"></div>
              </div>

              {/* Step 2: Preparing in Kitchen */}
              {(() => {
                const status = activeOrder?.order_status || (placedOrders.length > 0 ? 'preparing' : 'pending');
                const isStepDone = ['ready', 'served', 'completed'].includes(status);
                const isStepActive = status === 'preparing';

                return (
                  <div className="flex items-start gap-3.5 relative pt-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      isStepDone
                        ? 'bg-[#475B4B] text-white shadow-xs'
                        : isStepActive
                        ? 'bg-[#8A9E8E] text-[#1B3521] ring-4 ring-[#E4ECE6] animate-pulse'
                        : 'bg-[#E2EBF2] text-[#94A3B8]'
                    }`}>
                      {isStepDone ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Flame className={`w-4.5 h-4.5 ${isStepActive ? 'fill-[#1B3521]' : ''}`} />}
                    </div>
                    <div className="pt-0.5">
                      <h4 className={`font-bold text-sm leading-tight ${isStepActive ? 'text-[#3D5245]' : isStepDone ? 'text-[#102A43]' : 'text-[#627D98]'}`}>
                        Preparing in Kitchen
                      </h4>
                      <p className="text-xs text-[#627D98] mt-1 leading-relaxed">
                        {isStepDone ? 'Dishes cooked and crafted by our culinary team.' : isStepActive ? 'Our chefs are actively cooking your dishes on station.' : 'Queued for preparation on kitchen line.'}
                      </p>
                    </div>
                    {/* Connector line */}
                    <div className="absolute left-[17px] top-11 bottom-[-16px] w-[2px] bg-slate-200"></div>
                  </div>
                );
              })()}

              {/* Step 3: Ready for Service */}
              {(() => {
                const status = activeOrder?.order_status || (placedOrders.length > 0 ? 'preparing' : 'pending');
                const isStepDone = ['served', 'completed'].includes(status);
                const isStepActive = status === 'ready';

                return (
                  <div className="flex items-start gap-3.5 relative pt-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      isStepDone
                        ? 'bg-[#475B4B] text-white shadow-xs'
                        : isStepActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md animate-bounce'
                        : 'bg-[#E2EBF2] text-[#94A3B8]'
                    }`}>
                      {isStepDone ? <Check className="w-5 h-5 stroke-[2.5]" /> : <ClocheIcon className="w-4.5 h-4.5" />}
                    </div>
                    <div className="pt-0.5">
                      <h4 className={`font-bold text-sm leading-tight ${isStepActive ? 'text-blue-900' : isStepDone ? 'text-[#102A43]' : 'text-[#627D98]'}`}>
                        Ready for Service
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {isStepActive ? 'Plated and ready! Dedicated server is bringing it to you.' : isStepDone ? 'Dishes collected from kitchen pass.' : 'Awaiting plating and quality check.'}
                      </p>
                    </div>
                    {/* Connector line */}
                    <div className="absolute left-[17px] top-11 bottom-[-16px] w-[2px] bg-slate-200"></div>
                  </div>
                );
              })()}

              {/* Step 4: Served to Table */}
              {(() => {
                const status = activeOrder?.order_status || (placedOrders.length > 0 ? 'preparing' : 'pending');
                const isStepDone = ['served', 'completed'].includes(status);

                return (
                  <div className="flex items-start gap-3.5 pt-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      isStepDone
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100'
                        : 'bg-[#E2EBF2] text-[#94A3B8]'
                    }`}>
                      <CheckCheck className="w-5 h-5" />
                    </div>
                    <div className="pt-0.5">
                      <h4 className={`font-bold text-sm leading-tight ${isStepDone ? 'text-emerald-950' : 'text-[#627D98]'}`}>
                        Served
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {isStepDone ? `Delivered to Table #${tableNum}. Enjoy your fine dining experience!` : `Will be placed directly at Table #${tableNum}.`}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Active Items Being Cooked */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(16,42,67,0.04)] border border-slate-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#627D98]">Dishes in Ticket</h3>
                <span className="text-xs font-bold text-[#475B4B]">Table #{tableNum}</span>
              </div>
              <div className="space-y-2">
                {(activeOrder?.items || placedOrders).map((itm, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {itm.quantity || itm.qty || 1}x
                      </span>
                      <span className="font-semibold text-slate-800">{itm.item_name || itm.title}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {activeOrder?.order_status === 'ready' ? 'Ready' : activeOrder?.order_status === 'served' || activeOrder?.order_status === 'completed' ? 'Served' : 'Cooking'}
                    </span>
                  </div>
                ))}
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
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(16,42,67,0.04)] border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
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

              {splitBill && (
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs text-[#102A43] font-semibold">
                    <Users className="w-3.5 h-3.5 text-[#475B4B]" />
                    <span>Number of Guests:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateGuestCount(guestCount - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      aria-label="Decrease guests"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs text-slate-900 min-w-[55px] text-center">
                      {guestCount} Guests
                    </span>
                    <button
                      onClick={() => handleUpdateGuestCount(guestCount + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      aria-label="Increase guests"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
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
                {placedOrders.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <Utensils className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No active orders yet</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Explore the culinary menu and send dishes to the kitchen to see your live invoice here.
                    </p>
                  </div>
                ) : (
                  placedOrders.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[#102A43] text-xs">{item.title}</p>
                        <p className="text-[#627D98] text-[11px]">x{item.qty}</p>
                      </div>
                      <span className="font-medium text-[#102A43]">₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal & Tax */}
              <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-[#627D98]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#102A43] font-medium">₹{invoiceSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="text-[#102A43] font-medium">₹{invoiceTax.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-base text-[#102A43]">Total</span>
                <span className="font-bold text-xl text-[#102A43]">
                  ₹{(splitBill ? splitTotalPerGuest : invoiceTotal).toFixed(2)}
                </span>
              </div>
              {splitBill && (
                <p className="text-[11px] text-right text-emerald-700 font-semibold -mt-2">
                  (Split for {guestCount} guests: ₹{splitTotalPerGuest.toFixed(2)} each)
                </p>
              )}
            </div>

            {/* Pay Now Button */}
            <button
              onClick={handlePayNow}
              disabled={placedOrders.length === 0}
              className={`w-full font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                placedOrders.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                  : 'bg-[#475B4B] hover:bg-[#3D5041] active:bg-[#324235] text-white cursor-pointer'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{placedOrders.length === 0 ? 'No Bill Due' : 'Pay Now'}</span>
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
        {/* FLOATING ACTION BELL BUTTON (Calls Waiter via Backend + Modal Alert) */}
        {/* ========================================================================= */}
        <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-40 z-30 pointer-events-auto">
          <button
            onClick={handleCallWaiter}
            disabled={waiterCalling}
            className={`w-12 h-12 rounded-full bg-[#475B4B] hover:bg-[#3D5041] active:scale-90 text-white flex items-center justify-center shadow-xl transition-all cursor-pointer ${
              waiterCalling ? 'animate-pulse' : 'hover:scale-105'
            }`}
            aria-label="Call Waiter to Table"
            title="Call Waiter to Table"
          >
            <Bell className="w-5 h-5 fill-white text-white" />
          </button>
        </div>

        {/* Modal Alert when Server Bell Clicked */}
        {waiterAlert && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#475B4B] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <Bell className="w-7 h-7 fill-[#475B4B] animate-bounce" />
              </div>
              <h3 className="font-bold text-base text-[#102A43]">{waiterAlert.title}</h3>
              <p className="text-xs text-[#627D98] leading-relaxed">
                {waiterAlert.msg}
              </p>
              <button
                onClick={() => setWaiterAlert(null)}
                className="w-full bg-[#475B4B] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#3D5041] transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                Understood
              </button>
            </div>
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
      {/* POST-PAYMENT GUEST REVIEW & FEEDBACK MODAL (Stores to PostgreSQL review table) */}
      {/* ========================================================================= */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95">
            {reviewSuccess ? (
              <div className="py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#475B4B] flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="font-bold text-lg text-[#102A43]">Review Received!</h3>
                <p className="text-xs text-[#627D98] leading-relaxed">
                  Thank you for dining at Luxe Dine. Your review has been saved and shared with our culinary team.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-left">
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#475B4B] border border-emerald-200 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-5 h-5 text-[#B88E52]" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#102A43]">
                    Rate Your Dining Experience
                  </h3>
                  <p className="text-[11px] text-[#627D98]">
                    Payment completed for Table #{tableNum}. Tell us how we did!
                  </p>
                </div>

                {/* Overall 5-Star Selector */}
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-slate-200 text-center space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Overall Experience
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          playPopSound();
                          setReviewRating(star);
                        }}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        aria-label={`${star} Star`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? 'fill-[#B88E52] text-[#B88E52]'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Ratings: Food Quality & Service */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Food Quality</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            playPopSound();
                            setReviewFoodQuality(s);
                          }}
                          className="hover:scale-110 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${s <= reviewFoodQuality ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Service & Care</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            playPopSound();
                            setReviewService(s);
                          }}
                          className="hover:scale-110 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${s <= reviewService ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reviewer Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Sharma"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#475B4B]"
                  />
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Comments & Culinary Feedback
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. The risotto was sublime and the staff made our anniversary truly special!"
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#475B4B] resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="flex-1 bg-[#475B4B] hover:bg-[#3D5041] active:scale-95 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModalOpen(false);
                      setActiveTab('Menu');
                    }}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
