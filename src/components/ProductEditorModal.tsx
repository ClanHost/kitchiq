import React, { useState, useEffect } from 'react';
import { InventoryItem, Product, StorageLocation } from '../types';
import { X, Check, Trash2, Calendar, Sparkles, Refrigerator } from 'lucide-react';

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  item?: InventoryItem; // If editing existing
  onSave: (item: Partial<InventoryItem>, product: Product) => Promise<void>;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  isOpen,
  onClose,
  householdId,
  item,
  onSave
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState<StorageLocation>('fridge');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('units');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.product?.name || '');
      setBrand(item.product?.brand || '');
      setCategory(item.product?.category || 'Groceries');
      setBarcode(item.product?.barcode || '');
      setImageUrl(item.product?.imageUrl || '');
      setLocation(item.location);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setPurchaseDate(item.purchaseDate || '');
      setExpiryDate(item.expiryDate || '');
      setLowStockThreshold(item.lowStockThreshold || 1);
      setNotes(item.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const defaultExp = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
      setName('');
      setBrand('');
      setCategory('Groceries');
      setBarcode('');
      setImageUrl('');
      setLocation('fridge');
      setQuantity(1);
      setUnit('units');
      setPurchaseDate(today);
      setExpiryDate(defaultExp);
      setLowStockThreshold(1);
      setNotes('');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const productId = item?.productId || 'prod-' + crypto.randomUUID();
    const product: Product = {
      id: productId,
      name: name.trim(),
      brand: brand.trim() || undefined,
      category: category.trim() || 'Groceries',
      barcode: barcode.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      defaultLocation: location,
      defaultUnit: unit,
      isVerified: true
    };

    const inventoryPayload: Partial<InventoryItem> = {
      id: item?.id || 'inv-' + crypto.randomUUID(),
      householdId,
      productId,
      location,
      quantity,
      unit,
      purchaseDate: purchaseDate || undefined,
      expiryDate: expiryDate || undefined,
      lowStockThreshold,
      isLow: quantity <= lowStockThreshold,
      isEmpty: quantity <= 0,
      notes: notes.trim() || undefined
    };

    await onSave(inventoryPayload, product);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Refrigerator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {item ? 'Edit Inventory Item' : 'Add Item to Inventory'}
              </h2>
              <p className="text-xs text-slate-400">Specify storage, dates & quantities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Product Name & Brand */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sliced Sourdough, Grass-Fed Milk 2L"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Barilla, Bega"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Dairy, Bakery, Pantry"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Storage Location & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Storage Section
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as StorageLocation)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="fridge">❄️ Fridge</option>
                <option value="freezer">🧊 Freezer</option>
                <option value="pantry">🥫 Pantry</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Barcode Number
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 9300601234567"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quantity, Unit & Low Stock Threshold */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold text-center"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="units, L, kg"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Low Threshold
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white text-center"
              />
            </div>
          </div>

          {/* Purchase Date & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-semibold text-emerald-400"
              />
            </div>
          </div>

          {/* Image URL & Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Kitchen Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In crisper drawer, use for pasta bake Friday"
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white resize-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
