import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ShoppingBag,
  Clock,
  UtensilsCrossed,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  CreditCard,
  IndianRupee,
  Layers,
  Calendar,
  Utensils
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { reportsApi } from '../services/api';

export default function ExecutiveAnalytics() {
  const [timeRange, setTimeRange] = useState('Week');
  const [dishRange, setDishRange] = useState('Daily'); // 'Daily' | 'Weekly' | 'Monthly'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await reportsApi.getAnalytics({ range: timeRange });
      if (res && res.success && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch analytics from database:', err.message);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(false), 4000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const kpis = analyticsData?.kpis || {
    netRevenue: 0,
    totalOrders: 0,
    totalCovers: 0,
    avgTicketSize: 0,
    avgTableTurn: 38,
    topDish: { name: 'Alphonso Mango Saffron Lassi', count: 0, revenue: 0 }
  };

  const barData = analyticsData?.barDataByRange?.[timeRange] || [
    { day: 'Mon', revenue: 0 },
    { day: 'Tue', revenue: 0 },
    { day: 'Wed', revenue: 0 },
    { day: 'Thu', revenue: 0 },
    { day: 'Fri', revenue: 0 },
    { day: 'Sat', revenue: 0 },
    { day: 'Sun', revenue: kpis.netRevenue }
  ];

  const donutData = (analyticsData?.categoryBreakdown && analyticsData.categoryBreakdown.length > 0)
    ? analyticsData.categoryBreakdown
    : [
        { name: 'Drinks', value: 0, color: '#64748B', quantity: 0 },
        { name: 'Mains', value: 0, color: '#0F172A', quantity: 0 },
        { name: 'Starters', value: 0, color: '#334155', quantity: 0 },
        { name: 'Desserts', value: 0, color: '#94A3B8', quantity: 0 }
      ];

  const currentDishSales = analyticsData?.dishSalesByRange?.[dishRange] || [];
  const totalQuantitySoldInPeriod = currentDishSales.reduce((acc, d) => acc + (d.quantity_sold || 0), 0);
  const totalRevenueInPeriod = currentDishSales.reduce((acc, d) => acc + (d.total_revenue || 0), 0);
  const recentOrders = analyticsData?.recentOrders || [];
  const paymentBreakdown = analyticsData?.paymentBreakdown || { UPI: 0, Card: 0, Cash: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header Card with Real-time DB Sync Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Executive Analytics
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-Time Updates
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial performance, covers, table turnover velocity, and live department sales.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh & Time Range Selector */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-black' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1">
            {['Day', 'Week', 'Month'].map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeRange(tab)}
                className={`h-8 px-4 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-semibold ${
                  timeRange === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Row: 4 Real-time Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Net Revenue (Real from DB) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              NET REVENUE
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              ₹{kpis.netRevenue.toLocaleString('en-IN')}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md leading-none">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Live Revenue
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-none">
                Across {kpis.totalOrders} tickets
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Covers & Orders (Real from DB) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              TOTAL COVERS
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              {kpis.totalCovers} <span className="text-sm font-semibold text-slate-400">Guests</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md leading-none">
                {kpis.totalOrders} Active Orders
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-none">
                Dining covers
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Avg Table Turn & Ticket Size (Real from DB) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              AVG TICKET & TURN
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              ₹{kpis.avgTicketSize.toLocaleString('en-IN')}{' '}
              <span className="text-sm font-semibold text-slate-400">/ ticket</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md leading-none">
                ~{kpis.avgTableTurn} min
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-none">
                Average dining turn
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Top Performer Dish (Real from DB) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              TOP PERFORMER DISH
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div
              className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate leading-none"
              title={kpis.topDish?.name}
            >
              {kpis.topDish?.name || 'Chef Specialty'}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold leading-none">
                {kpis.topDish?.count || 0} orders
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-none">
                ₹{(kpis.topDish?.revenue || 0).toLocaleString('en-IN')} earned
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Revenue Trend & Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Revenue Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">Revenue Trend</h2>
              <p className="text-xs text-slate-400 mt-1">Aggregated intake across floor and mobile dining orders.</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {timeRange} View
            </span>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Donut Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">Sales by Category</h2>
              <p className="text-xs text-slate-400 mt-1">Real volume distribution</p>
            </div>
          </div>

          {/* Donut with Center Count */}
          <div className="relative h-48 flex items-center justify-center my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={2.5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 leading-tight">100%</span>
              <span className="text-[11px] font-medium text-slate-400 leading-tight">Total Volume</span>
            </div>
          </div>

          {/* Legend with Real Counts */}
          <div className="space-y-2.5 text-xs pt-3 border-t border-slate-100">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-slate-600 font-semibold leading-none">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">({item.quantity || 0} sold)</span>
                  <span className="font-bold text-slate-900 leading-none">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Dish Sales with 3 Settings: Daily, Weekly, Monthly */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 leading-none">
                Dish Sales & Volume Breakdown
              </h2>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {totalQuantitySoldInPeriod} Total Items Sold
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sales breakdown: Dish Name — Price — Quantity Sold ({dishRange.toLowerCase()} view)
            </p>
          </div>

          {/* 3 Settings: Daily, Weekly, Monthly */}
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 self-start sm:self-center">
            {['Daily', 'Weekly', 'Monthly'].map((setting) => (
              <button
                key={setting}
                type="button"
                onClick={() => setDishRange(setting)}
                className={`h-8 px-4 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-bold ${
                  dishRange === setting
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {setting}
              </button>
            ))}
          </div>
        </div>

        {currentDishSales.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No dishes sold during this {dishRange.toLowerCase()} period yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-bold">Dish Name</th>
                  <th className="pb-3 font-bold text-center">Category</th>
                  <th className="pb-3 font-bold text-center">Price</th>
                  <th className="pb-3 font-bold text-center">Quantity Sold</th>
                  <th className="pb-3 font-bold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDishSales.map((dish, idx) => (
                  <tr key={dish.menu_id || idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* Dish Name */}
                    <td className="py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        {dish.image_url ? (
                          <img
                            src={dish.image_url}
                            alt={dish.dish_name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Utensils className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                            {dish.dish_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                            Rank #{idx + 1}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {dish.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 text-center font-bold text-slate-900 text-sm">
                      ₹{dish.price.toLocaleString('en-IN')}
                    </td>

                    {/* Quantity Sold: e.g. "× 2" */}
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-slate-900 text-white shadow-2xs">
                        <span>× {dish.quantity_sold}</span>
                      </span>
                    </td>

                    {/* Total Revenue */}
                    <td className="py-3.5 text-right font-black text-slate-900 text-sm">
                      ₹{dish.total_revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
