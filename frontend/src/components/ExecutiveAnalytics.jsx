import React, { useState, useEffect } from 'react';
import {
  Search,
  Wallet,
  ShoppingBag,
  Clock,
  UtensilsCrossed,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
  Trash2,
  Edit2,
  Pencil,
  Save,
  Sparkles,
  RefreshCw
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
import { menuApi, reportsApi } from '../services/api';

export default function ExecutiveAnalytics() {
  const [timeRange, setTimeRange] = useState('Week');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in-stock' | 'out-of-stock'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'Mains' | 'Starters' | 'Desserts' | 'Drinks'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initial dishes list (augmented from PostgreSQL)
  const [dishes, setDishes] = useState([
    {
      id: 1,
      name: 'Truffle Risotto',
      category: 'Mains',
      price: 890,
      costPrice: 280,
      profitMargin: 68,
      prepTime: 22,
      inStock: true,
      color: '#10B981',
      description: 'Arborio rice cooked with black truffle butter, forest mushrooms, and aged Parmigiano Reggiano.'
    },
    {
      id: 2,
      name: 'Pan-Seared Sea Bass',
      category: 'Mains',
      price: 1450,
      costPrice: 520,
      profitMargin: 64,
      prepTime: 25,
      inStock: true,
      color: '#10B981',
      description: 'Glazed in lemon beurre blanc with asparagus spear emulsion.'
    },
    {
      id: 3,
      name: 'Wagyu Beef Carpaccio',
      category: 'Starters',
      price: 780,
      costPrice: 195,
      profitMargin: 75,
      prepTime: 14,
      inStock: false,
      color: '#10B981',
      description: 'Thinly sliced wagyu tenderloin, citrus vinaigrette, crisp shallots.'
    },
    {
      id: 4,
      name: 'Artisan Burrata',
      category: 'Starters',
      price: 690,
      costPrice: 407,
      profitMargin: 41,
      prepTime: 12,
      inStock: true,
      color: '#F59E0B',
      description: 'Handmade cream burrata, heirloom tomatoes, sourdough.'
    },
    {
      id: 5,
      name: 'NZ Lamb Shanks',
      category: 'Mains',
      price: 1250,
      costPrice: 480,
      profitMargin: 62,
      prepTime: 30,
      inStock: true,
      color: '#10B981',
      description: '12-hour braised shank in rosemary jus on potato mash.'
    },
    {
      id: 6,
      name: 'Valrhona Chocolate Fondant',
      category: 'Desserts',
      price: 520,
      costPrice: 140,
      profitMargin: 73,
      prepTime: 18,
      inStock: true,
      color: '#10B981',
      description: '70% French chocolate lava heart with vanilla gelato.'
    },
    {
      id: 7,
      name: 'Botanical Hibiscus Spritz',
      category: 'Drinks',
      price: 420,
      costPrice: 80,
      profitMargin: 81,
      prepTime: 8,
      inStock: true,
      color: '#10B981',
      description: 'Artisanal hibiscus reduction, rosemary smoke, tonic.'
    }
  ]);

  // Editing Dish State
  const [editingDish, setEditingDish] = useState({
    id: null,
    name: '',
    category: 'Mains',
    price: '',
    costPrice: '',
    prepTime: 15,
    inStock: true,
    description: ''
  });

  // New Dish Form State
  const [newDish, setNewDish] = useState({
    name: '',
    category: 'Mains',
    price: '',
    costPrice: '',
    prepTime: 15,
    inStock: true,
    description: ''
  });

  // Load from PostgreSQL API on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        const res = await menuApi.getAll();
        if (res && res.data && res.data.length > 0) {
          const mapped = res.data.map((item) => {
            const p = parseFloat(item.price) || 0;
            const c = parseFloat(item.cost_price || item.costPrice || p * 0.35);
            const m = p > 0 ? Math.round(((p - c) / p) * 100) : 50;
            const col = m >= 60 ? '#10B981' : m >= 40 ? '#F59E0B' : '#EF4444';
            return {
              id: item.menu_id || item.id,
              name: item.item_name || item.name,
              category: item.category || 'Mains',
              price: p,
              costPrice: c,
              profitMargin: m,
              prepTime: item.prep_time || item.prepTime || 15,
              inStock: item.in_stock !== undefined ? Boolean(item.in_stock) : true,
              color: col,
              description: item.description || ''
            };
          });
          setDishes(mapped);
        }
      } catch (err) {
        console.warn('Could not load menu items from PostgreSQL:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle in-stock / out-of-stock and persist to PostgreSQL
  const toggleStock = async (id) => {
    const current = dishes.find((d) => d.id === id);
    if (!current) return;
    const newStatus = !current.inStock;

    // Optimistic UI update
    setDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, inStock: newStatus } : d))
    );
    showToast(`${current.name} is now ${newStatus ? 'In Stock' : 'Out of Stock (86\'d)'}`);

    try {
      await menuApi.toggleStock(id, newStatus);
    } catch (err) {
      console.warn('Failed to update stock in PostgreSQL:', err.message);
    }
  };

  // Open Edit Modal with selected dish data
  const handleOpenEditModal = (dish) => {
    setEditingDish({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: dish.price,
      costPrice: dish.costPrice,
      prepTime: dish.prepTime,
      inStock: Boolean(dish.inStock),
      description: dish.description || ''
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Dish to PostgreSQL
  const handleEditDishSubmit = async (e) => {
    e.preventDefault();
    if (!editingDish.name.trim() || !editingDish.id) return;

    const priceNum = parseFloat(editingDish.price) || 0;
    const costNum = parseFloat(editingDish.costPrice) || (priceNum * 0.35);
    const margin = priceNum > 0 ? Math.round(((priceNum - costNum) / priceNum) * 100) : 50;
    const color = margin >= 60 ? '#10B981' : margin >= 40 ? '#F59E0B' : '#EF4444';

    const updated = {
      ...editingDish,
      price: priceNum,
      costPrice: costNum,
      profitMargin: Math.max(0, Math.min(100, margin)),
      prepTime: parseInt(editingDish.prepTime, 10) || 15,
      color
    };

    // Optimistic UI update
    setDishes((prev) => prev.map((d) => (d.id === editingDish.id ? updated : d)));
    setIsEditModalOpen(false);
    showToast(`"${updated.name}" updated in PostgreSQL!`);

    try {
      await menuApi.update(editingDish.id, {
        item_name: updated.name,
        category: updated.category,
        price: updated.price,
        cost_price: updated.costPrice,
        prep_time: updated.prepTime,
        in_stock: updated.inStock,
        description: updated.description
      });
    } catch (err) {
      console.warn('Failed to update dish in PostgreSQL:', err.message);
    }
  };

  // Delete dish from PostgreSQL
  const handleDeleteDish = async (id, name) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
    showToast(`Removed "${name}" from menu`);

    try {
      await menuApi.delete(id);
    } catch (err) {
      console.warn('Failed to delete dish in PostgreSQL:', err.message);
    }
  };

  // Add new dish to PostgreSQL
  const handleAddDishSubmit = async (e) => {
    e.preventDefault();
    if (!newDish.name.trim()) return;

    const priceNum = parseFloat(newDish.price) || 0;
    const costNum = parseFloat(newDish.costPrice) || (priceNum * 0.35);
    const margin = priceNum > 0 ? Math.round(((priceNum - costNum) / priceNum) * 100) : 50;
    const color = margin >= 60 ? '#10B981' : margin >= 40 ? '#F59E0B' : '#EF4444';

    const tempId = Date.now();
    const createdDish = {
      id: tempId,
      name: newDish.name.trim(),
      category: newDish.category,
      price: priceNum,
      costPrice: costNum,
      profitMargin: Math.max(0, Math.min(100, margin)),
      prepTime: parseInt(newDish.prepTime, 10) || 15,
      inStock: Boolean(newDish.inStock),
      color: color,
      description: newDish.description.trim()
    };

    setDishes((prev) => [createdDish, ...prev]);
    setIsAddModalOpen(false);
    setNewDish({
      name: '',
      category: 'Mains',
      price: '',
      costPrice: '',
      prepTime: 15,
      inStock: true,
      description: ''
    });
    showToast(`"${createdDish.name}" saved to PostgreSQL!`);

    try {
      const res = await menuApi.add({
        item_name: createdDish.name,
        category: createdDish.category,
        price: createdDish.price,
        cost_price: createdDish.costPrice,
        prep_time: createdDish.prepTime,
        in_stock: createdDish.inStock,
        description: createdDish.description
      });
      if (res && res.data && res.data.menu_id) {
        setDishes((prev) =>
          prev.map((d) => (d.id === tempId ? { ...d, id: res.data.menu_id } : d))
        );
      }
    } catch (err) {
      console.warn('Failed to insert dish in PostgreSQL:', err.message);
    }
  };

  // Interactive Bar Chart Data based on timeRange button ('Day' | 'Week' | 'Month')
  const barDataByRange = {
    Day: [
      { day: '12 PM', revenue: 1800 },
      { day: '2 PM', revenue: 3200 },
      { day: '4 PM', revenue: 1400 },
      { day: '6 PM', revenue: 4100 },
      { day: '8 PM', revenue: 6800 },
      { day: '10 PM', revenue: 5200 }
    ],
    Week: [
      { day: 'Mon', revenue: 4500 },
      { day: 'Tue', revenue: 7600 },
      { day: 'Wed', revenue: 3800 },
      { day: 'Thu', revenue: 10200 },
      { day: 'Fri', revenue: 13100 },
      { day: 'Sat', revenue: 14800 },
      { day: 'Sun', revenue: 8400 }
    ],
    Month: [
      { day: 'Week 1', revenue: 32400 },
      { day: 'Week 2', revenue: 41800 },
      { day: 'Week 3', revenue: 38200 },
      { day: 'Week 4', revenue: 46900 }
    ]
  };
  const barData = barDataByRange[timeRange] || barDataByRange.Week;

  // Donut Chart Data (Mains 45%, Starters 30%, Drinks 15%, Desserts 10%)
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

  const filteredDishes = dishes.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'in-stock'
        ? d.inStock
        : !d.inStock;
    const matchesCategory =
      categoryFilter === 'all' ? true : d.category === categoryFilter;

    return matchesSearch && matchesStock && matchesCategory;
  });

  const totalInStock = dishes.filter((d) => d.inStock).length;
  const totalOutOfStock = dishes.filter((d) => !d.inStock).length;

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

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bottom Table: Dish Margin & Stock */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">Dish Margin & Stock</h2>
              <p className="text-[11px] text-slate-500 mt-1">Real-time inventory toggling & dish profitability.</p>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                {totalInStock} In Stock
              </span>
              {totalOutOfStock > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  {totalOutOfStock} 86'd Out
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="leading-none">Add New Dish</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="leading-none hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pb-1">
          {/* Stock status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                stockFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({dishes.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('in-stock')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                stockFilter === 'in-stock'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              In Stock ({totalInStock})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out-of-stock')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                stockFilter === 'out-of-stock'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Out of Stock ({totalOutOfStock})
            </button>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'Mains', 'Starters', 'Desserts', 'Drinks'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/70'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[550px]">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-3 px-3">DISH NAME</th>
                <th className="py-3 px-3">CATEGORY</th>
                <th className="py-3 px-3">PROFIT MARGIN</th>
                <th className="py-3 px-3 text-right">IN STOCK / 86'D</th>
                <th className="py-3 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDishes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No dishes found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dish.name}</span>
                        {dish.price > 0 && (
                          <span className="text-[11px] text-slate-400 font-mono font-medium">
                            ₹{dish.price}
                          </span>
                        )}
                        {dish.prepTime && (
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100">
                            ⏱ {dish.prepTime}m
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]">
                        {dish.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50 shrink-0">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${dish.profitMargin}%`,
                              backgroundColor: dish.color
                            }}
                          ></div>
                        </div>
                        <span className="text-slate-700 font-bold leading-none font-mono">
                          {dish.profitMargin}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center justify-end gap-2.5">
                        {/* Interactive Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => toggleStock(dish.id)}
                          className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer shadow-xs shrink-0 ${
                            dish.inStock ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          aria-label={`Toggle ${dish.name} stock`}
                          title={dish.inStock ? 'Click to mark Out of Stock (86)' : 'Click to mark In Stock'}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                              dish.inStock ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`w-16 text-left text-xs font-bold leading-none select-none ${
                            dish.inStock ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {dish.inStock ? 'In Stock' : 'Out (86)'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(dish)}
                          className="text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                          title={`Edit ${dish.name} & stock`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDish(dish.id, dish.name)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Delete dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Dish */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200/90 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add New Menu Dish</h3>
                  <p className="text-[11px] text-slate-400">Specify pricing, category, and initial inventory state.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDishSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Dish Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pan-Roasted Duck Breast"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  >
                    <option value="Mains">Mains</option>
                    <option value="Starters">Starters</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Est. Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newDish.prepTime}
                    onChange={(e) => setNewDish({ ...newDish, prepTime: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 750"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Cost Price / Food Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 240"
                    value={newDish.costPrice}
                    onChange={(e) => setNewDish({ ...newDish, costPrice: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Real-time Margin Preview */}
              {newDish.price && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Estimated Margin:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {Math.round(
                      ((parseFloat(newDish.price) - (parseFloat(newDish.costPrice) || parseFloat(newDish.price) * 0.35)) /
                        parseFloat(newDish.price)) *
                        100
                    )}
                    %
                  </span>
                </div>
              )}

              {/* Initial Stock Toggle in Add Form */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Initial Stock Status</span>
                  <span className="text-[11px] text-slate-500">Available immediately for ordering upon creation.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewDish({ ...newDish, inStock: !newDish.inStock })}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer shadow-xs shrink-0 ${
                    newDish.inStock ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                      newDish.inStock ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, dietary notes or allergen warnings..."
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Dish to Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dish Modal with In Stock / Out of Stock Option */}
      {isEditModalOpen && editingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200/90 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Edit Dish & Stock Status</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Update item details and toggle live stock availability.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditDishSubmit} className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Mushroom Tagliatelle"
                  value={editingDish.name}
                  onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                />
              </div>

              {/* Stock Status Selector (Requested by user: In Stock / Out of Stock selector) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Stock Availability Status</label>
                <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setEditingDish({ ...editingDish, inStock: true })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      editingDish.inStock
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>In Stock (Available)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDish({ ...editingDish, inStock: false })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      !editingDish.inStock
                        ? 'bg-white text-rose-700 shadow-sm border border-rose-200 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Out of Stock (86'd)</span>
                  </button>
                </div>
              </div>

              {/* Category & Prep Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={editingDish.category}
                    onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  >
                    <option value="Mains">Mains</option>
                    <option value="Starters">Starters</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Est. Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    value={editingDish.prepTime}
                    onChange={(e) => setEditingDish({ ...editingDish, prepTime: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Price & Cost Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Menu Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 580"
                    value={editingDish.price}
                    onChange={(e) => setEditingDish({ ...editingDish, price: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 240"
                    value={editingDish.costPrice}
                    onChange={(e) => setEditingDish({ ...editingDish, costPrice: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Estimated Margin Indicator */}
              {editingDish.price && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Estimated Margin:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {Math.round(
                      ((parseFloat(editingDish.price) - (parseFloat(editingDish.costPrice) || parseFloat(editingDish.price) * 0.35)) /
                        parseFloat(editingDish.price)) *
                        100
                    )}
                    %
                  </span>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, dietary notes or allergen warnings..."
                  value={editingDish.description}
                  onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Dish & Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
