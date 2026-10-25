import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  ExternalLink,
  Printer,
  Check,
  X,
  Users,
  Smartphone,
  Sparkles,
  Utensils
} from 'lucide-react';

export default function TableQrModal({ table, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  if (!isOpen || !table) return null;

  // Resolve table number from table name/id (e.g. 'T-01' -> '101', 'T-02' -> '102', '102' -> '102')
  const getTableNumericId = (id) => {
    if (!id) return '102';
    const clean = id.toString().replace(/[^0-9]/g, '');
    if (clean.length === 1 || clean.length === 2) {
      return `10${clean.slice(-1)}`;
    }
    return clean || '102';
  };

  const tableNum = getTableNumericId(table.id || table.name);
  const lanIp = '192.168.29.69';
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const tableUrl = isLocalhost ? `http://${lanIp}:3000/?table=${tableNum}` : `${window.location.origin}/?table=${tableNum}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=25-45-35&bgcolor=240-244-248&data=${encodeURIComponent(
    tableUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMenu = () => {
    window.open(tableUrl, '_blank');
  };

  const handleSimulateGuests = (count = 2) => {
    // Open side-by-side guest windows to test real-time shared ordering!
    const width = 400;
    const height = 740;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        window.open(
          tableUrl,
          '_blank',
          `width=${width},height=${height},left=${50 + (i * 420)},top=80`
        );
      }, i * 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#475B4B] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                Table #{tableNum} QR Code
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Unique Customer Ordering Standee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Printable Table Tent Preview Card */}
          <div className="bg-[#F0F4F8] rounded-2xl p-5 border-2 border-dashed border-[#475B4B]/30 flex flex-col items-center text-center relative group">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-1.5 mb-2">
              <Utensils className="w-4 h-4 text-[#475B4B]" />
              <span className="font-serif font-bold text-[#3D5245] text-sm tracking-tight">
                Luxe Dine
              </span>
            </div>

            <div className="px-3 py-1 rounded-full bg-[#475B4B] text-white text-xs font-bold tracking-wide shadow-xs mb-3">
              Table #{tableNum}
            </div>

            {/* QR Code Container */}
            <div className="w-44 h-44 bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center relative">
              <img
                src={qrImageUrl}
                alt={`Table ${tableNum} QR Code`}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <p className="text-xs font-bold text-[#102A43] mt-3">
              Scan to View Menu & Order
            </p>
            <p className="text-[11px] text-[#627D98] mt-0.5 max-w-[240px]">
              Orders automatically sync between all guests seated at this table.
            </p>
          </div>

          {/* Real-time Order Share Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
            <Users className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold leading-tight">Shared Table Dining</p>
              <p className="text-[11px] text-emerald-700/90 mt-0.5">
                If 2 or more people scan this same QR code, any item added or sent to the kitchen instantly updates for everyone at Table #{tableNum}!
              </p>
            </div>
          </div>

          {/* Table URL Display & Copy */}
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-xs">
            <span className="font-mono text-slate-600 truncate flex-1 pl-1">
              {tableUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 shadow-2xs'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleOpenMenu}
              className="w-full bg-[#475B4B] hover:bg-[#3D5041] active:bg-[#324235] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Customer Menu (Table #{tableNum})</span>
            </button>

            <div className="pt-1 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Simulate Multi-Guest Shared Table (Live Sync):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSimulateGuests(2)}
                  className="bg-slate-100 hover:bg-[#475B4B] hover:text-white text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Open 2 side-by-side windows"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>2 Guests</span>
                </button>
                <button
                  onClick={() => handleSimulateGuests(3)}
                  className="bg-slate-100 hover:bg-[#475B4B] hover:text-white text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Open 3 side-by-side windows"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>3 Guests</span>
                </button>
                <button
                  onClick={() => handleSimulateGuests(4)}
                  className="bg-slate-100 hover:bg-[#475B4B] hover:text-white text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Open 4 side-by-side windows"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>4 Guests</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
