import React, { useState } from 'react';
import {
  Search,
  Wallet,
  ShoppingBag,
  Clock,
  UtensilsCrossed,
  Download,
  ArrowUpRight,
  ArrowDownRight
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

export default function ExecutiveAnalytics() {
  const [timeRange, setTimeRange] = useState('Week');
  const [searchQuery, setSearchQuery] = useState('');

  // Table items with interactive stock toggles
  const [dishes, setDishes] = useState([
    {
      id: 1,
      name: 'Truffle Risotto',
      category: 'Mains',
      profitMargin: 68,
      inStock: true,
      color: '#10B981'
    },
    {
      id: 2,
      name: 'Atlantic Salmon',
      category: 'Mains',
      profitMargin: 52,
      inStock: true,
      color: '#10B981'
    },
    {
      id: 3,
      name: 'Wagyu Beef Carpaccio',
      category: 'Starters',
      profitMargin: 75,
      inStock: false,
      color: '#10B981'
    },
    {
      id: 4,
      name: 'Artisan Burrata',
      category: 'Starters',
      profitMargin: 41,
      inStock: true,
      color: '#F59E0B'
    }
  ]);

  const toggleStock = (id) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, inStock: !d.inStock } : d))
    );
  };

  // Bar Chart Data matching Image 1 ($0, $5k, $10k, $15k)
  const barData = [
    { day: 'Mon', revenue: 4500 },
    { day: 'Tue', revenue: 7600 },
    { day: 'Wed', revenue: 3800 },
    { day: 'Thu', revenue: 10200 },
    { day: 'Fri', revenue: 13100 },
    { day: 'Sat', revenue: 14800 },
    { day: 'Sun', revenue: 8400 }
  ];

  // Donut Chart Data matching Image 1 (Mains 45%, Starters 30%, Drinks 15%, Desserts 10%)
  const donutData = [
    { name: 'Mains', value: 45, color: '#334155' },
    { name: 'Starters', value: 30, color: '#94A3B8' },
    { name: 'Drinks', value: 15, color: '#CBD5E1' },
    { name: 'Desserts', value: 10, color: '#E2E8F0' }
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Dish Name,Category,Profit Margin,Status']
        .concat(
          dishes.map(
            (d) =>
              `"${d.name}","${d.category}","${d.profitMargin}%","${
                d.inStock ? 'In Stock' : 'Out'
              }"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Bistro_BI_Dish_Margin_Stock.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDishes = dishes.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            Executive Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">
            Real-time performance metrics for Bistro BI.
          </p>
        </div>

        {/* Search bar with exact vertical centering */}
        <div className="relative w-full sm:w-64 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs font-medium leading-none"
          />
        </div>
      </div>

      {/* Top 4 KPI Cards with matched vertical heights and baselines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* TOTAL REVENUE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              TOTAL REVENUE
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
              $45,230
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 leading-none">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>+12.5%</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        {/* ORDERS PROCESSED */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              ORDERS PROCESSED
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
              1,240
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 leading-none">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>+8.2%</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        {/* AVG TURNAROUND */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              AVG TURNAROUND
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
              32m
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-rose-500 leading-none">
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>-2m</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        {/* TOP DISH */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              TOP DISH
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold tracking-tight text-slate-900 truncate leading-none" title="Truffle Risotto">
              Truffle Risot...
            </div>
            <div className="mt-2.5 flex items-center">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/70 text-slate-700 text-[11px] font-semibold leading-none">
                214 Orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Revenue Trend & Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Revenue Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 leading-none">Revenue Trend</h2>
            <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-lg p-0.5">
              {['Day', 'Week', 'Month'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeRange(tab)}
                  className={`h-7 px-3.5 flex items-center justify-center text-xs rounded-md transition-all leading-none ${
                    timeRange === tab
                      ? 'bg-black text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 font-semibold'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                  ticks={[0, 5000, 10000, 15000]}
                  tickFormatter={(val) => (val === 0 ? '$0' : `$${val / 1000}k`)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    borderColor: '#CBD5E1',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#D5E0F5" radius={[5, 5, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Donut Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 leading-none">Sales by Category</h2>
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
              <span className="text-2xl font-black text-slate-900 leading-tight">1,240</span>
              <span className="text-[11px] font-medium text-slate-400 leading-tight">Total Items</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5 text-xs pt-3 border-t border-slate-100">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-300 shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-slate-600 font-semibold leading-none">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800 leading-none">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Dish Margin & Stock */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <h2 className="text-base font-bold text-slate-900 leading-none">Dish Margin & Stock</h2>
          <button
            onClick={handleExportCSV}
            className="h-8 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="leading-none">Export CSV</span>
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[500px]">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-3 px-3">DISH NAME</th>
                <th className="py-3 px-3">CATEGORY</th>
                <th className="py-3 px-3">PROFIT MARGIN</th>
                <th className="py-3 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDishes.map((dish) => (
                <tr key={dish.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-3 font-bold text-slate-900">{dish.name}</td>
                  <td className="py-4 px-3 text-slate-500 font-medium">{dish.category}</td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50 shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${dish.profitMargin}%`,
                            backgroundColor: dish.color
                          }}
                        ></div>
                      </div>
                      <span className="text-slate-700 font-bold leading-none">{dish.profitMargin}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="inline-flex items-center justify-end gap-2.5">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleStock(dish.id)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer shadow-xs shrink-0 ${
                          dish.inStock ? 'bg-black' : 'bg-slate-300'
                        }`}
                        aria-label={`Toggle ${dish.name} stock`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                            dish.inStock ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span
                        className={`w-14 text-left text-xs font-bold leading-none ${
                          dish.inStock ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {dish.inStock ? 'In Stock' : 'Out'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
