import React, { useState } from 'react';
import { ShoppingItem, StorageLocation, Product } from '../types';
import {
  CheckCircle2,
  Circle,
  Plus,
  ShoppingCart,
  Store,
  Filter,
  Trash2,
  ArrowRight,
  History,
  CheckCheck,
  Search,
  Sparkles,
  PackageCheck
} from 'lucide-react';

interface MobileShoppingViewProps {
  shoppingList: ShoppingItem[];
  onTogglePurchased: (id: string, isPurchased: boolean) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onAddItem: (item: Partial<ShoppingItem>, product?: Product) => Promise<void>;
  onCheckoutToInventory: () => Promise<void>;
  onClearPurchased: () => Promise<void>;
  onOpenScanner: () => void;
}

export const MobileShoppingView: React.FC<MobileShoppingViewProps> = ({
  shoppingList,
  onTogglePurchased,
  onDeleteItem,
  onAddItem,
  onCheckoutToInventory,
  onClearPurchased,
  onOpenScanner
}) => {
  const [activeFilterStore, setActiveFilterStore] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'history'>('checklist');

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('units');
  const [newItemStore, setNewItemStore] = useState('Supermarket');
  const [newItemLocation, setNewItemLocation] = useState<StorageLocation>('pantry');
  const [newItemCategory, setNewItemCategory] = useState('Groceries');

  const pendingItems = shoppingList.filter((item) => !item.isPurchased);
  const purchasedItems = shoppingList.filter((item) => item.isPurchased);

  // Extract distinct stores
  const stores = Array.from(
    new Set(
      shoppingList
        .map((i) => i.preferredStore)
        .filter((s): s is string => Boolean(s && s.trim()))
    )
  );

  const filterItem = (item: ShoppingItem) => {
    const matchesStore =
      activeFilterStore === 'all' || item.preferredStore === activeFilterStore;
    const matchesSearch =
      !searchQuery ||
      item.customName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && matchesSearch;
  };

  const filteredPending = pendingItems.filter(filterItem);
  const filteredPurchased = purchasedItems.filter(filterItem);

  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await onAddItem({
      customName: newItemName.trim(),
      quantity: newItemQty,
      unit: newItemUnit,
      preferredStore: newItemStore,
      targetLocation: newItemLocation,
      category: newItemCategory,
      isPurchased: false
    });

    setNewItemName('');
    setNewItemQty(1);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-16">
      {/* Mobile Top Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 border border-emerald-500/30 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Supermarket Shopping</h1>
              <p className="text-xs text-slate-300">
                {pendingItems.length} items to buy • {purchasedItems.length} in cart
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Checklist ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Purchased & History ({purchasedItems.length})
          </button>
        </div>
      </div>

      {/* Add New Item Expandable Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAddNewSubmit}
          className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-xl animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Add New Shopping Item
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Item Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Sliced Almonds, Oat Milk, Dish Soap"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Quantity</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={newItemQty}
                onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Unit</label>
              <input
                type="text"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                placeholder="pack, L, kg"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Store</label>
              <input
                type="text"
                value={newItemStore}
                onChange={(e) => setNewItemStore(e.target.value)}
                placeholder="Coles, ALDI"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Destination</label>
              <select
                value={newItemLocation}
                onChange={(e) => setNewItemLocation(e.target.value as StorageLocation)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="fridge">❄️ Fridge</option>
                <option value="freezer">🧊 Freezer</option>
                <option value="pantry">🥫 Pantry</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
            >
              Save to Checklist
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search grocery items..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Store Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilterStore('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition ${
              activeFilterStore === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            All Stores
          </button>
          {stores.map((s) => (
            <button
              key={s}
              onClick={() => setActiveFilterStore(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition ${
                activeFilterStore === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist View */}
      {activeTab === 'checklist' && (
        <div className="space-y-3">
          {filteredPending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 bg-slate-900/40 space-y-2">
              <CheckCheck className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="text-sm font-semibold text-white">Your shopping list is all clear!</p>
              <p className="text-xs text-slate-400">
                Any products marked running low in your fridge or pantry will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPending.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 flex items-center justify-between gap-3 transition"
                >
                  {/* Tap Checkmark Button */}
                  <button
                    onClick={() => onTogglePurchased(item.id, true)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-slate-600 group-hover:border-emerald-400 flex items-center justify-center shrink-0 transition">
                      <CheckCircle2 className="w-4 h-4 text-transparent group-hover:text-emerald-400/40" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition truncate">
                          {item.customName}
                        </span>
                        {item.autoAddedFromDepletion && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
                            Auto
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-300">
                          Qty: {item.quantity} {item.unit}
                        </span>
                        {item.preferredStore && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Store className="w-3 h-3 text-emerald-400" />
                              {item.preferredStore}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-[10px] uppercase font-mono text-slate-500">
                          to {item.targetLocation}
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                    title="Remove from list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Barcode Scan at Supermarket */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Scanning products while shopping in the aisle?</span>
            </div>
            <button
              onClick={onOpenScanner}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              Scan Barcode
            </button>
          </div>
        </div>
      )}

      {/* History & Purchased Items */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {filteredPurchased.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  <span>Transfer {purchasedItems.length} Purchased Items to Inventory</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Automatically adds purchased items to Fridge, Freezer, and Pantry with fresh expiry dates.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onCheckoutToInventory}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Transfer to Inventory
                </button>
                <button
                  onClick={onClearPurchased}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  title="Clear history list"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {filteredPurchased.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No purchased items in history yet. Tap items in your checklist to check them off!
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPurchased.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 flex items-center justify-between gap-3 opacity-75"
                >
                  <button
                    onClick={() => onTogglePurchased(item.id, false)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                    title="Click to uncheck back to list"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium text-xs text-slate-300 line-through block truncate">
                        {item.customName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.quantity} {item.unit} • {item.preferredStore || 'Supermarket'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
