import React, { useState } from 'react';
import {
  Settings,
  Store,
  ShieldCheck,
  CheckCircle2,
  Percent,
  Clock,
  Phone,
  Mail,
  MapPin,
  Save
} from 'lucide-react';

export default function OwnerSettingsView({ ownerData, onSaveOwnerData }) {
  const [formData, setFormData] = useState({ ...ownerData });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveOwnerData(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <Settings className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Restaurant Settings & Configuration</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fiscal GST compliance, contact records, and kitchen SLA thresholds.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings Saved</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-xs">
          {/* Section 1: Business Identity */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              1. Commercial & Establishment Details
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Restaurant Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.RESTAURANT_NAME}
                  onChange={(e) => setFormData({ ...formData, RESTAURANT_NAME: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner / Licensee Name *</label>
                <input
                  type="text"
                  required
                  value={formData.OWNER_NAME}
                  onChange={(e) => setFormData({ ...formData, OWNER_NAME: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.EMAIL_ID}
                  onChange={(e) => setFormData({ ...formData, EMAIL_ID: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Helpline Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.PHONE_NO}
                  onChange={(e) => setFormData({ ...formData, PHONE_NO: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Physical Venue Address *</label>
                <input
                  type="text"
                  required
                  value={formData.ADDRESS}
                  onChange={(e) => setFormData({ ...formData, ADDRESS: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fiscal & GST Rules */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              2. Fiscal & GST Tax Specification (Split-Billing Engine)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory GST Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    disabled
                    value={formData.GST_RATE}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                    % Fixed
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Computed over aggregate subtotal to avoid rounding errors.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.GSTIN}
                  onChange={(e) => setFormData({ ...formData, GSTIN: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={formData.CURRENCY}
                  onChange={(e) => setFormData({ ...formData, CURRENCY: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kitchen Operations & SLA Escalation */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              3. Operational & Kitchen SLA Controls
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">SLA Delay Escalation Threshold</span>
                  <span className="font-mono text-xs font-bold text-brand-700">80% of Prep Time</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  When a kitchen ticket reaches 80% elapsed time without plating, it automatically triggers a high-priority alert and jumps to the top of the KDS queue.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Table Course Timing</span>
                  <span className="font-mono text-xs font-bold text-emerald-700">Dynamic FIFO</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  Items in the same customer ticket are automatically synchronized by longest prep time so dishes complete simultaneously.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
