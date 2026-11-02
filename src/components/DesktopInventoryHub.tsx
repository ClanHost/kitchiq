import React, { useState } from 'react';
import { InventoryItem, StorageLocation, Product } from '../types';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoveRight,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  Edit2,
  Calendar,
  Layers,
  CheckCircle2,
  Scan
} from 'lucide-react';

interface DesktopInventoryHubProps {
  inventory: InventoryItem[];
  onUpdateQuantity: (id: string, delta: number) => Promise<void>;
  onMoveLocation: (id: string, newLocation: StorageLocation) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onOpenProductEditor: (item?: InventoryItem) => void;
  onOpenScanner: () => void;
  onMarkEmptyAndAddShopping: (item: InventoryItem) => Promise<void>;
}

export const DesktopInventoryHub: React.FC<DesktopInventoryHubProps> = ({
  inventory,
  onUpdateQuantity,
  onMoveLocation,
  onDeleteItem,
  onOpenProductEditor,
  onOpenScanner,
  onMarkEmptyAndAddShopping
}) => {
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'quantity' | 'dateAdded'>('expiry');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring' | 'low' | 'in_stock'>('all');

  const now = new Date();
  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return 999;
    const exp = new Date(expiryDate);
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filtered = inventory.filter((item) => {
    const matchesLoc = selectedLocation === 'all' || item.location === selectedLocation;
    const name = item.product?.name || '';
    const brand = item.product?.brand || '';
    const barcode = item.product?.barcode || '';
    const matchesSearch =
      !searchQuery ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barcode.includes(searchQuery);

    const days = getDaysUntilExpiry(item.expiryDate);
    const isExpiring = days <= 4;
    const isLow = item.isLow || item.quantity <= item.lowStockThreshold;

    let matchesStatus = true;
    if (statusFilter === 'expiring') matchesStatus = isExpiring;
    if (statusFilter === 'low') matchesStatus = isLow;
    if (statusFilter === 'in_stock') matchesStatus = !isLow && !item.isEmpty;

    return matchesLoc && matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'expiry') {
      const aDays = getDaysUntilExpiry(a.expiryDate);
      const bDays = getDaysUntilExpiry(b.expiryDate);
      return aDays - bDays;
    }
    if (sortBy === 'name') {
      return (a.product?.name || '').localeCompare(b.product?.name || '');
    }
    if (sortBy === 'quantity') {
      return b.quantity - a.quantity;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Household Inventory Hub</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Desktop Management
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete database overview of Fridge, Freezer, and Pantry stock across your household.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenScanner}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Product</span>
          </button>
          <button
            onClick={() => onOpenProductEditor()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Storage Location Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedLocation('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLocation === 'all'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Sections ({inventory.length})
          </button>
          <button
            onClick={() => setSelectedLocation('fridge')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLocation === 'fridge'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            ❄️ Fridge
          </button>
          <button
            onClick={() => setSelectedLocation('freezer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLocation === 'freezer'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🧊 Freezer
          </button>
          <button
            onClick={() => setSelectedLocation('pantry')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLocation === 'pantry'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🥫 Pantry
          </button>
        </div>

        {/* Search & Sort Dropdowns */}
        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, brand, barcode..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">All Status</option>
            <option value="expiring">⚠️ Expiring Soon</option>
            <option value="low">📉 Low Stock</option>
            <option value="in_stock">✅ Healthy Stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
          >
            <option value="expiry">Sort: Expiry Date</option>
            <option value="name">Sort: Product Name</option>
            <option value="quantity">Sort: Highest Quantity</option>
            <option value="dateAdded">Sort: Recently Added</option>
          </select>
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products matched your criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const days = getDaysUntilExpiry(item.expiryDate);
                  const isExpiring = days <= 4;
                  const isLow = item.isLow || item.quantity <= item.lowStockThreshold;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
                              {item.location === 'fridge' ? '❄️' : item.location === 'freezer' ? '🧊' : '🥫'}
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate text-xs">
                              {item.product?.name || 'Unnamed Product'}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{item.product?.brand || item.product?.category || 'General'}</span>
                              {item.product?.barcode && (
                                <span className="font-mono text-[10px] text-slate-500">
                                  #{item.product.barcode}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location Badge & Quick Switch */}
                      <td className="py-3 px-4">
                        <select
                          value={item.location}
                          onChange={(e) =>
                            onMoveLocation(item.id, e.target.value as StorageLocation)
                          }
                          className="rounded-lg bg-slate-950 border border-slate-700 text-xs px-2 py-1 text-slate-200 capitalize cursor-pointer"
                        >
                          <option value="fridge">❄️ Fridge</option>
                          <option value="freezer">🧊 Freezer</option>
                          <option value="pantry">🥫 Pantry</option>
                        </select>
                      </td>

                      {/* Quantity Stepper */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-white min-w-[28px] text-center">
                            {item.quantity}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.unit}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Purchase & Expiry Dates */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {item.expiryDate && (
                            <div className="text-[11px] font-semibold text-slate-200">
                              Exp: {item.expiryDate}
                            </div>
                          )}
                          {item.purchaseDate && (
                            <div className="text-[10px] text-slate-500">
                              Bought: {item.purchaseDate}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {isExpiring && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {days <= 0 ? 'Expired Today' : `${days}d left`}
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Low Stock
                            </span>
                          )}
                          {!isExpiring && !isLow && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onMarkEmptyAndAddShopping(item)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                            title="Mark empty and add to shopping list"
                          >
                            Shop
                          </button>
                          <button
                            onClick={() => onOpenProductEditor(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            title="Edit product item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
