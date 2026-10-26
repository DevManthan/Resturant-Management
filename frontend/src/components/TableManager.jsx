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
  Sparkles,
  UserCheck,
  Utensils,
  QrCode
} from 'lucide-react';
import { bookingApi } from '../services/api';
import TableQrModal from './TableQrModal';

const DEFAULT_TABLES = [
  { id: 'T-01', name: 'T-01', seats: 2, status: 'Available', party: '', time: '' },
  { id: 'T-02', name: 'T-02', seats: 4, status: 'Available', party: '', time: '' },
  { id: 'Booth-01', name: 'Booth-01', seats: 6, status: 'Available', party: '', time: '' },
  { id: 'T-04', name: 'T-04', seats: 2, status: 'Available', party: '', time: '' },
  { id: 'T-05', name: 'T-05', seats: 4, status: 'Available', party: '', time: '' },
  { id: 'Booth-02', name: 'Booth-02', seats: 8, status: 'Available', party: '', time: '' }
];

export default function TableManager() {
  const [qrModalTable, setQrModalTable] = useState(null);
  const [tables, setTables] = useState(() => {
    try {
      const saved = localStorage.getItem('luxedine_restaurant_tables');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_TABLES;
  });

  // Add Table Modal state
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableSection, setNewTableSection] = useState('Main Dining');

  const saveTablesState = (newTables) => {
    setTables(newTables);
    try {
      localStorage.setItem('luxedine_restaurant_tables', JSON.stringify(newTables));
      const channel = new BroadcastChannel('luxedine_tables_sync');
      channel.postMessage({ type: 'TABLES_STRUCTURE_CHANGED', tables: newTables });
      setTimeout(() => channel.close(), 1000);
    } catch (e) {}
  };

  const handleOpenAddTableModal = () => {
    const numbers = tables
      .map((t) => {
        const m = t.name.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = (Math.max(0, ...numbers) + 1).toString().padStart(2, '0');
    setNewTableName(`T-${nextNum}`);
    setNewTableSeats(4);
    setNewTableSection('Main Dining');
    setIsAddTableModalOpen(true);
  };

  const handleCreateNewTable = (e) => {
    if (e) e.preventDefault();
    const cleanName = (newTableName || '').trim();
    if (!cleanName) return;

    if (tables.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      setSuccessMsg(`Table "${cleanName}" already exists!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      return;
    }

    const newTableObj = {
      id: cleanName,
      name: cleanName,
      seats: parseInt(newTableSeats, 10) || 4,
      status: 'Available',
      party: '',
      time: '',
      section: newTableSection
    };

    const updated = [...tables, newTableObj];
    saveTablesState(updated);
    setSelectedTable(cleanName);
    setIsAddTableModalOpen(false);
    setSuccessMsg(`Table "${cleanName}" (${newTableSeats} seats) added to floorplan!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDeleteTable = (tableName) => {
    if (tables.length <= 1) return;
    const updated = tables.filter((t) => t.name !== tableName);
    saveTablesState(updated);
    setSelectedTable(updated[0]?.name || '');
    setSuccessMsg(`Table "${tableName}" removed from floorplan.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Quick Reserve form state
  const [selectedTable, setSelectedTable] = useState('Booth-01');
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

  // Keep track of latest bookings to update PostgreSQL status directly
  const latestBookingsRef = React.useRef([]);

  // Direct table status updater (e.g. Reserved -> Occupied, Occupied -> Available)
  const handleSetTableStatus = (tableName, newStatus) => {
    // 1. Find active non-completed booking for this table
    const activeBooking = latestBookingsRef.current.find(
      (b) => b.table_id === tableName && ['Confirmed', 'Reserved', 'Seated'].includes(b.status)
    );

    if (newStatus === 'Occupied') {
      if (activeBooking && (activeBooking.status === 'Confirmed' || activeBooking.status === 'Reserved')) {
        // Seating an existing confirmed reservation
        bookingApi.updateStatus(activeBooking.booking_id, 'Seated').catch(() => {});
      } else if (!activeBooking) {
        // Seating walk-in guests with no prior reservation
        const targetTable = tables.find((t) => t.name === tableName);
        bookingApi.create({
          table_id: tableName,
          customer_name: 'Walk-in Guests',
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          guest_count: targetTable?.seats || 2,
          status: 'Seated'
        }).catch(() => {});
      }
    } else if (newStatus === 'Available') {
      // Freeing table: complete active booking
      if (activeBooking && activeBooking.booking_id) {
        bookingApi.updateStatus(activeBooking.booking_id, 'Completed').catch(() => {});
      }
    } else if (newStatus === 'Maintenance') {
      if (activeBooking && activeBooking.booking_id) {
        bookingApi.updateStatus(activeBooking.booking_id, 'Cancelled').catch(() => {});
      }
    }

    setTables((prev) => {
      const updated = prev.map((t) => {
        if (t.name === tableName) {
          let updatedParty = '';
          let updatedTime = '';
          if (newStatus === 'Occupied') {
            if (t.status === 'Reserved' && t.party) {
              updatedParty = t.party;
            } else {
              updatedParty = `Walk-in Guests (${t.seats}p)`;
            }
            updatedTime = 'Seated just now';
          } else if (newStatus === 'Available') {
            updatedParty = '';
            updatedTime = '';
          } else if (newStatus === 'Reserved') {
            updatedParty = t.party || 'Reserved Party';
            updatedTime = currentSlot.time || '7:30 PM';
          } else if (newStatus === 'Maintenance') {
            updatedParty = '';
            updatedTime = 'Out of order';
          }
          return {
            ...t,
            status: newStatus,
            party: updatedParty,
            time: updatedTime
          };
        }
        return t;
      });
      try {
        localStorage.setItem('luxedine_restaurant_tables', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Broadcast table status change across tabs and landing page
    try {
      const channel = new BroadcastChannel('luxedine_tables_sync');
      channel.postMessage({
        type: 'TABLE_STATUS_CHANGED',
        table_id: tableName,
        status: newStatus
      });
      setTimeout(() => channel.close(), 1000);
      localStorage.setItem('luxedine_tables_updated', Date.now().toString());
    } catch (e) {}

    setSuccessMsg(`Table ${tableName} is now marked as "${newStatus}"!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Sync bookings from PostgreSQL and real-time events
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await bookingApi.getAll();
        if (res && res.data && res.data.length > 0) {
          latestBookingsRef.current = res.data;

          // Filter ONLY active reservations (Confirmed, Reserved, Seated). Completed/Cancelled are past history.
          const activeBookings = res.data.filter((b) =>
            ['Confirmed', 'Reserved', 'Seated'].includes(b.status)
          );

          const bookedMap = {};
          activeBookings.forEach((b) => {
            if (b.table_id && !bookedMap[b.table_id]) {
              if (b.status === 'Seated') {
                bookedMap[b.table_id] = {
                  status: 'Occupied',
                  party: b.customer_name ? `${b.customer_name} (${b.guest_count || 2}p)` : (b.special_preferences || `Party of ${b.guest_count}`),
                  time: b.booking_time ? `${b.booking_time}` : '7:00 PM',
                  bookingId: b.booking_id
                };
              } else {
                bookedMap[b.table_id] = {
                  status: 'Reserved',
                  party: b.customer_name ? `${b.customer_name} (${b.guest_count || 2}p)` : (b.special_preferences || `Party of ${b.guest_count}`),
                  time: b.booking_time ? `${b.booking_time}` : '7:00 PM',
                  bookingId: b.booking_id
                };
              }
            }
          });

          setTables((prev) => {
            const nextTables = prev.map((t) => {
              if (bookedMap[t.name]) {
                if (t.status === 'Maintenance' && bookedMap[t.name].status === 'Available') {
                  return t;
                }
                return {
                  ...t,
                  status: bookedMap[t.name].status,
                  party: bookedMap[t.name].party,
                  time: bookedMap[t.name].time
                };
              } else {
                // Table has NO active booking in PostgreSQL
                if (t.status === 'Maintenance') return t;
                // If it was previously marked Reserved or Occupied from an old completed booking, clear it!
                if (t.status === 'Reserved') {
                  return { ...t, status: 'Available', party: '', time: '' };
                }
                if (t.status === 'Available') {
                  return { ...t, party: '', time: '' };
                }
                return t;
              }
            });
            try {
              localStorage.setItem('luxedine_restaurant_tables', JSON.stringify(nextTables));
            } catch (e) {}
            return nextTables;
          });
        }
      } catch (err) {
        console.warn('Could not load bookings from PostgreSQL:', err.message);
      }
    };

    loadBookings();
    const interval = setInterval(loadBookings, 3000);

    let channel = null;
    try {
      channel = new BroadcastChannel('luxedine_tables_sync');
      channel.onmessage = (e) => {
        if (e.data && e.data.type === 'TABLE_RESERVED' && e.data.table_id) {
          setTables((prev) =>
            prev.map((t) => {
              if (t.name === e.data.table_id) {
                return {
                  ...t,
                  status: 'Reserved',
                  party: e.data.party || 'Reserved Party',
                  time: e.data.time || 'Upcoming'
                };
              }
              return t;
            })
          );
        } else if (e.data && e.data.type === 'TABLE_STATUS_CHANGED' && e.data.table_id) {
          setTables((prev) =>
            prev.map((t) => {
              if (t.name === e.data.table_id) {
                return {
                  ...t,
                  status: e.data.status,
                  party: e.data.status === 'Available' ? '' : t.party,
                  time: e.data.status === 'Available' ? '' : t.time
                };
              }
              return t;
            })
          );
        }
        loadBookings();
      };
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'luxedine_tables_updated') {
        loadBookings();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleBlockTable = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;

    const formattedParty = partyName ? `${partyName} (${partySize}p)` : 'Reserved Party';

    setTables((prev) =>
      prev.map((t) => {
        if (t.name.toLowerCase() === selectedTable.trim().toLowerCase()) {
          return {
            ...t,
            status: 'Reserved',
            party: formattedParty,
            time: reserveTime ? reserveTime : '7:30 PM'
          };
        }
        return t;
      })
    );

    setSuccessMsg(`Table ${selectedTable} reserved for ${partyName || 'Guest'}!`);
    setTimeout(() => setSuccessMsg(null), 3500);

    try {
      await bookingApi.create({
        customer_name: partyName || 'Reserved Guest',
        phone_no: '+91 98000 12345',
        table_id: selectedTable,
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: reserveTime || '19:30',
        guest_count: partySize,
        special_preferences: partyName ? `${partyName} Party` : 'Table Reservation'
      });
    } catch (err) {
      console.warn('Booking create fallback:', err.message);
    }

    try {
      const channel = new BroadcastChannel('luxedine_tables_sync');
      channel.postMessage({
        type: 'TABLE_RESERVED',
        table_id: selectedTable,
        status: 'Reserved',
        time: reserveTime || '19:30',
        party: formattedParty
      });
      setTimeout(() => channel.close(), 1000);
      localStorage.setItem('luxedine_tables_updated', Date.now().toString());
    } catch (e) {}
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

  const currentTable =
    tables.find((t) => t.name.toLowerCase() === (selectedTable || '').toLowerCase()) ||
    tables[0];

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
          {/* Active Date & Time Slot Button */}
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

      {/* Main Floorplan Area & Table Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Table Cards Grid (takes 7-8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {tables.map((table) => {
              const isSelected = selectedTable === table.name;
              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table.name)}
                  className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md flex flex-col justify-between min-h-[160px] ${
                    isSelected
                      ? 'border-black ring-2 ring-black/80'
                      : 'border-slate-200/90 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm leading-none">{table.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrModalTable(table);
                          }}
                          title={`View & Print QR Code for ${table.name}`}
                          className="p-1 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold leading-none">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{table.seats}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <span
                        className={`h-5 px-2 rounded-full text-[10px] font-bold border shadow-2xs inline-flex items-center justify-center leading-none ${getStatusBadge(
                          table.status
                        )}`}
                      >
                        {table.status}
                      </span>

                      {table.party && (
                        <div className="text-[11px] text-slate-700 mt-2 font-bold truncate leading-tight">
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

                  {/* 1-Click Action Button on Table Card */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    {table.status === 'Reserved' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTable(table.name);
                          handleSetTableStatus(table.name, 'Occupied');
                        }}
                        className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="Seat reserved party now (Mark Occupied)"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Seat Guests</span>
                      </button>
                    )}
                    {table.status === 'Occupied' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTable(table.name);
                          handleSetTableStatus(table.name, 'Available');
                        }}
                        className="w-full py-1.5 px-2 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="Free table / Guests left (Mark Available)"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Free Table</span>
                      </button>
                    )}
                    {table.status === 'Available' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTable(table.name);
                          handleSetTableStatus(table.name, 'Occupied');
                        }}
                        className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="Seat walk-in party (Mark Occupied)"
                      >
                        <Utensils className="w-3 h-3 text-slate-600" />
                        <span>Seat Now</span>
                      </button>
                    )}
                    {table.status === 'Maintenance' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTable(table.name);
                          handleSetTableStatus(table.name, 'Available');
                        }}
                        className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="Reopen Table (Mark Available)"
                      >
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* + Add Table Rectangle Block matching table card size */}
            <button
              type="button"
              onClick={handleOpenAddTableModal}
              className="group rounded-2xl p-4 border-2 border-dashed border-slate-300 hover:border-black bg-slate-50/70 hover:bg-white transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col items-center justify-center min-h-[160px] text-center gap-2.5 active:scale-[0.98]"
              title="Add a new dining table or booth to the floorplan"
            >
              <div className="w-11 h-11 rounded-full bg-white group-hover:bg-black group-hover:text-white text-slate-700 border border-slate-200 group-hover:border-black flex items-center justify-center transition-all shadow-xs">
                <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-800 group-hover:text-black block leading-tight">
                  Add Table
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Expand floorplan
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Right: Table Control & Quick Reserve Panel */}
        <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] w-full space-y-5">
          {/* Selected Table Info Header */}
          <div className="pb-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selected Table</span>
                <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {currentTable ? currentTable.name : selectedTable || 'Select a Table'}
                </h2>
              </div>
              {currentTable && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold bg-slate-100 px-2 py-1 rounded-lg">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentTable.seats} Seats</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(currentTable.status)}`}>
                    {currentTable.status}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Manage status or seat incoming guests in real-time.
            </p>
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs leading-none">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1-Click Status Switcher Tabs */}
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-xs leading-none">
              Quick Status Switcher
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { status: 'Available', color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300' },
                { status: 'Occupied', color: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300' },
                { status: 'Reserved', color: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300' },
                { status: 'Maintenance', color: 'hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300' }
              ].map(({ status, color }) => {
                const isActive = currentTable?.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleSetTableStatus(currentTable?.name || selectedTable, status)}
                    className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : `bg-slate-50 text-slate-700 border-slate-200 ${color}`
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'Available'
                          ? 'bg-emerald-500'
                          : status === 'Occupied'
                          ? 'bg-rose-500'
                          : status === 'Reserved'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    ></span>
                    <span>{status}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Action Card (High Visibility) */}
          {currentTable?.status === 'Reserved' && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Reserved Party: {currentTable.party || 'Guest'} ({currentTable.time || 'Upcoming'})</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Guests have arrived? Click below to immediately mark this table as Occupied.
              </p>
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSetTableStatus(currentTable.name, 'Occupied')}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Seat Guests (Mark Occupied)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTableStatus(currentTable.name, 'Available')}
                  className="px-3 h-10 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Cancel this reservation"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {currentTable?.status === 'Occupied' && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <Utensils className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Currently Dining: {currentTable.party || 'Guests'} ({currentTable.time || 'Active'})</span>
              </div>
              <button
                type="button"
                onClick={() => handleSetTableStatus(currentTable.name, 'Available')}
                className="w-full h-10 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Free Table (Mark Available)</span>
              </button>
            </div>
          )}

          {currentTable?.status === 'Available' && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Table {currentTable.name} is ready for guests</span>
              </div>
              <button
                type="button"
                onClick={() => handleSetTableStatus(currentTable.name, 'Occupied')}
                className="w-full h-10 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Seat Walk-in Party (Mark Occupied)</span>
              </button>
            </div>
          )}

          {/* Advance Reservation Form */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-3">Advance Reservation</h3>
            <form onSubmit={handleBlockTable} className="space-y-3.5 text-xs">
              {/* Table Number */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 leading-none">
                  Table Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. T-01"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all leading-none"
                />
              </div>

              {/* Guest / Party Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 leading-none">
                  Guest / Party Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anderson Family"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all leading-none"
                />
              </div>

              {/* Party Size Stepper & Time in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 leading-none">
                    Party Size
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPartySize(Math.max(1, partySize - 1))}
                      className="w-8 h-9 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                      aria-label="Decrease party size"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 h-9 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-900 shadow-xs leading-none">
                      {partySize}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPartySize(partySize + 1)}
                      className="w-8 h-9 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                      aria-label="Increase party size"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 leading-none">
                    Time
                  </label>
                  <input
                    type="time"
                    value={reserveTime}
                    onChange={(e) => setReserveTime(e.target.value)}
                    className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-mono transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-10 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.99] flex items-center justify-center leading-none cursor-pointer"
                >
                  Reserve Table
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-3 h-10 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center leading-none cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
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

      {/* Add New Table Modal */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Add New Dining Table
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Expand your luxury floorplan layout
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Table Name / Label
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. T-07, Booth-03, Rooftop-01"
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Seating Capacity (Guests)
                </label>
                <div className="flex items-center gap-2">
                  {[2, 4, 6, 8, 10].map((seats) => (
                    <button
                      key={seats}
                      type="button"
                      onClick={() => setNewTableSeats(seats)}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newTableSeats === seats
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {seats}p
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dining Section
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Main Dining', 'Private Booth', 'Terrace / Balcony', 'VIP Lounge'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setNewTableSection(sec)}
                      className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                        newTableSection === sec
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddTableModalOpen(false)}
                  className="flex-1 h-11 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl text-xs font-bold text-white bg-black hover:bg-slate-800 transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Table</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unique Table QR Modal */}
      <TableQrModal
        table={qrModalTable}
        isOpen={Boolean(qrModalTable)}
        onClose={() => setQrModalTable(null)}
      />
    </div>
  );
}
