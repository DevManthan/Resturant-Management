import React, { useState } from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Tag,
  Edit2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

export default function StockToggleTable({
  menuItems,
  onToggleStock,
  onUpdateItem,
  onAddItem,
  onDeleteItem
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // New Item State
  const [newItem, setNewItem] = useState({
    ITEM_NAME: '',
    CATEGORY: 'Main Course',
    PRICE: '',
    COST_PRICE: '',
    PREP_TIME: 15,
    DISCOUNT: 0,
    IMAGEURL: '',
    DESCRIPTION: '',
    IN_STOCK: true
  });

  const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages'];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.CATEGORY === selectedCategory;
    const matchesSearch = item.ITEM_NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.CATEGORY.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalInStock = menuItems.filter((i) => i.IN_STOCK).length;
  const total86ed = menuItems.filter((i) => !i.IN_STOCK).length;
  const avgPrep = Math.round(menuItems.reduce((acc, i) => acc + i.PREP_TIME, 0) / (menuItems.length || 1));

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newItem.ITEM_NAME || !newItem.PRICE) return;

    onAddItem({
      ...newItem,
      MENU_ID: Date.now(),
      PRICE: parseFloat(newItem.PRICE),
      COST_PRICE: parseFloat(newItem.COST_PRICE || (newItem.PRICE * 0.35)),
      PREP_TIME: parseInt(newItem.PREP_TIME, 10),
      DISCOUNT: parseFloat(newItem.DISCOUNT || 0),
      DAILY_SALES: 0,
      IMAGEURL: newItem.IMAGEURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
    });

    setNewItem({
      ITEM_NAME: '',
      CATEGORY: 'Main Course',
      PRICE: '',
      COST_PRICE: '',
      PREP_TIME: 15,
      DISCOUNT: 0,
      IMAGEURL: '',
      DESCRIPTION: '',
      IN_STOCK: true
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Menu Catalog</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{menuItems.length} Dishes</div>
          <span className="text-xs text-slate-500 mt-1 block">Across 4 major categories</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Live In-Stock</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{totalInStock} Active</div>
          <span className="text-xs text-emerald-700 mt-1 block">Available on Customer QR Menus</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">86'd / Sold Out</span>
          <div className="mt-2 text-2xl font-bold text-rose-600">{total86ed} Unavailable</div>
          <span className="text-xs text-rose-700 mt-1 block">Instant-hidden from ordering</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Avg Kitchen Prep Time</span>
          <div className="mt-2 text-2xl font-bold text-brand-700">{avgPrep} mins</div>
          <span className="text-xs text-slate-500 mt-1 block">KDS Sequencing Baseline</span>
        </div>
      </div>

      {/* Control Bar & Filter */}
      <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dish or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>

        {/* Inventory / Stock Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Dish Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Menu Price</th>
                <th className="py-3 px-4">COGS & Margin</th>
                <th className="py-3 px-4">Prep SLA</th>
                <th className="py-3 px-4 text-center">86'd / Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map((item) => {
                const margin = Math.round(((item.PRICE - item.COST_PRICE) / item.PRICE) * 100);
                return (
                  <tr key={item.MENU_ID} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Dish name & thumb */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.IMAGEURL}
                          alt={item.ITEM_NAME}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
                          }}
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                            {item.ITEM_NAME}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[240px]">
                            {item.DESCRIPTION}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.CATEGORY}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ₹{item.PRICE}
                      {item.DISCOUNT > 0 && (
                        <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {item.DISCOUNT}% OFF
                        </span>
                      )}
                    </td>

                    {/* Margin */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">₹{item.COST_PRICE}</span>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            margin >= 70
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : margin >= 60
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {margin}%
                        </span>
                      </div>
                    </td>

                    {/* Prep SLA */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.PREP_TIME} mins</span>
                      </div>
                    </td>

                    {/* Stock Switch Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onToggleStock(item.MENU_ID)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                          item.IN_STOCK
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                        }`}
                        title="Click to toggle In-Stock or 86'd status"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.IN_STOCK ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span>{item.IN_STOCK ? 'In Stock' : '86’d (Sold Out)'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit Dish details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.MENU_ID)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-lg w-full p-6 shadow-dropdown border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Dish to Oracle Catalog</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Infused Lobster Bisque"
                  value={newItem.ITEM_NAME}
                  onChange={(e) => setNewItem({ ...newItem, ITEM_NAME: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newItem.CATEGORY}
                    onChange={(e) => setNewItem({ ...newItem, CATEGORY: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">KDS Prep SLA (Mins) *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={newItem.PREP_TIME}
                    onChange={(e) => setNewItem({ ...newItem, PREP_TIME: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Menu Price (₹) *</label>
                  <input
                    type="number"
                    step="10"
                    required
                    placeholder="950"
                    value={newItem.PRICE}
                    onChange={(e) => setNewItem({ ...newItem, PRICE: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">COGS / Cost (₹)</label>
                  <input
                    type="number"
                    step="10"
                    placeholder="300"
                    value={newItem.COST_PRICE}
                    onChange={(e) => setNewItem({ ...newItem, COST_PRICE: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newItem.DISCOUNT}
                    onChange={(e) => setNewItem({ ...newItem, DISCOUNT: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newItem.IMAGEURL}
                  onChange={(e) => setNewItem({ ...newItem, IMAGEURL: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Culinary Description</label>
                <textarea
                  rows="2"
                  placeholder="Garnished with edible flowers and aged balsamic drizzle..."
                  value={newItem.DESCRIPTION}
                  onChange={(e) => setNewItem({ ...newItem, DESCRIPTION: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl shadow-sm"
                >
                  Save to Oracle MENU_ITEMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-lg w-full p-6 shadow-dropdown border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Dish: {editingItem.ITEM_NAME}</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Menu Price (₹)</label>
                  <input
                    type="number"
                    value={editingItem.PRICE}
                    onChange={(e) => setEditingItem({ ...editingItem, PRICE: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">COGS / Cost Price (₹)</label>
                  <input
                    type="number"
                    value={editingItem.COST_PRICE}
                    onChange={(e) => setEditingItem({ ...editingItem, COST_PRICE: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prep SLA (Minutes)</label>
                  <input
                    type="number"
                    value={editingItem.PREP_TIME}
                    onChange={(e) => setEditingItem({ ...editingItem, PREP_TIME: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={editingItem.DISCOUNT}
                    onChange={(e) => setEditingItem({ ...editingItem, DISCOUNT: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateItem(editingItem);
                    setEditingItem(null);
                  }}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl shadow-sm"
                >
                  Apply Updates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
