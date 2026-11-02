import React, { useState } from 'react';
import {
  InventoryItem,
  ShoppingItem,
  StorageLocation,
  Product
} from '../types';
import {
  Refrigerator,
  Flame,
  AlertTriangle,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  Scan,
  Search,
  MoveRight,
  Trash2,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';

interface FridgeTouchscreenViewProps {
  inventory: InventoryItem[];
  shoppingList: ShoppingItem[];
  onUpdateQuantity: (id: string, delta: number) => Promise<void>;
  onMoveLocation: (id: string, newLocation: StorageLocation) => Promise<void>;
  onMarkEmptyAndAddShopping: (item: InventoryItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onOpenScanner: () => void;
  onOpenProductEditor: (item?: InventoryItem) => void;
  onQuickAddShopping: (name: string, location: StorageLocation) => Promise<void>;
}

export const FridgeTouchscreenView: React.FC<FridgeTouchscreenViewProps> = ({
  inventory,
  shoppingList,
  onUpdateQuantity,
  onMoveLocation,
  onMarkEmptyAndAddShopping,
  onDeleteItem,
  onOpenScanner,
  onOpenProductEditor,
  onQuickAddShopping
}) => {
  const [activeLocation, setActiveLocation] = useState<StorageLocation>('fridge');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickShoppingInput, setQuickShoppingInput] = useState('');

  // Calculate stats
  const fridgeCount = inventory.filter((i) => i.location === 'fridge').length;
  const freezerCount = inventory.filter((i) => i.location === 'freezer').length;
  const pantryCount = inventory.filter((i) => i.location === 'pantry').length;

  const now = new Date();
  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Expiring soon items (<= 3 days)
  const expiringItems = inventory.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== null && days <= 4 && !item.isEmpty;
  });

  // Low stock items
  const lowStockItems = inventory.filter(
    (item) => (item.isLow || item.quantity <= item.lowStockThreshold) && !item.isEmpty
  );

  // Filtered items by current active tab and search query
  const filteredItems = inventory.filter((item) => {
    const matchesLocation = item.location === activeLocation;
    const name = item.product?.name || '';
    const brand = item.product?.brand || '';
    const matchesSearch =
      !searchQuery ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickShoppingInput.trim()) return;
    await onQuickAddShopping(quickShoppingInput.trim(), activeLocation);
    setQuickShoppingInput('');
  };

  return (
    <div className="space-y-6">
      {/* Fridge Touchscreen Top Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Fridge Kiosk Touchscreen
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Offline-Ready • Touch Friendly
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Kitchen Inventory & Live Stock
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Tap + / - to adjust stock instantly, scan barcodes with your USB gun or camera, and auto-populate shopping lists.
            </p>
          </div>

          {/* Huge Touch Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={onOpenScanner}
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-emerald-900/30 transition cursor-pointer text-base"
            >
              <Scan className="w-6 h-6" />
              <span>SCAN BARCODE</span>
            </button>
            <button
              onClick={() => onOpenProductEditor()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-bold px-5 py-4 rounded-2xl transition cursor-pointer text-sm"
            >
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Live Storage Section Pills */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <button
            onClick={() => setActiveLocation('fridge')}
            className={`p-3.5 rounded-2xl border transition text-left cursor-pointer active:scale-98 ${
              activeLocation === 'fridge'
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">❄️</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                {fridgeCount} items
              </span>
            </div>
            <div className="mt-2 font-bold text-sm text-white">Fridge</div>
            <div className="text-[11px] text-slate-400">Dairy, meats & fresh</div>
          </button>

          <button
            onClick={() => setActiveLocation('freezer')}
            className={`p-3.5 rounded-2xl border transition text-left cursor-pointer active:scale-98 ${
              activeLocation === 'freezer'
                ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🧊</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                {freezerCount} items
              </span>
            </div>
            <div className="mt-2 font-bold text-sm text-white">Freezer</div>
            <div className="text-[11px] text-slate-400">Frozen goods & meals</div>
          </button>

          <button
            onClick={() => setActiveLocation('pantry')}
            className={`p-3.5 rounded-2xl border transition text-left cursor-pointer active:scale-98 ${
              activeLocation === 'pantry'
                ? 'bg-amber-600/20 border-amber-500 text-white shadow-md'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🥫</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                {pantryCount} items
              </span>
            </div>
            <div className="mt-2 font-bold text-sm text-white">Pantry</div>
            <div className="text-[11px] text-slate-400">Dry goods, pasta & oils</div>
          </button>
        </div>
      </div>

      {/* Critical Alerts Row: Expiring Soon + Running Low */}
      {(expiringItems.length > 0 || lowStockItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expiring Soon */}
          {expiringItems.length > 0 && (
            <div className="rounded-2xl bg-amber-950/30 border border-amber-600/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Expiring Soon ({expiringItems.length})
                  </h3>
                </div>
                <span className="text-[11px] text-amber-300 font-medium">Use within 4 days</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {expiringItems.map((item) => {
                  const days = getDaysUntilExpiry(item.expiryDate);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                            🥫
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-semibold text-white block truncate">
                            {item.product?.name || 'Item'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.quantity} {item.unit} in {item.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            days !== null && days <= 1
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {days !== null && days <= 0
                            ? 'Today!'
                            : days === 1
                            ? 'Tomorrow'
                            : `${days} days left`}
                        </span>
                        <button
                          onClick={() => onMarkEmptyAndAddShopping(item)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Used up, add to shopping"
                        >
                          <ShoppingCart className="w-3 h-3 text-emerald-400" />
                          <span>Shop</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Running Low */}
          {lowStockItems.length > 0 && (
            <div className="rounded-2xl bg-rose-950/20 border border-rose-600/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Stock Running Low ({lowStockItems.length})
                  </h3>
                </div>
                <span className="text-[11px] text-rose-300 font-medium">Re-order recommended</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="truncate">
                        <span className="font-semibold text-white block truncate">
                          {item.product?.name || 'Item'}
                        </span>
                        <span className="text-[10px] text-rose-400">
                          Remaining: {item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onMarkEmptyAndAddShopping(item)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to List</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Touch Inventory Grid Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white capitalize flex items-center gap-2">
            <span>
              {activeLocation === 'fridge'
                ? '❄️ Fridge Compartment'
                : activeLocation === 'freezer'
                ? '🧊 Freezer Compartment'
                : '🥫 Kitchen Pantry'}
            </span>
          </h2>
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-md">
            {filteredItems.length} items
          </span>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeLocation}...`}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Touch-Friendly Inventory Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-slate-400 bg-slate-900/40 space-y-3">
          <div className="text-4xl">
            {activeLocation === 'fridge' ? '❄️' : activeLocation === 'freezer' ? '🧊' : '🥫'}
          </div>
          <p className="text-sm font-semibold text-slate-300">
            No items in {activeLocation} matching your search.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Scan Barcode to Add
            </button>
            <button
              onClick={() => onOpenProductEditor()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const days = getDaysUntilExpiry(item.expiryDate);
            const isExpiringSoon = days !== null && days <= 3;
            const isOut = item.quantity <= 0 || item.isEmpty;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition flex flex-col justify-between ${
                  isOut
                    ? 'bg-slate-900/50 border-slate-800/60 opacity-60'
                    : isExpiringSoon
                    ? 'bg-slate-900 border-amber-500/40 shadow-md shadow-amber-950/20'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top card metadata */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                          {item.location === 'fridge' ? '🥛' : item.location === 'freezer' ? '🧊' : '🥫'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white line-clamp-1">
                          {item.product?.name || 'Unnamed Product'}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {item.product?.brand || item.product?.category || 'Grocery'}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-emerald-400 italic mt-0.5 line-clamp-1">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenProductEditor(item)}
                      className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 text-xs"
                      title="Edit Item"
                    >
                      ✏️
                    </button>
                  </div>

                  {/* Stock Quantity & Expiry Badges */}
                  <div className="flex items-center justify-between py-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">In Stock:</span>
                      <span className="font-extrabold text-white text-base">
                        {item.quantity}
                      </span>
                      <span className="text-slate-400 text-[11px] font-medium">
                        {item.unit}
                      </span>
                    </div>

                    {item.expiryDate && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isExpiringSoon
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Exp: {item.expiryDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Touch Control Bar */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    {/* Big Touch Stepper Buttons */}
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl font-bold text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm text-lg"
                      title="Decrease by 1"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 rounded-xl font-bold text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm text-lg"
                      title="Increase by 1"
                    >
                      <Plus className="w-5 h-5" />
                    </button>

                    {/* Quick Move Button */}
                    <button
                      onClick={() => {
                        const nextLoc: StorageLocation =
                          item.location === 'fridge'
                            ? 'freezer'
                            : item.location === 'freezer'
                            ? 'pantry'
                            : 'fridge';
                        onMoveLocation(item.id, nextLoc);
                      }}
                      className="px-3 py-3 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-300 font-semibold flex items-center gap-1 text-xs cursor-pointer"
                      title="Move between Fridge, Freezer, Pantry"
                    >
                      <MoveRight className="w-4 h-4 text-emerald-400" />
                      <span className="capitalize">
                        {item.location === 'fridge' ? 'Freeze' : item.location === 'freezer' ? 'Pantry' : 'Fridge'}
                      </span>
                    </button>
                  </div>

                  {/* Empty / Out Action */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onMarkEmptyAndAddShopping(item)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Empty / Reorder</span>
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      title="Delete from inventory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Shopping Item Form at Bottom of Fridge */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white">
            Quick Shopping List Add:
          </span>
        </div>

        <form onSubmit={handleQuickAddSubmit} className="flex-1 flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={quickShoppingInput}
            onChange={(e) => setQuickShoppingInput(e.target.value)}
            placeholder="Type item name (e.g. Greek yogurt, coffee beans, dish soap)..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!quickShoppingInput.trim()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer active:scale-95 transition"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};
