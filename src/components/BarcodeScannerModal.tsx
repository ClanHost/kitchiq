import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Camera,
  Keyboard,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShoppingCart,
  Refrigerator,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { lookupBarcode, COMMON_SAMPLE_BARCODES, SampleBarcode } from '../services/barcodeService';
import { Product, StorageLocation, InventoryItem, ShoppingItem } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  onAddInventory: (item: Partial<InventoryItem>, product: Product) => Promise<void>;
  onAddShopping: (item: Partial<ShoppingItem>, product?: Product) => Promise<void>;
  initialBarcode?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  householdId,
  onAddInventory,
  onAddShopping,
  initialBarcode = ''
}) => {
  const [barcodeInput, setBarcodeInput] = useState(initialBarcode);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'usb_manual' | 'samples'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanned / Lookup Result state
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [lookupSource, setLookupSource] = useState<string | null>(null);
  const [targetLocation, setTargetLocation] = useState<StorageLocation>('fridge');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('units');
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && initialBarcode) {
      setBarcodeInput(initialBarcode);
      handleSearch(initialBarcode);
    } else if (!isOpen) {
      stopCamera();
      resetForm();
    }
  }, [isOpen, initialBarcode]);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser/environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or blocked. You can use USB scanner or manual entry.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const resetForm = () => {
    setFoundProduct(null);
    setLookupSource(null);
    setBarcodeInput('');
    setActionSuccess(null);
    setQuantity(1);
  };

  const handleSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || barcodeInput).trim();
    if (!code) return;

    setIsSearching(true);
    setActionSuccess(null);
    try {
      const result = await lookupBarcode(code);
      if (result.product) {
        setFoundProduct(result.product);
        setTargetLocation(result.product.defaultLocation || 'fridge');
        setUnit(result.product.defaultUnit || 'units');
        setLookupSource(result.rawSource);
      }
    } catch (err) {
      console.error('Barcode lookup failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSample = (sample: SampleBarcode) => {
    setBarcodeInput(sample.barcode);
    handleSearch(sample.barcode);
  };

  const handleAddToInventory = async () => {
    if (!foundProduct) return;

    const now = new Date();
    const expiry = new Date(now.getTime() + expiryDays * 86400000).toISOString().split('T')[0];

    const item: Partial<InventoryItem> = {
      householdId,
      productId: foundProduct.id,
      location: targetLocation,
      quantity,
      unit,
      purchaseDate: now.toISOString().split('T')[0],
      expiryDate: expiry,
      lowStockThreshold: 1,
      isLow: quantity <= 1,
      isEmpty: quantity <= 0
    };

    await onAddInventory(item, foundProduct);
    setActionSuccess(`Added "${foundProduct.name}" to ${targetLocation.toUpperCase()}!`);
    setTimeout(() => {
      resetForm();
    }, 1800);
  };

  const handleAddToShopping = async () => {
    if (!foundProduct) return;

    const item: Partial<ShoppingItem> = {
      householdId,
      productId: foundProduct.id,
      customName: foundProduct.name,
      quantity,
      unit,
      targetLocation,
      category: foundProduct.category,
      isPurchased: false
    };

    await onAddShopping(item, foundProduct);
    setActionSuccess(`Added "${foundProduct.name}" to Shopping List!`);
    setTimeout(() => {
      resetForm();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Barcode Scanner & Product Lookup
              </h2>
              <p className="text-xs text-slate-400">
                USB Scanner hardware, Mobile Camera & Open Food Facts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tabs: Camera vs USB/Manual vs Samples */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-900/50 flex gap-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('usb_manual')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer ${
              activeTab === 'usb_manual'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>USB / Manual Code</span>
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer ${
              activeTab === 'samples'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Quick Test Barcodes</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Active Tab View */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative aspect-video max-h-56 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Viewfinder Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-28 border-2 border-emerald-400/80 rounded-lg relative">
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 animate-pulse shadow-sm" />
                    <span className="absolute -top-6 left-2 text-[10px] text-emerald-300 font-mono tracking-wider bg-slate-900/80 px-1.5 py-0.5 rounded">
                      AIM AT BARCODE
                    </span>
                  </div>
                </div>

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 text-slate-400">
                    <Camera className="w-8 h-8 mb-2 text-slate-500" />
                    <p className="text-xs max-w-xs">{cameraError || 'Initializing camera viewfinder...'}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Center product barcode in the reticle or click <strong>Quick Test Barcodes</strong> above to simulate any supermarket item.
              </p>
            </div>
          )}

          {activeTab === 'usb_manual' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-xs text-slate-300">
                  <strong>USB Hardware Scanner Listener Active:</strong> Point your USB barcode gun at any product barcode and trigger. The scanner automatically inputs here!
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter or scan barcode (e.g. 9300601234567)"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {barcodeInput && (
                    <button
                      onClick={() => setBarcodeInput('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching || !barcodeInput.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearching ? 'Looking up...' : 'Lookup'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Click any Australian / international supermarket barcode below to simulate a real hardware scan:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {COMMON_SAMPLE_BARCODES.map((sample) => (
                  <button
                    key={sample.barcode}
                    onClick={() => handleSelectSample(sample)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-400">
                        {sample.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {sample.barcode} • {sample.category}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Lookup Result & Action Card */}
          {foundProduct && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-start gap-4">
                {foundProduct.imageUrl ? (
                  <img
                    src={foundProduct.imageUrl}
                    alt={foundProduct.name}
                    className="w-20 h-20 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <Refrigerator className="w-8 h-8" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {lookupSource === 'local' ? 'Local DB' : lookupSource === 'openfoodfacts' ? 'Open Food Facts' : 'Manual Entry'}
                    </span>
                    {foundProduct.nutriscore && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Nutri-Score {foundProduct.nutriscore}
                      </span>
                    )}
                  </div>
                  
                  {/* Name field can be edited by user */}
                  <div className="mt-1">
                    <label className="text-[10px] text-slate-400">Product Name</label>
                    <input
                      type="text"
                      value={foundProduct.name}
                      onChange={(e) =>
                        setFoundProduct({ ...foundProduct, name: e.target.value })
                      }
                      placeholder="e.g. Organic Almond Milk"
                      className="w-full text-sm font-semibold text-white bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 mt-0.5"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                    <span>{foundProduct.brand || 'Generic Brand'}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{foundProduct.barcode}</span>
                  </div>
                </div>
              </div>

              {/* Adjust Stock Location, Quantity, Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                {/* Storage Location */}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Storage Section
                  </label>
                  <select
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value as StorageLocation)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="fridge">❄️ Fridge</option>
                    <option value="freezer">🧊 Freezer</option>
                    <option value="pantry">🥫 Pantry</option>
                  </select>
                </div>

                {/* Quantity & Unit */}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Quantity & Unit
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      className="w-16 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white text-center font-bold"
                    />
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="units, L, kg"
                      className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Expiry Days */}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Expires In (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Action Buttons: Add to Inventory vs Add to Shopping List */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToInventory}
                  disabled={!foundProduct.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to {targetLocation.toUpperCase()}</span>
                </button>
                <button
                  onClick={handleAddToShopping}
                  disabled={!foundProduct.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <span>Add to Shopping List</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
