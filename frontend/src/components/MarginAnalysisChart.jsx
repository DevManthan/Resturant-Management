import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { PieChart as PieIcon, ArrowUpRight, TrendingUp, DollarSign } from 'lucide-react';

export default function MarginAnalysisChart({ menuItems }) {
  // Aggregate data by category
  const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages'];

  const categoryStats = categories.map((cat) => {
    const items = menuItems.filter((m) => m.CATEGORY === cat);
    const totalRevenueEst = items.reduce((sum, item) => sum + (item.PRICE * item.DAILY_SALES), 0);
    const totalCostEst = items.reduce((sum, item) => sum + (item.COST_PRICE * item.DAILY_SALES), 0);
    const grossProfit = totalRevenueEst - totalCostEst;
    const avgMarginPct = totalRevenueEst > 0 ? Math.round((grossProfit / totalRevenueEst) * 100) : 0;

    return {
      category: cat,
      revenue: totalRevenueEst,
      cost: totalCostEst,
      profit: grossProfit,
      marginPct: avgMarginPct,
      itemsCount: items.length,
      outOfStock: items.filter((i) => !i.IN_STOCK).length
    };
  });

  // Calculate highest margin item
  const sortedByMargin = [...menuItems].sort((a, b) => {
    const marginA = (a.PRICE - a.COST_PRICE) / a.PRICE;
    const marginB = (b.PRICE - b.COST_PRICE) / b.PRICE;
    return marginB - marginA;
  });

  const topMarginItem = sortedByMargin[0];
  const topMarginVal = topMarginItem
    ? Math.round(((topMarginItem.PRICE - topMarginItem.COST_PRICE) / topMarginItem.PRICE) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Top Margin Category</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">Beverages & Cocktails</span>
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              79% Avg Margin
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Low ingredient cost relative to premium mixology pricing.
          </p>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Highest Individual Margin</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 truncate max-w-[170px]" title={topMarginItem?.ITEM_NAME}>
              {topMarginItem?.ITEM_NAME}
            </span>
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {topMarginVal}%
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Price: ₹{topMarginItem?.PRICE} | COGS: ₹{topMarginItem?.COST_PRICE}
          </p>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Main Course Volume Contribution</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">₹1,09,870</span>
            <span className="text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
              62% Margin
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Primary gross volume driver across dinner reservations.
          </p>
        </div>
      </div>

      {/* Main Category-wise Margin Chart */}
      <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <PieIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Category-Wise Margin & COGS Breakdown</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Comparing daily estimated Gross Revenue (₹), Ingredient Cost (COGS ₹), and Profit Margin %
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-brand-500"></span>
              <span className="text-slate-600">Gross Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300"></span>
              <span className="text-slate-600">COGS (₹)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Margin %</span>
            </div>
          </div>
        </div>

        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={categoryStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="category" tick={{ fill: '#64748B', fontSize: 12 }} stroke="#E2E8F0" />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#64748B', fontSize: 12 }}
                stroke="#E2E8F0"
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fill: '#059669', fontSize: 12 }}
                stroke="#E2E8F0"
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
                  fontSize: '12px'
                }}
                formatter={(val, name) => {
                  if (name === 'Margin %') return [`${val}%`, name];
                  return [`₹${val.toLocaleString('en-IN')}`, name];
                }}
              />
              <Bar yAxisId="left" dataKey="revenue" name="Gross Revenue" fill="#B88E52" radius={[6, 6, 0, 0]} barSize={36} />
              <Bar yAxisId="left" dataKey="cost" name="COGS" fill="#CBD5E1" radius={[6, 6, 0, 0]} barSize={36} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="marginPct"
                name="Margin %"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 5, fill: '#059669' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Category Cards Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          {categoryStats.map((cat) => (
            <div key={cat.category} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{cat.category}</span>
                <span className="text-xs font-semibold text-slate-500">{cat.itemsCount} dishes</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Net Profit</span>
                  <div className="text-base font-bold text-slate-900">₹{cat.profit.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Margin</span>
                  <div className="text-base font-bold text-emerald-600">{cat.marginPct}%</div>
                </div>
              </div>
              {cat.outOfStock > 0 && (
                <div className="mt-2.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {cat.outOfStock} item(s) marked Out of Stock (86'd)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
