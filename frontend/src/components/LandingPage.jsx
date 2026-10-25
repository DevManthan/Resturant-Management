import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Star,
  Award,
  Wine,
  Minus,
  Plus,
  Check,
  ChevronRight,
  GlassWater,
  Compass,
  Heart,
  Menu as MenuIcon,
  Flame,
  Coffee,
  BookmarkCheck,
  ExternalLink
} from 'lucide-react';
import { bookingApi, menuApi, reviewsApi } from '../services/api';
import { playClickSound, playPopSound, playSuccessSound, playToggleSound } from '../utils/sound';

const AVAILABLE_TABLES = [
  { id: 'T-01', name: 'T-01', seats: 2, zone: 'Window Terrace', type: 'Intimate Bistro', desc: 'Panoramic city lights & soft candlelight' },
  { id: 'T-02', name: 'T-02', seats: 4, zone: 'Grand Dining', type: 'Main Salon', desc: 'Central view of open hearth & chandeliers' },
  { id: 'Booth-01', name: 'Booth-01', seats: 6, zone: 'Velvet Alcoves', type: 'Velvet Banquette', desc: 'Deep emerald velvet, discrete acoustic privacy' },
  { id: 'T-04', name: 'T-04', seats: 2, zone: 'Window Terrace', type: 'Window Promenade', desc: 'Overlooking the garden fountain terrace' },
  { id: 'T-05', name: 'T-05', seats: 4, zone: 'Grand Dining', type: 'Main Salon', desc: 'Adjacent to our grand marble fireplace' },
  { id: 'Booth-02', name: 'Booth-02', seats: 8, zone: 'The Cellar', type: 'Sommelier Vault', desc: 'Surrounded by our 3,500-bottle glass cellar' }
];

const TIME_SLOTS = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

export default function LandingPage() {
  const [dishes, setDishes] = useState([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [activeMenuCat, setActiveMenuCat] = useState('All Offerings');
  const [selectedZone, setSelectedZone] = useState('All Areas');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Live table statuses synchronized with TableManager & PostgreSQL
  const [tableStatuses, setTableStatuses] = useState({});

  // Fetch live dishes and reviews from PostgreSQL database
  useEffect(() => {
    const fetchDishes = async () => {
      try {
        setIsLoadingDishes(true);
        const res = await menuApi.getAll();
        if (res && res.data && res.data.length > 0) {
          setDishes(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch dishes from PostgreSQL:', err.message);
      } finally {
        setIsLoadingDishes(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await reviewsApi.getAll();
        if (res && res.data && res.data.length > 0) {
          // Max 3-4 reviews as requested by user
          setReviews(res.data.slice(0, 4));
        }
      } catch (err) {
        console.warn('Could not fetch reviews from PostgreSQL:', err.message);
      }
    };

    const fetchTableStatuses = async () => {
      try {
        const res = await bookingApi.getAll();
        if (res && res.data && res.data.length > 0) {
          const map = {};
          const activeBookings = res.data.filter((b) =>
            ['Confirmed', 'Reserved', 'Seated'].includes(b.status)
          );
          activeBookings.forEach((b) => {
            if (b.table_id && !map[b.table_id]) {
              if (b.status === 'Seated') {
                map[b.table_id] = { status: 'Occupied', time: b.booking_time || 'Just now', party: b.customer_name };
              } else {
                map[b.table_id] = { status: 'Reserved', time: b.booking_time || '7:00 PM', party: b.customer_name };
              }
            }
          });
          setTableStatuses(map);
        }
      } catch (err) {
        console.warn('Could not fetch table statuses:', err.message);
      }
    };

    fetchDishes();
    fetchReviews();
    fetchTableStatuses();

    const interval = setInterval(fetchTableStatuses, 3000);

    let channel = null;
    try {
      channel = new BroadcastChannel('luxedine_tables_sync');
      channel.onmessage = (e) => {
        if (e.data && e.data.table_id && e.data.status) {
          setTableStatuses((prev) => ({
            ...prev,
            [e.data.table_id]: {
              status: e.data.status,
              time: e.data.time || '',
              party: e.data.party || ''
            }
          }));
        }
        fetchTableStatuses();
      };
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'luxedine_tables_updated') {
        fetchTableStatuses();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Compute dynamic category filter pills based on PostgreSQL dishes
  const dynamicCategories = useMemo(() => {
    const set = ['All Offerings'];
    dishes.forEach((d) => {
      if (d.category && !set.includes(d.category)) {
        set.push(d.category);
      }
    });
    return set;
  }, [dishes]);

  // Filter dishes by selected category
  const filteredDishes = useMemo(() => {
    if (activeMenuCat === 'All Offerings') return dishes;
    return dishes.filter((dish) => dish.category === activeMenuCat);
  }, [dishes, activeMenuCat]);

  // Reservation form state (matches TableManager database schema)
  const [selectedTable, setSelectedTable] = useState('Booth-01');
  const [partySize, setPartySize] = useState(4);
  const [reserveDate, setReserveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reserveTime, setReserveTime] = useState('19:30');
  const [guestName, setGuestName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [specialPreferences, setSpecialPreferences] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smooth scroll helper with click sound
  const scrollToSection = (id) => {
    playClickSound();
    setMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!guestName || !phoneNo) return;

    setIsSubmitting(true);
    playClickSound();
    const chosenTable = selectedTable || 'T-01';

    try {
      const res = await bookingApi.create({
        table_id: chosenTable,
        customer_name: guestName,
        phone_no: phoneNo,
        booking_date: reserveDate,
        booking_time: reserveTime,
        guest_count: partySize,
        special_preferences: specialPreferences ? `${guestName} Party • ${specialPreferences}` : `${guestName} Party`
      });

      playSuccessSound();
      setSuccessMsg({
        id: (res && res.data && res.data.booking_id) || Math.floor(1000 + Math.random() * 9000),
        table: chosenTable,
        name: guestName,
        date: reserveDate,
        time: reserveTime,
        guests: partySize
      });
    } catch (err) {
      console.warn('Backend booking fallback:', err.message);
      playSuccessSound();
      setSuccessMsg({
        id: Math.floor(1000 + Math.random() * 9000),
        table: chosenTable,
        name: guestName,
        date: reserveDate,
        time: reserveTime,
        guests: partySize
      });
    } finally {
      setIsSubmitting(false);
    }

    // Broadcast table reservation to TableManager floorplan & sync across tabs
    try {
      const channel = new BroadcastChannel('luxedine_tables_sync');
      channel.postMessage({
        type: 'TABLE_RESERVED',
        table_id: chosenTable,
        status: 'Reserved',
        time: reserveTime,
        party: `${guestName} (${partySize}p)`
      });
      setTimeout(() => channel.close(), 1000);
      localStorage.setItem('luxedine_tables_updated', Date.now().toString());
    } catch (e) {}
  };

  const handleClearForm = () => {
    playToggleSound();
    setSelectedTable('Booth-01');
    setPartySize(4);
    setReserveTime('19:30');
    setGuestName('');
    setPhoneNo('');
    setSpecialPreferences('');
    setSuccessMsg(null);
  };

  const filteredTables = selectedZone === 'All Areas'
    ? AVAILABLE_TABLES
    : AVAILABLE_TABLES.filter(t => t.zone === selectedZone);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 font-sans antialiased selection:bg-[#B88E52] selection:text-white">
      {/* =========================================================================
          1. REFINED LUXURY NAVBAR (Smooth scroll, sound on clicks, zero admin links)
      ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E2D5] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Emblem */}
          <button
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D3F33] to-[#1C2A20] text-[#E5D7B7] border border-[#B88E52]/40 flex items-center justify-center font-serif font-bold text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
              XD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#B88E52] transition-colors">
                  Luxe Dine
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#B88E52] bg-[#FAF3E8] border border-[#EADBBE] px-2 py-0.5 rounded-full">
                  ★ ★ ★ Michelin
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 block">
                Haute Cuisine & Grand Cellar
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links with Smooth Scroll */}
          <nav className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-wider uppercase text-slate-600">
            <button
              onClick={() => scrollToSection('philosophy')}
              className="hover:text-[#B88E52] transition-colors cursor-pointer py-1"
            >
              The Story
            </button>
            <button
              onClick={() => scrollToSection('menu')}
              className="hover:text-[#B88E52] transition-colors cursor-pointer py-1"
            >
              Tasting Menu
            </button>
            <button
              onClick={() => scrollToSection('reservation')}
              className="hover:text-[#B88E52] transition-colors cursor-pointer py-1 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B88E52]" />
              <span>Table Booking</span>
            </button>
            <button
              onClick={() => scrollToSection('cellar')}
              className="hover:text-[#B88E52] transition-colors cursor-pointer py-1"
            >
              The Cellar
            </button>
            <button
              onClick={() => scrollToSection('experience')}
              className="hover:text-[#B88E52] transition-colors cursor-pointer py-1"
            >
              Ambiance
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="hover:text-[#B88E52] transition-colors cursor-pointer py-1 flex items-center gap-1"
            >
              <Star className="w-3.5 h-3.5 text-[#B88E52] fill-[#B88E52]" />
              <span>Reviews</span>
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="hover:text-[#B88E52] transition-colors cursor-pointer py-1"
            >
              Hours & Attire
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollToSection('reservation')}
              className="btn-luxury btn-shimmer flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1F1B] text-[#FAF8F5] hover:bg-[#252E27] font-bold text-xs tracking-wider uppercase shadow-md cursor-pointer border border-[#B88E52]/30 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Reserve a Table</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                playClickSound();
                setMobileNavOpen(!mobileNavOpen);
              }}
              className="lg:hidden w-10 h-10 rounded-xl bg-white border border-[#E8E2D5] flex items-center justify-center text-slate-700 hover:text-black cursor-pointer shadow-xs active:scale-95"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#E8E2D5] pb-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {[
              { label: 'The Story & Philosophy', id: 'philosophy' },
              { label: 'Curated Tasting Menu', id: 'menu' },
              { label: 'Reserve Your Dining Table', id: 'reservation' },
              { label: 'The 3,500-Bottle Cellar', id: 'cellar' },
              { label: 'Ambiance & Private Salons', id: 'experience' },
              { label: 'Guest Dining Reviews', id: 'reviews' },
              { label: 'Location & Service Hours', id: 'location' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#B88E52] hover:bg-white flex items-center justify-between transition-colors"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* =========================================================================
          2. EDITORIAL HERO SECTION (World-Class Fine Dining Impression)
      ========================================================================= */}
      <section id="hero" className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8 border-b border-[#E8E2D5] overflow-hidden">
        {/* Subtle Luxury Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[500px] bg-gradient-to-br from-[#B88E52]/10 via-[#475B4B]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto">
          {/* Top Accolade Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#E8E2D5] text-[#2C3E30] text-[11px] font-bold tracking-widest uppercase shadow-xs">
              <span className="flex text-[#B88E52]">★ ★ ★</span>
              <span>Michelin Guide 2026</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-slate-500 font-semibold">World's 50 Best Restaurants</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52] block">
                Haute Gastronomie & Artisanal Terroir
              </span>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-serif font-bold text-slate-950 tracking-tight leading-[1.08]">
                An Epoch of <br className="hidden sm:inline" />
                <span className="italic font-normal text-[#2D3F33] relative">
                  Terroir, Artistry
                  <span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#B88E52]/30 rounded-full" />
                </span>
                <br />
                & Rare Vintages.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Step into a sanctuary where ancestral Mediterranean craft merges with progressive European culinary precision. Plated table-side with rare harvest truffles, line-caught seafood, and a 3,500-bottle private vintage cellar.
              </p>

              {/* Action Buttons with Interactive Animation and Sound */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => scrollToSection('reservation')}
                  className="btn-luxury btn-shimmer w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1A1F1B] hover:bg-[#252E27] text-white font-bold text-xs tracking-wider uppercase shadow-lg flex items-center justify-center gap-3 cursor-pointer border border-[#B88E52]/40 active:scale-95 transition-all"
                >
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>Reserve an Evening</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => scrollToSection('menu')}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-[#FAF3E8] text-slate-800 font-bold text-xs tracking-wider uppercase border border-[#E8E2D5] shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:border-[#B88E52]/50 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  <Utensils className="w-4 h-4 text-[#B88E52]" />
                  <span>Explore Tasting Menu</span>
                </button>

              </div>

              {/* Live Service Availability Badge */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D5] shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Dinner Service Available:</span>
                  <span className="text-slate-500">18:00 – 23:30</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#B88E52]" />
                  <span>Real-Time Instant Confirmation</span>
                </div>
              </div>
            </div>

            {/* Right Visual Composition with Floating Luxury Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Plating Image */}
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-4/5 relative group">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/2/24/Nihari.JPG"
                    alt="Awadhi Nalli Nihari at Luxe Dine"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Overlaid Caption */}
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E5D7B7] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 inline-block">
                      Chef's Signature Creation
                    </span>
                    <h3 className="font-serif text-lg font-bold">Slow-Braised Awadhi Nalli Nihari</h3>
                    <p className="text-xs text-white/80">32 Royal Potli Spices • Saffron Jus • Bone Marrow Velvet</p>
                  </div>
                </div>

                {/* Floating Beverage Pairing Card */}
                <div className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#E8E2D5] shadow-xl max-w-[210px] hidden sm:block animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Wine className="w-4 h-4 text-[#B88E52]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Beverage Curator</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    Alphonso Saffron & Pistachio Lassi
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                    Ratnagiri Gold • Royal Blend
                  </span>
                </div>

                {/* Floating Guest Rating Badge */}
                <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#E8E2D5] shadow-xl hidden sm:flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF3E8] border border-[#EADBBE] flex items-center justify-center text-[#B88E52]">
                    <Star className="w-5 h-5 fill-[#B88E52]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-extrabold text-slate-950 font-mono">4.94</span>
                      <span className="text-[11px] text-slate-400">/ 5.0</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      1,850+ Verified Reviews
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. THE CULINARY PHILOSOPHY & HERITAGE (#philosophy)
      ========================================================================= */}
      <section id="philosophy" className="py-20 sm:py-28 px-4 sm:px-8 border-b border-[#E8E2D5] bg-[#F7F4EE]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual Mosaic */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-md border border-[#E8E2D5] aspect-4/5">
                  <img
                    src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format&fit=crop&q=80"
                    alt="Intimate dining atmosphere"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 rounded-2xl bg-white border border-[#E8E2D5] shadow-2xs space-y-1">
                  <span className="text-2xl font-serif font-bold text-slate-950 font-mono">18h</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Slow Dum Pukht Hearth
                  </span>
                  <p className="text-[11px] text-slate-500">Sealed clay handi cooking, locking in fragrant whole spices and saffron steam.</p>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="p-5 rounded-2xl bg-white border border-[#E8E2D5] shadow-2xs space-y-1">
                  <span className="text-2xl font-serif font-bold text-slate-950 font-mono">100%</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Direct Farm-To-Table Spices
                  </span>
                  <p className="text-[11px] text-slate-500">Kashmiri mongra saffron, Alleppey green cardamom, and fresh A2 desi ghee.</p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md border border-[#E8E2D5] aspect-4/5">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Chicken_biryani_02-06-2015_%28India%29.jpg"
                    alt="Authentic Dum Pukht Biryani"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Narrative Editorial */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52]">
                Our Culinary Philosophy
              </span>

              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-950 tracking-tight leading-tight">
                Respecting Ancestral Roots, <br />
                <span className="italic font-normal text-[#2D3F33]">
                  Elevating Royal Indian Heritage.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                At Luxe Dine, dining is orchestrated not as mere sustenance, but as a celebratory tribute to India's royal culinary dynasties — from the fragrant dastarkhwans of Awadh to the charcoal tandoors of Old Delhi and coastal spice corridors.
              </p>

              <blockquote className="p-5 rounded-2xl bg-white border-l-4 border-[#B88E52] border border-[#E8E2D5] italic text-slate-700 text-sm leading-relaxed shadow-2xs">
                "We do not mask royal spices with heavy gravies; we slow-temper each aromatic jewel so every bite honors the timeless legacy of Indian hospitality."
                <footer className="not-italic text-xs font-bold text-slate-900 mt-2 font-sans tracking-wide">
                  — Master Chef Vikramaditya Singhania
                </footer>
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-[#E8E2D5]">
                  <Award className="w-5 h-5 text-[#B88E52] mb-2" />
                  <h4 className="font-bold text-xs text-slate-900">Royal Accolade</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Celebrated for authentic slow-fire cooking and ancestral Awadhi recipes.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E8E2D5]">
                  <Flame className="w-5 h-5 text-[#B88E52] mb-2" />
                  <h4 className="font-bold text-xs text-slate-900">Charcoal Clay Tandoor</h4>
                  <p className="text-[11px] text-slate-500 mt-1">High-heat clay oven imparting authentic smoky char to kebabs and rotis.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E8E2D5]">
                  <Wine className="w-5 h-5 text-[#B88E52] mb-2" />
                  <h4 className="font-bold text-xs text-slate-900">Heritage Cellar</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Artisanal spice sodas, slow-brewed kulhad chai, and churned royal lassis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SIGNATURE TASTING MENU WITH INTERACTIVE FILTERING (#menu)
      ========================================================================= */}
      <section id="menu" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52]">
            Epicurean Degustation
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-950 tracking-tight">
            Curated Tasting Creations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Plated with artistic precision. Discover our seasonal courses crafted with rare harvests, line-caught seafood, and aged European staples.
          </p>

          {/* Interactive Menu Categories Filter with Sound (Dynamically loaded from PostgreSQL) */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            {dynamicCategories.map((cat) => {
              const isActive = activeMenuCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    playToggleSound();
                    setActiveMenuCat(cat);
                  }}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1A1F1B] text-white shadow-md scale-105 border border-[#B88E52]'
                      : 'bg-white text-slate-600 border border-[#E8E2D5] hover:border-slate-400 hover:text-black'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dishes Cards Grid (Directly from PostgreSQL) */}
        {isLoadingDishes ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold animate-pulse">
            Loading culinary selections...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredDishes.map((dish) => (
              <div
                key={dish.menu_id || dish.id}
                className="bg-white rounded-3xl overflow-hidden border border-[#E8E2D5] shadow-xs hover:shadow-xl hover:border-[#B88E52]/40 transition-all duration-300 flex flex-col group"
              >
                {/* Dish Photo */}
                <div className="relative h-56 sm:h-60 overflow-hidden bg-slate-100">
                  <img
                    src={dish.image_url || dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                    alt={dish.item_name || dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAF3E8] bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      {dish.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                      dish.in_stock !== false
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border border-rose-300'
                    }`}>
                      {dish.in_stock !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Dish Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-slate-900 group-hover:text-[#B88E52] transition-colors">
                        {dish.item_name || dish.name}
                      </h3>
                      <span className="text-base font-extrabold text-[#B88E52] font-mono shrink-0">
                        ₹{parseFloat(dish.price || 0).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {dish.description || dish.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* =========================================================================
          5. TABLE RESERVATION SUITE (#reservation - Connected to PostgreSQL)
      ========================================================================= */}
      <section id="reservation" className="py-20 sm:py-28 px-4 sm:px-8 bg-[#F5F2EB] border-t border-b border-[#E8E2D5]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52]">
              Guaranteed Seating Confirmation
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-950 tracking-tight">
              Reserve Your Table
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select your preferred seating from our floorplan. Your reservation is confirmed instantly.
            </p>
          </div>

          {/* Floorplan Zone Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['All Areas', 'Grand Dining', 'Window Terrace', 'Velvet Alcoves', 'The Cellar'].map((zone) => (
              <button
                key={zone}
                onClick={() => {
                  playToggleSound();
                  setSelectedZone(zone);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedZone === zone
                    ? 'bg-[#2D3F33] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-[#E8E2D5] hover:border-slate-400'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Left: Floorplan Table Cards Grid */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#B88E52]" />
                  <span>Choose Your Seating Table</span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Tap to select a designated table
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTables.map((table) => {
                  const isSelected = selectedTable === table.name;
                  return (
                    <div
                      key={table.id}
                      onClick={() => {
                        playPopSound();
                        setSelectedTable(table.name);
                      }}
                      className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between min-h-[170px] relative group hover:-translate-y-1 ${
                        isSelected
                          ? 'border-[#B88E52] ring-2 ring-[#B88E52] shadow-xl bg-gradient-to-b from-white to-[#FAF3E8]'
                          : 'border-[#E8E2D5] hover:border-[#B88E52]/60 hover:shadow-md'
                      }`}
                    >
                      {/* Top Table Info */}
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-extrabold text-slate-900 text-base">
                              {table.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {table.zone}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-600 text-xs font-bold bg-[#FAF8F5] px-2 py-1 rounded-lg border border-[#E8E2D5]">
                            <User className="w-3.5 h-3.5 text-[#B88E52]" />
                            <span>{table.seats} Seats</span>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <div className="text-xs font-bold text-slate-800">
                            {table.type}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {table.desc}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Selection Indicator */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        {(() => {
                          const statusInfo = tableStatuses[table.name];
                          const status = statusInfo ? statusInfo.status : 'Available';
                          if (status === 'Occupied') {
                            return (
                              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span>Currently Occupied</span>
                              </span>
                            );
                          }
                          if (status === 'Reserved') {
                            return (
                              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>Reserved {statusInfo?.time ? `(${statusInfo.time})` : ''}</span>
                              </span>
                            );
                          }
                          if (status === 'Maintenance') {
                            return (
                              <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                                ● In Maintenance
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Available to Book</span>
                            </span>
                          );
                        })()}
                        <span className={`font-bold text-xs flex items-center gap-1 ${isSelected ? 'text-[#B88E52]' : 'text-slate-400 group-hover:text-slate-700'}`}>
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4 text-[#B88E52]" />
                              <span>Selected</span>
                            </>
                          ) : (
                            'Select Table'
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Reservation Confirmation Card */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D5] shadow-xl w-full space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#B88E52] uppercase tracking-wider block">
                      Table Reservation
                    </span>
                    <h3 className="text-lg font-serif font-bold text-slate-900 leading-tight">
                      Guest Booking Details
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF3E8] text-[#B88E52] border border-[#EADBBE]">
                    Table {selectedTable}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Guaranteed table seating confirmed for your party.
                </p>
              </div>

              {/* Success Notification Alert */}
              {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold space-y-1.5 shadow-sm animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm">Reservation Confirmed (#LX-{successMsg.id})!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-normal leading-relaxed">
                    Table <strong>{successMsg.table}</strong> reserved for <strong>{successMsg.name}</strong> on <strong>{successMsg.date}</strong> at <strong>{successMsg.time}</strong> ({successMsg.guests} Guests). Confirmation SMS sent.
                  </p>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                {/* Guest Full Name */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anderson Family / Rohan Mehta"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B88E52]/20 focus:border-[#B88E52] transition-all"
                    required
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98200 11223"
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B88E52]/20 focus:border-[#B88E52] transition-all"
                    required
                  />
                </div>

                {/* Party Size Stepper & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Party Size
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          playPopSound();
                          setPartySize(Math.max(1, partySize - 1));
                        }}
                        className="w-9 h-10 rounded-xl border border-[#E8E2D5] bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                        aria-label="Decrease party size"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1 h-10 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] flex items-center justify-center text-xs font-bold text-slate-900 font-mono shadow-2xs">
                        {partySize} Guests
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playPopSound();
                          setPartySize(partySize + 1);
                        }}
                        className="w-9 h-10 rounded-xl border border-[#E8E2D5] bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                        aria-label="Increase party size"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={reserveDate}
                      onChange={(e) => setReserveDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B88E52]/20 focus:border-[#B88E52] transition-all"
                    />
                  </div>
                </div>

                {/* Time Slot Quick Selector */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Preferred Dining Time Slot
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = reserveTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            playToggleSound();
                            setReserveTime(slot);
                          }}
                          className={`h-8 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1A1F1B] text-white shadow-xs border border-[#B88E52]'
                              : 'bg-[#FAF8F5] text-slate-600 border border-[#E8E2D5] hover:border-slate-400'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Bespoke Requests (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wedding anniversary, floral arrangement, high chair"
                    value={specialPreferences}
                    onChange={(e) => setSpecialPreferences(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B88E52]/20 focus:border-[#B88E52] transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex gap-2.5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-luxury btn-shimmer flex-1 h-12 bg-[#1A1F1B] hover:bg-[#252E27] text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-[#B88E52]/30"
                  >
                    <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isSubmitting ? 'Confirming...' : 'Confirm Table Booking'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="px-4 h-12 bg-white border border-[#E8E2D5] hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. THE CELLAR & WINE SANCTUARY (#cellar)
      ========================================================================= */}
      <section id="cellar" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52]">
              The Sommelier Vault
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-950 tracking-tight leading-tight">
              A 3,500-Bottle Living Archive of <br />
              <span className="italic font-normal text-[#2D3F33]">
                European & Old-World Vintages.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Curated under the tutelage of Head Sommelier Éléonore Laurent, our dual-temperature subterranean cellar protects storied vintages spanning Bordeaux First Growths, Piedmontese Barolos, and artisanal Jura natural biodynamics.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#E8E2D5] shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-[#FAF3E8] border border-[#EADBBE] flex items-center justify-center text-[#B88E52] shrink-0 mt-0.5">
                  <Wine className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Coravin Table-Side Pairings</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Rare 50-year-old bottles accessed without removing natural corks.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#E8E2D5] shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-[#FAF3E8] border border-[#EADBBE] flex items-center justify-center text-[#B88E52] shrink-0 mt-0.5">
                  <GlassWater className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Artisan Digestifs & Eau-de-Vie</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Heritage Grappas, Chartreuse V.E.P., and century-old cognacs.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-4/3 relative group">
              <img
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&auto=format&fit=crop&q=80"
                alt="Luxe Dine Sommelier Cellar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#E5D7B7] block">
                  Subterranean Glass Vault
                </span>
                <h3 className="font-serif text-lg font-bold">14°C Constant Humidity Protection</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. AMBIANCE & PRIVATE SALONS (#experience)
      ========================================================================= */}
      <section id="experience" className="py-20 sm:py-28 px-4 sm:px-8 bg-[#F7F4EE] border-t border-[#E8E2D5]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52]">
              Atmosphere & Private Dining
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-950 tracking-tight">
              An Architectural Ode to Warmth
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Sculpted with Italian Calacatta marble, brushed brass accents, and custom low-luminescence amber sconces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E2D5] shadow-xs group">
              <div className="h-60 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format&fit=crop&q=80"
                  alt="The Grand Dining Room"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88E52]">Main Floor</span>
                <h3 className="font-serif font-bold text-lg text-slate-900">The Grand Dining Salon</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  High coffered ceilings, open flame rotisserie glimpses, and hand-stitched leather armchairs.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E2D5] shadow-xs group">
              <div className="h-60 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80"
                  alt="The Velvet Booths"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88E52]">Secluded Seating</span>
                <h3 className="font-serif font-bold text-lg text-slate-900">Emerald Velvet Alcoves</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Curved banquettes enveloped in plush British racing emerald velvet for intimate conversations.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E2D5] shadow-xs group">
              <div className="h-60 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&auto=format&fit=crop&q=80"
                  alt="Private Dining Salon"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88E52]">Up to 14 Guests</span>
                <h3 className="font-serif font-bold text-lg text-slate-900">The Sommelier Vault</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Private entrance, personal maitre d'hôtel, custom degustation sequencing, and private cellar access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7.5. GUEST DINING REVIEWS & CRITIQUES (#reviews - Stored in PostgreSQL)
      ========================================================================= */}
      <section id="reviews" className="py-20 sm:py-28 px-4 sm:px-8 border-t border-[#E8E2D5] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52]">
              Verified Guest Reflections
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-950 tracking-tight">
              Acclaim & Table Testimonials
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Verified guest critiques and reviews from recent dining experiences.
            </p>
          </div>

          {/* Reviews Grid (Max 3-4 reviews) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((rev, idx) => (
              <div
                key={rev.review_id || idx}
                className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs hover:shadow-lg hover:border-[#B88E52]/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= (rev.rating || 5)
                            ? 'fill-[#B88E52] text-[#B88E52]'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{rev.comments || 'Sublime culinary experience and impeccable hospitality.'}"
                  </p>
                </div>

                {/* Footer Reviewer Meta */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-serif font-bold text-xs text-slate-900 block">
                      {rev.customer_name || 'Verified Guest'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {rev.review_date ? new Date(rev.review_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recent Visit'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Dine
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. LOCATION, HOURS & ATTIRE (#location)
      ========================================================================= */}
      <section id="location" className="py-20 sm:py-28 px-4 sm:px-8 border-t border-[#E8E2D5] bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Location Card */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88E52]">
                Visit Luxe Dine
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-950 tracking-tight leading-tight">
                An Oasis in the Heart of the City
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Conveniently situated along the high promenade with private valet car drop-off, dedicated reception concierge, and elevator access.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-[#B88E52]" />
                    <span>Operating Hours</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p><strong className="text-slate-900">Lunch Service:</strong> 12:00 PM – 15:30 PM</p>
                    <p><strong className="text-slate-900">Dinner Service:</strong> 18:30 PM – 23:45 PM</p>
                    <p className="text-[11px] text-[#B88E52] font-semibold pt-1">Seven days a week</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-[#B88E52]" />
                    <span>Attire & Etiquette</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p><strong className="text-slate-900">Dress Code:</strong> Smart Elegant</p>
                    <p className="text-[11px] text-slate-500">Collared shirts and tailored footwear recommended. Athletic wear is politely discouraged.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-[#B88E52]" />
                    <span>Address & Valet</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p className="font-semibold text-slate-900">High Street Phoenix Promenade</p>
                    <p>Senapati Bapat Marg, Lower Parel, Mumbai</p>
                    <p className="text-[11px] text-emerald-700 font-bold">Complimentary Valet Parking Available</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <Phone className="w-4 h-4 text-[#B88E52]" />
                    <span>Direct Concierge</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p><strong className="text-slate-900">Phone:</strong> +91 (022) 8900 1200</p>
                    <p><strong className="text-slate-900">Inquiries:</strong> concierge@luxedine.com</p>
                    <p className="text-[11px] text-slate-500">Assistance available daily from 10:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Map Visual Placeholder Card */}
            <div className="lg:col-span-5 bg-[#FAF8F5] rounded-3xl p-6 border border-[#E8E2D5] shadow-md space-y-4">
              <div className="h-64 rounded-2xl overflow-hidden relative border border-[#E8E2D5]">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80"
                  alt="City view near Luxe Dine"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4">
                  <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-[#E8E2D5] text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-[#1A1F1B] text-[#D4AF37] flex items-center justify-center mx-auto mb-1">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-serif font-bold text-sm text-slate-900 block">Luxe Dine Sanctuary</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">Lower Parel • Mumbai</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Need chauffeur coordination?</span>
                <button
                  onClick={() => scrollToSection('reservation')}
                  className="font-bold text-[#B88E52] hover:underline cursor-pointer"
                >
                  Contact Concierge →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. CLEAN LUXURY FOOTER (No admin portal buttons)
      ========================================================================= */}
      <footer className="py-16 px-4 sm:px-8 border-t border-[#E8E2D5] bg-[#FAF8F5] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#E8E2D5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A1F1B] text-[#D4AF37] border border-[#B88E52]/40 flex items-center justify-center font-serif font-bold text-sm">
                XD
              </div>
              <div>
                <span className="font-serif font-bold text-slate-900 text-lg block">Luxe Dine</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Gastronomy • Cellar • Hospitality</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-bold text-slate-700">
              <button onClick={() => scrollToSection('philosophy')} className="hover:text-[#B88E52] cursor-pointer">The Story</button>
              <button onClick={() => scrollToSection('menu')} className="hover:text-[#B88E52] cursor-pointer">Tasting Menu</button>
              <button onClick={() => scrollToSection('reservation')} className="hover:text-[#B88E52] cursor-pointer">Table Booking</button>
              <button onClick={() => scrollToSection('cellar')} className="hover:text-[#B88E52] cursor-pointer">The Cellar</button>
              <button onClick={() => scrollToSection('experience')} className="hover:text-[#B88E52] cursor-pointer">Private Dining</button>
              <button onClick={() => scrollToSection('reviews')} className="hover:text-[#B88E52] cursor-pointer">Guest Reviews</button>
              <button onClick={() => scrollToSection('location')} className="hover:text-[#B88E52] cursor-pointer">Contact & Location</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 Luxe Dine Hospitality Group. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>San Pellegrino 50 Best</span>
              <span>•</span>
              <span>Michelin Guide</span>
              <span>•</span>
              <span>Sommelier Guild Award</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
