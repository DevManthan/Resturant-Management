import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  BookOpen,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  X,
  Save,
  Check,
  Eye,
  DollarSign
} from 'lucide-react';
import { menuApi } from '../services/api';
import { playClickSound, playSuccessSound, playPopSound } from '../utils/sound';

const CATEGORIES = ['All', 'Main Course', 'Starters', 'Desserts', 'Beverages'];

export default function MenuCatalog() {
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in-stock' | 'out-of-stock'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Dish Form
  const [newDish, setNewDish] = useState({
    item_name: '',
    category: 'Main Course',
    price: '',
    cost_price: '',
    prep_time: 15,
    in_stock: true,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    description: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all menu items from PostgreSQL backend
  const fetchCatalog = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await menuApi.getAll();
      if (res && res.data && Array.isArray(res.data)) {
        setDishes(res.data);
      }
      if (!silent) showToast('Menu catalog updated!');
    } catch (err) {
      console.warn('Could not load menu items:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog(true);
  }, []);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      // Category filter (normalizing Main Course / Mains and Beverages / Drinks)
      let matchesCat = true;
      if (selectedCategory !== 'All') {
        const dishCat = (dish.category || '').toLowerCase();
        const selCat = selectedCategory.toLowerCase();
        if (selCat === 'main course' || selCat === 'mains') {
          matchesCat = dishCat.includes('main');
        } else if (selCat === 'beverages' || selCat === 'drinks') {
          matchesCat = dishCat.includes('bev') || dishCat.includes('drink');
        } else {
          matchesCat = dishCat === selCat;
        }
      }

      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'in-stock') matchesStock = Boolean(dish.in_stock);
      if (stockFilter === 'out-of-stock') matchesStock = !dish.in_stock;

      // Search query
      const query = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (query) {
        matchesSearch =
          (dish.item_name || '').toLowerCase().includes(query) ||
          (dish.description || '').toLowerCase().includes(query) ||
          (dish.category || '').toLowerCase().includes(query);
      }

      return matchesCat && matchesStock && matchesSearch;
    });
  }, [dishes, selectedCategory, stockFilter, searchQuery]);

  // Aggregate stats
  const totalDishes = dishes.length;
  const inStockCount = dishes.filter((d) => d.in_stock).length;
  const outOfStockCount = totalDishes - inStockCount;

  // Toggle in-stock status in PostgreSQL
  const handleToggleStock = async (dish) => {
    playClickSound();
    const newStatus = !dish.in_stock;

    // Optimistic UI update
    setDishes((prev) =>
      prev.map((d) =>
        (d.menu_id || d.id) === (dish.menu_id || dish.id)
          ? { ...d, in_stock: newStatus }
          : d
      )
    );

    showToast(`${dish.item_name} is now ${newStatus ? 'In Stock' : 'Out of Stock'}`);

    try {
      await menuApi.toggleStock(dish.menu_id || dish.id, newStatus);
    } catch (err) {
      console.warn('Failed to toggle stock in backend:', err.message);
    }
  };

  // Add new dish to PostgreSQL
  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!newDish.item_name || !newDish.price) return;
    playClickSound();

    try {
      const payload = {
        ...newDish,
        price: parseFloat(newDish.price),
        cost_price: parseFloat(newDish.cost_price || (newDish.price * 0.35)),
        prep_time: parseInt(newDish.prep_time, 10) || 15
      };

      const res = await menuApi.add(payload);
      playSuccessSound();
      showToast(`${newDish.item_name} added to menu!`);
      setIsAddModalOpen(false);
      setNewDish({
        item_name: '',
        category: 'Main Course',
        price: '',
        cost_price: '',
        prep_time: 15,
        in_stock: true,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        description: ''
      });
      fetchCatalog(true);
    } catch (err) {
      alert(`Could not add dish: ${err.message}`);
    }
  };

  // Edit dish in PostgreSQL
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDish) return;
    playClickSound();

    try {
      const payload = {
        ...editingDish,
        price: parseFloat(editingDish.price),
        cost_price: parseFloat(editingDish.cost_price || (editingDish.price * 0.35)),
        prep_time: parseInt(editingDish.prep_time, 10) || 15
      };

      await menuApi.update(editingDish.menu_id || editingDish.id, payload);
      playSuccessSound();
      showToast(`${editingDish.item_name} updated successfully!`);
      setIsEditModalOpen(false);
      setEditingDish(null);
      fetchCatalog(true);
    } catch (err) {
      alert(`Could not update dish: ${err.message}`);
    }
  };

  // Delete dish from PostgreSQL
  const handleDeleteDish = async (dish) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${dish.item_name}" from the menu?`)) {
      return;
    }
    playClickSound();

    try {
      await menuApi.delete(dish.menu_id || dish.id);
      playSuccessSound();
      showToast(`${dish.item_name} deleted.`);
      fetchCatalog(true);
    } catch (err) {
      alert(`Could not delete dish: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Menu & Dishes Catalog
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage restaurant menu items, live inventory stock status, profit margins, and chef prep SLAs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Dishes</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalDishes}</div>
          <span className="text-[11px] text-slate-500">Across 4 food & beverage categories</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">In Stock</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{inStockCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Ready to order table-side</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Out of Stock</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{outOfStockCount}</div>
          <span className="text-[11px] text-slate-500">Hidden from user order selection</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Average Prep SLA</span>
          <div className="text-2xl font-black text-blue-600 mt-1">18 <span className="text-sm font-bold text-slate-400">mins</span></div>
          <span className="text-[11px] text-slate-500">Live KDS priority kitchen benchmark</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name, description, ingredients..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stock Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                stockFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({totalDishes})
            </button>
            <button
              onClick={() => setStockFilter('in-stock')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                stockFilter === 'in-stock'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStockFilter('out-of-stock')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                stockFilter === 'out-of-stock'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Cards Grid */}
      {filteredDishes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No dishes match your selection</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting "All" categories, or add a new dish to your restaurant catalog.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStockFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDishes.map((dish) => {
            const price = parseFloat(dish.price) || 0;
            const cost = parseFloat(dish.cost_price || (price * 0.35));
            const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 60;
            const prepTime = dish.prep_time || 15;

            return (
              <div
                key={dish.menu_id || dish.id}
                className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                  dish.in_stock ? 'border-slate-200/90' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div>
                  {/* Dish Image Banner */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={
                        dish.image_url ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
                      }
                      alt={dish.item_name}
                      className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                        !dish.in_stock ? 'grayscale opacity-75' : ''
                      }`}
                    />

                    {/* Category badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight text-slate-800 shadow-xs">
                      {dish.category}
                    </div>

                    {/* Stock pill */}
                    <div
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight shadow-xs ${
                        dish.in_stock
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {dish.in_stock ? 'IN STOCK' : 'OUT OF STOCK'}
                    </div>
                  </div>

                  {/* Dish Info */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-1">
                        {dish.item_name}
                      </h3>
                      <div className="font-black text-base text-slate-900 shrink-0">
                        ₹{price.toFixed(0)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {dish.description || 'Prepared with farm-to-table seasonal artisanal ingredients.'}
                    </p>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Cost</span>
                        <span className="font-semibold text-slate-700">₹{cost.toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Margin</span>
                        <span className={`font-bold ${margin >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {margin}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Cook SLA</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {prepTime}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  {/* Stock Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(dish)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        dish.in_stock ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      aria-label="Toggle stock status"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          dish.in_stock ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {dish.in_stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingDish(dish);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Dish Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDish(dish)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD DISH MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Dish to Catalog</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={newDish.item_name}
                  onChange={(e) => setNewDish({ ...newDish, item_name: e.target.value })}
                  placeholder="e.g. Pan-Seared Chilean Sea Bass"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                    placeholder="850"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDish.cost_price}
                    onChange={(e) => setNewDish({ ...newDish, cost_price: e.target.value })}
                    placeholder="280"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    value={newDish.prep_time}
                    onChange={(e) => setNewDish({ ...newDish, prep_time: e.target.value })}
                    placeholder="20"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newDish.image_url}
                  onChange={(e) => setNewDish({ ...newDish, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  placeholder="Short description of ingredients, culinary heritage, or allergen advice..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold cursor-pointer shadow-xs"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT DISH MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingDish && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Edit Dish: {editingDish.item_name}</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={editingDish.item_name || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, item_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingDish.category || 'Main Course'}
                    onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingDish.price || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDish.cost_price || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, cost_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    value={editingDish.prep_time || 15}
                    onChange={(e) => setEditingDish({ ...editingDish, prep_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingDish.image_url || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingDish.description || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
