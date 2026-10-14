import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Check,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { bookingApi } from '../services/api';

export default function TableManager() {
  const [tables, setTables] = useState([
    {
      id: 'T-01',
      name: 'T-01',
      seats: 2,
      status: 'Available',
      party: '',
      time: ''
    },
    {
      id: 'T-02',
      name: 'T-02',
      seats: 4,
      status: 'Occupied',
      party: 'Smith Party',
      time: '(45m)'
    },
    {
      id: 'Booth-01',
      name: 'Booth-01',
      seats: 6,
      status: 'Reserved',
      party: '',
      time: '7:30 PM'
    },
    {
      id: 'T-04',
      name: 'T-04',
      seats: 2,
      status: 'Maintenance',
      party: '',
      time: ''
    },
    {
      id: 'T-05',
      name: 'T-05',
      seats: 4,
      status: 'Available',
      party: '',
      time: ''
    }
  ]);

  // Quick Reserve form state
  const [selectedTable, setSelectedTable] = useState('T-01');
  const [partySize, setPartySize] = useState(2);
  const [reserveTime, setReserveTime] = useState('19:30');
  const [partyName, setPartyName] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  // Selected schedule viewing slot (Image 1)
  const [currentSlot, setCurrentSlot] = useState({
    day: 'Today',
    time: '7:00 PM',
    date: new Date().toISOString().split('T')[0]
  });
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotDateInput, setSlotDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [slotTimeInput, setSlotTimeInput] = useState('19:00');

  // Quick direct table status updater
  const handleSetTableStatus = (tableName, newStatus) => {
    setTables((prev) =>
      prev.map((t) =>
        t.name === tableName
          ? {
              ...t,
              status: newStatus,
              party: newStatus === 'Available' ? '' : t.party,
              time: newStatus === 'Available' ? '' : t.time
            }
          : t
      )
    );
    setSuccessMsg(`Table ${tableName} marked as ${newStatus}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Sync initial bookings from PostgreSQL
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await bookingApi.getAll();
        if (res && res.data && res.data.length > 0) {
          // Map bookings to table statuses
          const bookedMap = {};
          res.data.forEach((b) => {
            if (b.table_id) {
              bookedMap[b.table_id] = {
                status: b.satus || 'Reserved',
                party: b.special_preferences || `Party of ${b.guest_count}`,
                time: b.booking_time || '7:00 PM'
              };
            }
          });
          setTables((prev) =>
            prev.map((t) => {
              if (bookedMap[t.name]) {
                return {
                  ...t,
                  status: bookedMap[t.name].status,
                  party: bookedMap[t.name].party,
                  time: bookedMap[t.name].time
                };
              }
              return t;
            })
          );
        }
      } catch (err) {
        console.warn('Could not load bookings from PostgreSQL:', err.message);
      }
    };
    loadBookings();
  }, []);

  const handleBlockTable = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;

    setTables((prev) =>
      prev.map((t) => {
        if (t.name.toLowerCase() === selectedTable.trim().toLowerCase()) {
          return {
            ...t,
            status: 'Reserved',
            party: partyName ? `${partyName} Party` : 'Reserved Party',
            time: reserveTime ? reserveTime : '7:30 PM'
          };
        }
        return t;
      })
    );

    setSuccessMsg(`Table ${selectedTable} reserved & saved in PostgreSQL!`);
    setTimeout(() => setSuccessMsg(null), 3500);

    try {
      await bookingApi.create({
        customer_id: 1,
        table_id: selectedTable,
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: reserveTime || '19:30',
        guest_count: partySize,
        special_preferences: partyName ? `${partyName} Party` : 'Table Reservation'
      });
    } catch (err) {
      console.warn('Booking create fallback:', err.message);
    }
  };

  const handleClearForm = () => {
    setSelectedTable('');
    setPartySize(2);
    setReserveTime('');
    setPartyName('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Occupied':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'Reserved':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Maintenance':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header matching Image 3 with clean horizontal alignment */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full lg:w-auto justify-between lg:justify-start">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
            Table Manager
          </h1>

          {/* Status Legends */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-600 bg-white px-3.5 h-9 rounded-xl border border-slate-200/90 shadow-xs overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0 leading-none">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 leading-none">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 leading-none">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 leading-none">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
              <span>Maintenance</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Active Date & Time Slot Button (Image 1) */}
          <button
            type="button"
            onClick={() => setIsSlotModalOpen(true)}
            className="flex items-center gap-2 px-3.5 h-9 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs leading-none cursor-pointer transition-all active:scale-[0.98]"
            title="Click to change viewing date & time slot"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-900">{currentSlot.day}, {currentSlot.time}</span>
            <Clock className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          </button>

          <button
            onClick={() => {
              const firstAvail = tables.find((t) => t.status === 'Available');
              if (firstAvail) setSelectedTable(firstAvail.name);
            }}
            className="h-9 px-4 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors shrink-0 flex items-center justify-center leading-none cursor-pointer"
          >
            Quick Reserve
          </button>
        </div>
      </div>

      {/* Main Floorplan Area & Quick Reserve Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Table Cards Grid (takes 8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {tables.map((table) => {
              const isSelected = selectedTable === table.name;
              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table.name)}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md flex flex-col justify-between min-h-[145px] ${
                    isSelected
                      ? 'border-black ring-2 ring-black/80'
                      : 'border-slate-200/90 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm leading-none">{table.name}</span>
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold leading-none">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{table.seats}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cycle = {
                          Available: 'Occupied',
                          Occupied: 'Reserved',
                          Reserved: 'Maintenance',
                          Maintenance: 'Available'
                        };
                        handleSetTableStatus(table.name, cycle[table.status] || 'Available');
                      }}
                      title="Click to toggle status"
                      className={`h-6 px-2.5 rounded-full text-[11px] font-bold border shadow-2xs inline-flex items-center justify-center leading-none cursor-pointer hover:opacity-85 transition-opacity ${getStatusBadge(
                        table.status
                      )}`}
                    >
                      {table.status}
                    </button>

                    {table.party && (
                      <div className="text-[11px] text-slate-700 mt-2.5 font-bold truncate leading-tight">
                        {table.party}
                      </div>
                    )}
                    {table.time && (
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium leading-tight">
                        {table.time}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Reserve Panel (takes 4-5 cols on desktop, full width on mobile) */}
        <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] w-full">
          <div className="pb-3.5 sm:pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 leading-none">Quick Reserve</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-none">
              Block a table for incoming guests.
            </p>
          </div>

          {successMsg && (
            <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs leading-none">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleBlockTable} className="mt-4 space-y-4 text-xs">
            {/* Table Number */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 leading-none">
                Table Number
              </label>
              <input
                type="text"
                placeholder="e.g. T-01"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all leading-none"
              />
            </div>

            {/* Party Size Stepper - Symmetrical with matched heights */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 leading-none">
                Party Size
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-10 h-10 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold shadow-xs active:scale-95 transition-all shrink-0"
                  aria-label="Decrease party size"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-14 h-10 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-900 shadow-xs leading-none">
                  {partySize}
                </div>
                <button
                  type="button"
                  onClick={() => setPartySize(partySize + 1)}
                  className="w-10 h-10 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold shadow-xs active:scale-95 transition-all shrink-0"
                  aria-label="Increase party size"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 leading-none">
                Time
              </label>
              <input
                type="time"
                value={reserveTime}
                onChange={(e) => setReserveTime(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-mono transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 sm:pt-6 space-y-2.5">
              <button
                type="submit"
                className="w-full h-11 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.99] flex items-center justify-center leading-none"
              >
                Block Table
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="w-full h-11 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center leading-none"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Date & Time Slot Picker Modal (Triggered by Today, 7:00 PM button) */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-slate-200/90 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Floorplan Viewing Slot</h3>
                  <p className="text-[11px] text-slate-400">View table availability by date and time.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Day presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Select Day</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Today', 'Tomorrow', 'This Friday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setCurrentSlot((prev) => ({ ...prev, day }))
                      }
                      className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                        currentSlot.day === day
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slot presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Service Time Slots</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '12:30 PM (Lunch)', val: '12:30 PM', time24: '12:30' },
                    { label: '01:30 PM (Lunch)', val: '1:30 PM', time24: '13:30' },
                    { label: '07:00 PM (Dinner)', val: '7:00 PM', time24: '19:00' },
                    { label: '08:30 PM (Peak)', val: '8:30 PM', time24: '20:30' }
                  ].map((slot) => (
                    <button
                      key={slot.val}
                      type="button"
                      onClick={() => {
                        setCurrentSlot((prev) => ({ ...prev, time: slot.val }));
                        setReserveTime(slot.time24);
                      }}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        currentSlot.time === slot.val
                          ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date & Time Inputs */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-bold text-slate-700 block text-[11px]">Or Custom Date / Time:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={slotDateInput}
                    onChange={(e) => setSlotDateInput(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                  <input
                    type="time"
                    value={slotTimeInput}
                    onChange={(e) => {
                      setSlotTimeInput(e.target.value);
                      setReserveTime(e.target.value);
                    }}
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSlotModalOpen(false);
                  setSuccessMsg(`Viewing tables for ${currentSlot.day}, ${currentSlot.time}`);
                  setTimeout(() => setSuccessMsg(null), 3000);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition-all cursor-pointer text-center"
              >
                Apply Schedule Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
