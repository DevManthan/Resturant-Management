import React, { useState } from 'react';
import {
  Users,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { initialFloorplanStatus } from '../data/mockData';

export default function FloorplanOverview() {
  const [tables, setTables] = useState(initialFloorplanStatus);
  const [filter, setFilter] = useState('ALL');

  const totalCapacity = tables.reduce((acc, t) => acc + t.seats, 0);
  const occupiedSeats = tables
    .filter((t) => t.status === 'OCCUPIED' || t.status === 'BILLED')
    .reduce((acc, t) => acc + (t.guests || t.seats), 0);
  const occupancyPct = Math.round((occupiedSeats / totalCapacity) * 100);

  const activeTablesCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const billedTablesCount = tables.filter((t) => t.status === 'BILLED').length;
  const reservedTablesCount = tables.filter((t) => t.status === 'RESERVED').length;
  const availableTablesCount = tables.filter((t) => t.status === 'AVAILABLE').length;

  const filteredTables = tables.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OCCUPIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'BILLED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'AVAILABLE':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Floorplan Live KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Seat Occupancy Velocity</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{occupancyPct}% Active</div>
          <span className="text-xs text-slate-500 mt-1 block">{occupiedSeats} of {totalCapacity} covers seated</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Dining In-Progress</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{activeTablesCount} Tables</div>
          <span className="text-xs text-emerald-700 mt-1 block">Active dining & KDS tickets</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Payment & Bill Settling</span>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{billedTablesCount} Tables</div>
          <span className="text-xs text-indigo-700 mt-1 block">Ready for customer split-bill</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Upcoming Reservations</span>
          <div className="mt-2 text-2xl font-bold text-amber-600">{reservedTablesCount} Tables</div>
          <span className="text-xs text-amber-700 mt-1 block">{availableTablesCount} immediately ready</span>
        </div>
      </div>

      {/* 2D Floorplan Layout Grid */}
      <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Floorplan Table Grid (Main Dining Hall)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live synchronization with the staff tablet floorplan & KDS dispatch engine.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
            {['ALL', 'OCCUPIED', 'BILLED', 'RESERVED', 'AVAILABLE'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === s
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 2D Tables Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.tableId}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-card transition-all duration-200 flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Table #{table.tableId}</span>
                    <span className="text-[11px] text-slate-400 font-medium">({table.seats} Seats)</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                      table.status
                    )}`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {table.status === 'OCCUPIED' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Guests Seated:</span>
                        <span className="font-semibold text-slate-800">{table.guests} Covers</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Current Bill:</span>
                        <span className="font-bold text-emerald-600">₹{table.billTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Dining Duration:</span>
                        <span className="font-mono text-slate-700">{table.durationMin} mins</span>
                      </div>
                    </>
                  )}

                  {table.status === 'BILLED' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Final Bill:</span>
                        <span className="font-bold text-indigo-700">₹{table.billTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-indigo-600 font-semibold">Awaiting Payment</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <span className="font-mono text-slate-700">{table.durationMin} mins</span>
                      </div>
                    </>
                  )}

                  {table.status === 'RESERVED' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Reservation:</span>
                        <span className="font-bold text-amber-700">{table.reservationTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Party:</span>
                        <span className="font-semibold text-slate-800">{table.customer}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Expected Guests:</span>
                        <span className="font-semibold text-slate-800">{table.guests} Guests</span>
                      </div>
                    </>
                  )}

                  {table.status === 'AVAILABLE' && (
                    <div className="py-4 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-slate-300 mb-1"></span>
                      <span>Ready for walk-in / QR seating</span>
                    </div>
                  )}
                </div>
              </div>

              {table.waiter && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Server:</span>
                  <span className="font-medium text-slate-700">{table.waiter}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
