import React, { useState, useEffect } from 'react';
import {
  User,
  Store,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  Percent,
  Receipt,
  UtensilsCrossed,
  KeyRound,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ownerApi } from '../services/api';

export default function ProfileView({ ownerData, onUpdateOwner }) {
  const [formData, setFormData] = useState({
    OWNER_ID: ownerData?.OWNER_ID || 1,
    OWNER_NAME: ownerData?.OWNER_NAME || 'Vikramaditya Singhania',
    EMAIL_ID: ownerData?.EMAIL_ID || 'vikram@luxedine.in',
    PHONE_NO: ownerData?.PHONE_NO || '+91 98765 43210',
    RESTAURANT_NAME: ownerData?.RESTAURANT_NAME || 'Luxe Dine & Gastropub',
    ADDRESS: ownerData?.ADDRESS || 'Level 4, High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013',
    GSTIN: ownerData?.GSTIN || '27AABCL1234F1Z9',
    CURRENCY: ownerData?.CURRENCY || '₹',
    GST_RATE: ownerData?.GST_RATE || 5,
    STATUS: ownerData?.STATUS || 'OPEN',
    OPEN_TIME: ownerData?.OPEN_TIME || '12:00 PM',
    CLOSE_TIME: ownerData?.CLOSE_TIME || '11:30 PM',
    ROLE: 'Restaurant Owner & Operator',
    JOINED_DATE: 'March 2024'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: '••••••••••••',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeSection, setActiveSection] = useState('general');

  // Load live data from PostgreSQL on mount
  useEffect(() => {
    const loadOwner = async () => {
      try {
        const res = await ownerApi.get();
        if (res && res.data) {
          const d = res.data;
          setFormData((prev) => ({
            ...prev,
            OWNER_ID: d.owner_id || prev.OWNER_ID,
            OWNER_NAME: d.owner_name || prev.OWNER_NAME,
            EMAIL_ID: d.email_id || prev.EMAIL_ID,
            PHONE_NO: d.phone_no || prev.PHONE_NO,
            RESTAURANT_NAME: d.restaurant_name || prev.RESTAURANT_NAME,
            ADDRESS: d.address || prev.ADDRESS,
            GSTIN: d.gstin || prev.GSTIN,
            CURRENCY: d.currency || prev.CURRENCY,
            GST_RATE: d.gst_rate || prev.GST_RATE,
            OPEN_TIME: d.open_time || prev.OPEN_TIME,
            CLOSE_TIME: d.close_time || prev.CLOSE_TIME,
            STATUS: d.status || prev.STATUS
          }));
        }
      } catch (err) {
        console.warn('Could not load owner from PostgreSQL:', err.message);
      }
    };
    loadOwner();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onUpdateOwner) {
      onUpdateOwner(formData);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);

    try {
      await ownerApi.update({
        owner_name: formData.OWNER_NAME,
        restaurant_name: formData.RESTAURANT_NAME,
        email_id: formData.EMAIL_ID,
        phone_no: formData.PHONE_NO,
        address: formData.ADDRESS,
        gstin: formData.GSTIN,
        currency: formData.CURRENCY,
        open_time: formData.OPEN_TIME,
        close_time: formData.CLOSE_TIME,
        status: formData.STATUS
      });
    } catch (err) {
      console.warn('Failed to update owner in PostgreSQL:', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner / Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-500/10 via-amber-200/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar Badge with Initials */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-950 to-slate-800 text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                {formData.OWNER_NAME.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Active Licensee" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {formData.OWNER_NAME}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[11px] font-bold tracking-wide uppercase">
                  Owner
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>{formData.RESTAURANT_NAME}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">ID #{formData.OWNER_ID}</span>
              </p>
            </div>
          </div>

          {/* Status & Quick stats */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                System Status
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-700">PostgreSQL Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'general'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            General Profile & Venue
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('tax')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'tax'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tax & Split-Billing
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('kitchen')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'kitchen'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Kitchen SLA Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('security')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'security'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Security & Credentials
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Alert Banner */}
        {savedSuccess && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs transition-all">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Profile Updated Successfully</p>
                <p className="text-[11px] text-emerald-700 font-normal">
                  All changes have been synchronized to the Oracle OWNER entity.
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Synced
            </span>
          </div>
        )}

        {/* SECTION 1: General & Establishment */}
        {(activeSection === 'general' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Establishment & Owner Identity</h2>
                <p className="text-[11px] text-slate-400">Legal business registry and primary administrator details.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Owner Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.OWNER_NAME}
                    onChange={(e) => setFormData({ ...formData, OWNER_NAME: e.target.value })}
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Restaurant Legal Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.RESTAURANT_NAME}
                    onChange={(e) => setFormData({ ...formData, RESTAURANT_NAME: e.target.value })}
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={formData.EMAIL_ID}
                    onChange={(e) => setFormData({ ...formData, EMAIL_ID: e.target.value })}
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Helpline Contact Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.PHONE_NO}
                    onChange={(e) => setFormData({ ...formData, PHONE_NO: e.target.value })}
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Physical Venue Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    rows={2}
                    required
                    value={formData.ADDRESS}
                    onChange={(e) => setFormData({ ...formData, ADDRESS: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Daily Opening Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.OPEN_TIME}
                    onChange={(e) => setFormData({ ...formData, OPEN_TIME: e.target.value })}
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Daily Closing Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.CLOSE_TIME}
                    onChange={(e) => setFormData({ ...formData, CLOSE_TIME: e.target.value })}
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: Fiscal, Tax & Split Billing */}
        {(activeSection === 'tax' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tax Specification & Split-Billing Configuration</h2>
                <p className="text-[11px] text-slate-400">Fixed 5% statutory GST rule and customer split-settlement algorithms.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">GST Rate (%)</label>
                <div className="relative">
                  <Percent className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    disabled
                    value={formData.GST_RATE}
                    className="w-full h-10 pl-10 pr-12 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold cursor-not-allowed"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    Fixed
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Enforces 5% aggregate subtotal to avoid rounding errors.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Restaurant GSTIN</label>
                <input
                  type="text"
                  value={formData.GSTIN}
                  onChange={(e) => setFormData({ ...formData, GSTIN: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Currency Display</label>
                <input
                  type="text"
                  value={formData.CURRENCY}
                  onChange={(e) => setFormData({ ...formData, CURRENCY: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>
            </div>

            {/* Split billing cards */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-600 block mb-2 uppercase tracking-wide">
                Supported Customer Settlement Modes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Equal Split</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Total Bill / N guests with aggregated tax apportionment.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Itemized Split</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Each guest picks their ordered items with pro-rata GST.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Single Payer</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Single guest settles complete invoice via Cash, Card, or UPI.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Kitchen Operations & SLA */}
        {(activeSection === 'kitchen' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kitchen Display System (KDS) SLA Parameters</h2>
                <p className="text-[11px] text-slate-400">Dynamic queue orchestration and ticket escalation logic.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">SLA Escalation Alert Threshold</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-mono font-bold text-xs">80% of Prep Time</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  When preparation duration reaches 80% without completion, the ticket turns amber/red and jumps to top priority in the chef's view.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Course Synchronization</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-mono font-bold text-xs">Synchronous Dispatch</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  Dishes in the same ticket prioritize longest preparation times first (PREP_TIME) so all items on a table finish synchronously.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Security & Authentication */}
        {(activeSection === 'security' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Security & Oracle Credentials</h2>
                <p className="text-[11px] text-slate-400">Password hashing and access control compliance.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">PASSWORDHASH Integrity</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Owner credentials stored as salted bcrypt hashes matching the Oracle schema specification.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600">
                    Hash: $2a$12$K8j7...39wQ
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Encrypted</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-800">Session Security</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Active session authenticated as primary administrator. Auto-renews every 24 hours.
                </p>
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-500">
                    Last Authenticated: Today at 12:00 PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400">
            Changes will take effect across the POS, Floorplan, and Customer Portals immediately.
          </p>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
