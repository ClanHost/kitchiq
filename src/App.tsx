import React, { useState, useEffect, useCallback } from 'react';
import {
  AppActiveView,
  Household,
  InventoryItem,
  Product,
  ShoppingItem,
  StorageLocation,
  User,
  UserRole
} from './types';
import { localDb } from './services/db';
import { syncService, SyncState } from './services/syncService';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { Navigation } from './components/Navigation';
import { FridgeTouchscreenView } from './components/FridgeTouchscreenView';
import { MobileShoppingView } from './components/MobileShoppingView';
import { DesktopInventoryHub } from './components/DesktopInventoryHub';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { HouseholdManagerModal } from './components/HouseholdManagerModal';
import { SyncCenterModal } from './components/SyncCenterModal';
import { ProductEditorModal } from './components/ProductEditorModal';
import { ArchitectureViewerModal } from './components/ArchitectureViewerModal';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState<AppActiveView>('fridge_touchscreen');

  // Core Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [availableHouseholds, setAvailableHouseholds] = useState<Household[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(() => syncService.getState());
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialBarcode, setScannerInitialBarcode] = useState('');
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false);

  // USB Barcode Scanner Global Hardware Listener
  useBarcodeScanner({
    enabled: true,
    onScan: (scannedBarcode) => {
      console.log('[USB Barcode Gun Detected]:', scannedBarcode);
      setScannerInitialBarcode(scannedBarcode);
      setIsScannerOpen(true);
    }
  });

  // Initialize Data from Local IndexedDB
  const refreshHouseholdData = useCallback(async (householdId: string) => {
    try {
      const [invItems, shopItems] = await Promise.all([
        localDb.getInventory(householdId),
        localDb.getShoppingList(householdId)
      ]);
      setInventory(invItems);
      setShoppingList(shopItems);
      await syncService.refreshPendingCount(householdId);
    } catch (err) {
      console.error('Failed to load household data', err);
    }
  }, []);

  useEffect(() => {
    async function initApp() {
      setIsLoading(true);
      try {
        const user = await localDb.getCurrentUser();
        setCurrentUser(user);

        const households = await localDb.getHouseholds();
        setAvailableHouseholds(households);

        if (households.length > 0) {
          const selected = households[0];
          setCurrentHousehold(selected);
          await refreshHouseholdData(selected.id);
        }

        syncService.init();
      } catch (err) {
        console.error('App initialization error', err);
      } finally {
        setIsLoading(false);
      }
    }

    initApp();

    const unsubSync = syncService.subscribe((state) => {
      setSyncState(state);
    });

    return () => {
      unsubSync();
    };
  }, [refreshHouseholdData]);

  // Inventory Handlers
  const handleUpdateQuantity = async (id: string, delta: number) => {
    if (!currentHousehold || !currentUser) return;

    const existing = inventory.find((i) => i.id === id);
    if (!existing) return;

    const newQty = Math.max(0, Math.round((existing.quantity + delta) * 10) / 10);
    const isNowLow = newQty <= existing.lowStockThreshold;
    const isNowEmpty = newQty === 0;

    const updated: InventoryItem = {
      ...existing,
      quantity: newQty,
      isLow: isNowLow,
      isEmpty: isNowEmpty
    };

    await localDb.saveInventoryItem(updated, true);

    // If stock became empty or low, automatically prompt / add to shopping list!
    if (isNowEmpty && !existing.isEmpty) {
      await handleAutoAddShoppingOnDepletion(existing);
    }

    await localDb.logAudit(
      currentHousehold.id,
      currentUser.id,
      currentUser.name,
      'UPDATE_STOCK_QUANTITY',
      `Adjusted ${existing.product?.name || 'Item'} to ${newQty} ${existing.unit} in ${existing.location}`
    );

    await refreshHouseholdData(currentHousehold.id);
  };

  const handleMoveLocation = async (id: string, newLocation: StorageLocation) => {
    if (!currentHousehold || !currentUser) return;
    const existing = inventory.find((i) => i.id === id);
    if (!existing) return;

    const updated: InventoryItem = {
      ...existing,
      location: newLocation
    };

    await localDb.saveInventoryItem(updated, true);
    await localDb.logAudit(
      currentHousehold.id,
      currentUser.id,
      currentUser.name,
      'MOVE_STORAGE_LOCATION',
      `Moved ${existing.product?.name || 'Item'} from ${existing.location} to ${newLocation}`
    );

    await refreshHouseholdData(currentHousehold.id);
  };

  const handleMarkEmptyAndAddShopping = async (item: InventoryItem) => {
    if (!currentHousehold || !currentUser) return;

    // 1. Set item to empty
    const updated: InventoryItem = {
      ...item,
      quantity: 0,
      isEmpty: true,
      isLow: true
    };
    await localDb.saveInventoryItem(updated, true);

    // 2. Add or increment in shopping list
    await handleAutoAddShoppingOnDepletion(item);

    await refreshHouseholdData(currentHousehold.id);
  };

  const handleAutoAddShoppingOnDepletion = async (item: InventoryItem) => {
    if (!currentHousehold) return;

    const existingShop = shoppingList.find(
      (s) => s.productId === item.productId && !s.isPurchased && !s.deletedAt
    );

    if (existingShop) {
      // Increment quantity needed
      await localDb.saveShoppingItem(
        {
          ...existingShop,
          quantity: existingShop.quantity + 1
        },
        true
      );
    } else {
      const newShopItem: ShoppingItem = {
        id: 'shop-' + crypto.randomUUID(),
        householdId: currentHousehold.id,
        productId: item.productId,
        customName: item.product?.name || 'Depleted Item',
        quantity: item.lowStockThreshold || 1,
        unit: item.unit || 'units',
        category: item.product?.category || 'Groceries',
        targetLocation: item.location,
        isPurchased: false,
        autoAddedFromDepletion: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await localDb.saveShoppingItem(newShopItem, true);
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    if (!currentHousehold || !currentUser) return;
    await localDb.softDeleteInventoryItem(id, currentHousehold.id);
    await localDb.logAudit(
      currentHousehold.id,
      currentUser.id,
      currentUser.name,
      'DELETE_INVENTORY_ITEM',
      `Removed item ${id} from household inventory`
    );
    await refreshHouseholdData(currentHousehold.id);
  };

  // Shopping List Handlers
  const handleToggleShoppingPurchased = async (id: string, isPurchased: boolean) => {
    if (!currentHousehold || !currentUser) return;
    const existing = shoppingList.find((s) => s.id === id);
    if (!existing) return;

    const updated: ShoppingItem = {
      ...existing,
      isPurchased,
      purchasedAt: isPurchased ? new Date().toISOString() : null,
      purchasedByUserId: isPurchased ? currentUser.id : undefined
    };

    await localDb.saveShoppingItem(updated, true);
    await refreshHouseholdData(currentHousehold.id);
  };

  const handleDeleteShoppingItem = async (id: string) => {
    if (!currentHousehold) return;
    await localDb.softDeleteShoppingItem(id, currentHousehold.id);
    await refreshHouseholdData(currentHousehold.id);
  };

  const handleAddShoppingItem = async (
    itemData: Partial<ShoppingItem>,
    product?: Product
  ) => {
    if (!currentHousehold) return;

    const newShopItem: ShoppingItem = {
      id: itemData.id || 'shop-' + crypto.randomUUID(),
      householdId: currentHousehold.id,
      productId: product?.id || itemData.productId,
      customName: itemData.customName || product?.name || 'New Item',
      quantity: itemData.quantity || 1,
      unit: itemData.unit || product?.defaultUnit || 'units',
      preferredStore: itemData.preferredStore || 'Supermarket',
      category: itemData.category || product?.category || 'Groceries',
      targetLocation: itemData.targetLocation || product?.defaultLocation || 'pantry',
      isPurchased: false,
      autoAddedFromDepletion: itemData.autoAddedFromDepletion || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await localDb.saveShoppingItem(newShopItem, true);
    await refreshHouseholdData(currentHousehold.id);
  };

  const handleCheckoutToInventory = async () => {
    if (!currentHousehold || !currentUser) return;
    const purchased = shoppingList.filter((s) => s.isPurchased && !s.deletedAt);
    if (purchased.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const defaultExpiry = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    for (const shop of purchased) {
      // Find if item already exists in inventory
      const existingInv = inventory.find(
        (inv) => inv.productId === shop.productId && inv.location === shop.targetLocation
      );

      if (existingInv) {
        // Top up quantity
        await localDb.saveInventoryItem(
          {
            ...existingInv,
            quantity: existingInv.quantity + shop.quantity,
            isEmpty: false,
            isLow: false,
            purchaseDate: today,
            expiryDate: defaultExpiry
          },
          true
        );
      } else {
        // Create new inventory item
        const newInv: InventoryItem = {
          id: 'inv-' + crypto.randomUUID(),
          householdId: currentHousehold.id,
          productId: shop.productId || 'prod-custom-' + crypto.randomUUID(),
          location: shop.targetLocation || 'fridge',
          quantity: shop.quantity,
          unit: shop.unit,
          purchaseDate: today,
          expiryDate: defaultExpiry,
          lowStockThreshold: 1,
          isLow: false,
          isEmpty: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await localDb.saveInventoryItem(newInv, true);
      }

      // Mark shopping item completed / soft-deleted
      await localDb.softDeleteShoppingItem(shop.id, currentHousehold.id);
    }

    await localDb.logAudit(
      currentHousehold.id,
      currentUser.id,
      currentUser.name,
      'CHECKOUT_GROCERIES_TO_STOCK',
      `Transferred ${purchased.length} purchased items from supermarket to household inventory`
    );

    await refreshHouseholdData(currentHousehold.id);
  };

  const handleClearPurchased = async () => {
    if (!currentHousehold) return;
    const purchased = shoppingList.filter((s) => s.isPurchased && !s.deletedAt);
    for (const p of purchased) {
      await localDb.softDeleteShoppingItem(p.id, currentHousehold.id);
    }
    await refreshHouseholdData(currentHousehold.id);
  };

  // Barcode / Product Add Handlers
  const handleSaveProductAndInventory = async (
    invData: Partial<InventoryItem>,
    product: Product
  ) => {
    if (!currentHousehold || !currentUser) return;

    // 1. Save product to shared/local catalogue
    await localDb.saveProduct(product, true);

    // 2. Save inventory item
    const invItem: InventoryItem = {
      id: invData.id || 'inv-' + crypto.randomUUID(),
      householdId: currentHousehold.id,
      productId: product.id,
      location: invData.location || product.defaultLocation || 'fridge',
      quantity: invData.quantity || 1,
      unit: invData.unit || product.defaultUnit || 'units',
      purchaseDate: invData.purchaseDate || new Date().toISOString().split('T')[0],
      expiryDate: invData.expiryDate,
      lowStockThreshold: invData.lowStockThreshold || 1,
      isLow: (invData.quantity || 1) <= (invData.lowStockThreshold || 1),
      isEmpty: (invData.quantity || 1) <= 0,
      notes: invData.notes,
      createdAt: invData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await localDb.saveInventoryItem(invItem, true);
    await localDb.logAudit(
      currentHousehold.id,
      currentUser.id,
      currentUser.name,
      'ADD_PRODUCT_INVENTORY',
      `Added "${product.name}" (${invItem.quantity} ${invItem.unit}) to ${invItem.location}`
    );

    await refreshHouseholdData(currentHousehold.id);
  };

  // Household Handlers
  const handleCreateHousehold = async (name: string) => {
    if (!currentUser) return;
    const newHh: Household = {
      id: 'hh-' + crypto.randomUUID(),
      name,
      inviteCode: 'KITCH-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      planType: 'hosted_standard',
      createdByUserId: currentUser.id,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: 'hm-' + crypto.randomUUID(),
          householdId: '',
          userId: currentUser.id,
          role: 'admin',
          userName: currentUser.name,
          userEmail: currentUser.email,
          joinedAt: new Date().toISOString()
        }
      ]
    };
    newHh.members![0].householdId = newHh.id;

    await localDb.saveHousehold(newHh);
    const all = await localDb.getHouseholds();
    setAvailableHouseholds(all);
    setCurrentHousehold(newHh);
    await refreshHouseholdData(newHh.id);
  };

  const handleJoinHousehold = async (inviteCode: string): Promise<boolean> => {
    if (!currentUser) return false;
    const all = await localDb.getHouseholds();
    const found = all.find((h) => h.inviteCode === inviteCode.trim().toUpperCase());
    if (!found) return false;

    // Add current user as member if not already
    const isMember = found.members?.some((m) => m.userId === currentUser.id);
    if (!isMember) {
      found.members = [
        ...(found.members || []),
        {
          id: 'hm-' + crypto.randomUUID(),
          householdId: found.id,
          userId: currentUser.id,
          role: 'member',
          userName: currentUser.name,
          userEmail: currentUser.email,
          joinedAt: new Date().toISOString()
        }
      ];
      await localDb.saveHousehold(found);
    }

    setCurrentHousehold(found);
    await refreshHouseholdData(found.id);
    return true;
  };

  const shoppingPendingCount = shoppingList.filter((s) => !s.isPurchased && !s.deletedAt).length;

  if (isLoading || !currentHousehold || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-xl mb-4 animate-bounce">
          K
        </div>
        <div className="text-base font-bold">Initializing Kitchiq...</div>
        <p className="text-xs text-slate-400 mt-1">
          Loading offline IndexedDB database & household catalogue
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navigation
        activeView={activeView}
        onSelectView={setActiveView}
        currentHousehold={currentHousehold}
        currentUser={currentUser}
        syncState={syncState}
        onOpenScanner={() => {
          setScannerInitialBarcode('');
          setIsScannerOpen(true);
        }}
        onOpenSyncCenter={() => setIsSyncCenterOpen(true)}
        onOpenHouseholdManager={() => setIsHouseholdModalOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        shoppingPendingCount={shoppingPendingCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'fridge_touchscreen' && (
          <FridgeTouchscreenView
            inventory={inventory}
            shoppingList={shoppingList}
            onUpdateQuantity={handleUpdateQuantity}
            onMoveLocation={handleMoveLocation}
            onMarkEmptyAndAddShopping={handleMarkEmptyAndAddShopping}
            onDeleteItem={handleDeleteInventoryItem}
            onOpenScanner={() => {
              setScannerInitialBarcode('');
              setIsScannerOpen(true);
            }}
            onOpenProductEditor={(item) => {
              setEditingItem(item);
              setIsProductEditorOpen(true);
            }}
            onQuickAddShopping={async (name, location) => {
              await handleAddShoppingItem({
                customName: name,
                targetLocation: location,
                quantity: 1,
                unit: 'units'
              });
            }}
          />
        )}

        {activeView === 'mobile_shopping' && (
          <MobileShoppingView
            shoppingList={shoppingList}
            onTogglePurchased={handleToggleShoppingPurchased}
            onDeleteItem={handleDeleteShoppingItem}
            onAddItem={handleAddShoppingItem}
            onCheckoutToInventory={handleCheckoutToInventory}
            onClearPurchased={handleClearPurchased}
            onOpenScanner={() => {
              setScannerInitialBarcode('');
              setIsScannerOpen(true);
            }}
          />
        )}

        {activeView === 'inventory_hub' && (
          <DesktopInventoryHub
            inventory={inventory}
            onUpdateQuantity={handleUpdateQuantity}
            onMoveLocation={handleMoveLocation}
            onDeleteItem={handleDeleteInventoryItem}
            onOpenProductEditor={(item) => {
              setEditingItem(item);
              setIsProductEditorOpen(true);
            }}
            onOpenScanner={() => {
              setScannerInitialBarcode('');
              setIsScannerOpen(true);
            }}
            onMarkEmptyAndAddShopping={handleMarkEmptyAndAddShopping}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Kitchiq</span>
            <span>•</span>
            <span>Smart Household Inventory & Grocery PWA</span>
            <span>•</span>
            <span className="font-mono text-emerald-400">v1.2.0 (Offline-First)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="hover:text-emerald-400 cursor-pointer"
            >
              System Architecture & SQL
            </button>
            <button
              onClick={() => setIsSyncCenterOpen(true)}
              className="hover:text-emerald-400 cursor-pointer"
            >
              Sync Center
            </button>
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400"
            >
              Open Food Facts API
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        householdId={currentHousehold.id}
        initialBarcode={scannerInitialBarcode}
        onAddInventory={async (invItem, prod) => {
          await handleSaveProductAndInventory(invItem, prod);
        }}
        onAddShopping={async (shopItem, prod) => {
          await handleAddShoppingItem(shopItem, prod);
        }}
      />

      <HouseholdManagerModal
        isOpen={isHouseholdModalOpen}
        onClose={() => setIsHouseholdModalOpen(false)}
        currentHousehold={currentHousehold}
        currentUser={currentUser}
        availableHouseholds={availableHouseholds}
        onSelectHousehold={(hh) => {
          setCurrentHousehold(hh);
          refreshHouseholdData(hh.id);
        }}
        onCreateHousehold={handleCreateHousehold}
        onJoinHousehold={handleJoinHousehold}
      />

      <SyncCenterModal
        isOpen={isSyncCenterOpen}
        onClose={() => setIsSyncCenterOpen(false)}
        householdId={currentHousehold.id}
      />

      <ProductEditorModal
        isOpen={isProductEditorOpen}
        onClose={() => {
          setIsProductEditorOpen(false);
          setEditingItem(undefined);
        }}
        householdId={currentHousehold.id}
        item={editingItem}
        onSave={async (invItem, prod) => {
          await handleSaveProductAndInventory(invItem, prod);
        }}
      />

      <ArchitectureViewerModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
