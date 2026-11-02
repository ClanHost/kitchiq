import {
  InventoryItem,
  Product,
  ShoppingItem,
  Household,
  User,
  SyncQueueItem,
  AuditLog
} from '../types';

const DB_NAME = 'kitchiq_local_db';
const DB_VERSION = 1;

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const prodStore = db.createObjectStore('products', { keyPath: 'id' });
          prodStore.createIndex('barcode', 'barcode', { unique: false });
        }

        // Inventory store
        if (!db.objectStoreNames.contains('inventory')) {
          const invStore = db.createObjectStore('inventory', { keyPath: 'id' });
          invStore.createIndex('householdId', 'householdId', { unique: false });
          invStore.createIndex('location', 'location', { unique: false });
          invStore.createIndex('expiryDate', 'expiryDate', { unique: false });
        }

        // Shopping list store
        if (!db.objectStoreNames.contains('shopping')) {
          const shopStore = db.createObjectStore('shopping', { keyPath: 'id' });
          shopStore.createIndex('householdId', 'householdId', { unique: false });
          shopStore.createIndex('isPurchased', 'isPurchased', { unique: false });
        }

        // Households
        if (!db.objectStoreNames.contains('households')) {
          const hhStore = db.createObjectStore('households', { keyPath: 'id' });
          hhStore.createIndex('inviteCode', 'inviteCode', { unique: true });
        }

        // Users
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // Sync Queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('householdId', 'householdId', { unique: false });
          syncStore.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
        }

        // Audit Logs
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('householdId', 'householdId', { unique: false });
        }

        // App Meta (key-value)
        if (!db.objectStoreNames.contains('app_meta')) {
          db.createObjectStore('app_meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        await this.seedInitialDataIfEmpty();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open failed', event);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  private async seedInitialDataIfEmpty() {
    const products = await this.getAll<Product>('products');
    if (products.length > 0) return;

    console.log('[Kitchiq DB] Seeding initial product catalogue & household data...');

    // 1. Initial Products
    const initialProducts: Product[] = [
      {
        id: 'prod-milk-full',
        barcode: '9300601234567',
        name: 'Full Cream Milk 2L',
        brand: 'Dairy Farmers',
        category: 'Dairy',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
        defaultLocation: 'fridge',
        defaultUnit: 'L',
        isVerified: true,
        nutriscore: 'B'
      },
      {
        id: 'prod-eggs-12',
        barcode: '9300607654321',
        name: 'Free Range Large Eggs 12pk',
        brand: 'Sunny Queen',
        category: 'Dairy & Eggs',
        imageUrl: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=300&q=80',
        defaultLocation: 'fridge',
        defaultUnit: 'pack',
        isVerified: true,
        nutriscore: 'A'
      },
      {
        id: 'prod-cheddar',
        barcode: '9310055112233',
        name: 'Tasty Cheddar Block 500g',
        brand: 'Bega',
        category: 'Dairy',
        imageUrl: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&q=80',
        defaultLocation: 'fridge',
        defaultUnit: 'g',
        isVerified: true,
        nutriscore: 'D'
      },
      {
        id: 'prod-greek-yogurt',
        barcode: '9310055998877',
        name: 'Greek Style Natural Yogurt 1kg',
        brand: 'Chobani',
        category: 'Dairy',
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80',
        defaultLocation: 'fridge',
        defaultUnit: 'tub',
        isVerified: true,
        nutriscore: 'A'
      },
      {
        id: 'prod-sourdough',
        barcode: '9320011445566',
        name: 'Artisan Sourdough Loaf',
        brand: 'Bakers Delight',
        category: 'Bakery',
        imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=300&q=80',
        defaultLocation: 'pantry',
        defaultUnit: 'loaf',
        isVerified: true,
        nutriscore: 'A'
      },
      {
        id: 'prod-spaghetti',
        barcode: '8001250123456',
        name: 'Spaghetti No. 5 500g',
        brand: 'Barilla',
        category: 'Pantry Staples',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d62810ef?w=300&q=80',
        defaultLocation: 'pantry',
        defaultUnit: 'pack',
        isVerified: true,
        nutriscore: 'A'
      },
      {
        id: 'prod-olive-oil',
        barcode: '9300633112244',
        name: 'Extra Virgin Olive Oil 750ml',
        brand: 'Cobram Estate',
        category: 'Pantry Staples',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80',
        defaultLocation: 'pantry',
        defaultUnit: 'bottle',
        isVerified: true,
        nutriscore: 'C'
      },
      {
        id: 'prod-icecream-vanilla',
        barcode: '9310022334455',
        name: 'Creamy Vanilla Ice Cream 2L',
        brand: 'Peters',
        category: 'Frozen',
        imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&q=80',
        defaultLocation: 'freezer',
        defaultUnit: 'tub',
        isVerified: true,
        nutriscore: 'D'
      },
      {
        id: 'prod-frozen-peas',
        barcode: '9300601554433',
        name: 'Snap Frozen Baby Peas 1kg',
        brand: 'Birds Eye',
        category: 'Frozen',
        imageUrl: 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=300&q=80',
        defaultLocation: 'freezer',
        defaultUnit: 'bag',
        isVerified: true,
        nutriscore: 'A'
      },
      {
        id: 'prod-frozen-salmon',
        barcode: '9345678901234',
        name: 'Atlantic Salmon Fillets 4pk',
        brand: 'Tassal',
        category: 'Seafood',
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&q=80',
        defaultLocation: 'freezer',
        defaultUnit: 'pack',
        isVerified: true,
        nutriscore: 'A'
      }
    ];

    for (const p of initialProducts) {
      await this.put('products', p);
    }

    // 2. Demo User & Household
    const demoUser: User = {
      id: 'usr-admin-1',
      email: 'nathum@gmail.com',
      name: 'Nathum (Admin)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
    };
    await this.put('users', demoUser);

    const demoHousehold: Household = {
      id: 'hh-melbourne-main',
      name: 'The Main Residence',
      inviteCode: 'KITCH-892F',
      planType: 'hosted_standard',
      createdByUserId: demoUser.id,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: 'hm-1',
          householdId: 'hh-melbourne-main',
          userId: demoUser.id,
          role: 'admin',
          userName: demoUser.name,
          userEmail: demoUser.email,
          joinedAt: new Date().toISOString()
        },
        {
          id: 'hm-2',
          householdId: 'hh-melbourne-main',
          userId: 'usr-member-2',
          role: 'member',
          userName: 'Sarah (Kitchen)',
          userEmail: 'sarah@example.com',
          joinedAt: new Date().toISOString()
        }
      ]
    };
    await this.put('households', demoHousehold);

    // 3. Demo Inventory Items (Current dates: today is in Nov 2026 based on metadata)
    const now = new Date();
    const addDays = (d: number) => {
      const dt = new Date(now.getTime() + d * 86400000);
      return dt.toISOString().split('T')[0];
    };

    const initialInventory: InventoryItem[] = [
      {
        id: 'inv-milk-1',
        householdId: demoHousehold.id,
        productId: 'prod-milk-full',
        location: 'fridge',
        quantity: 0.5,
        unit: 'L',
        purchaseDate: addDays(-4),
        expiryDate: addDays(2), // Expiring soon!
        lowStockThreshold: 1.0,
        isLow: true,
        isEmpty: false,
        notes: 'Opened Thursday morning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-eggs-1',
        householdId: demoHousehold.id,
        productId: 'prod-eggs-12',
        location: 'fridge',
        quantity: 8,
        unit: 'units',
        purchaseDate: addDays(-6),
        expiryDate: addDays(8),
        lowStockThreshold: 4,
        isLow: false,
        isEmpty: false,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-yogurt-1',
        householdId: demoHousehold.id,
        productId: 'prod-greek-yogurt',
        location: 'fridge',
        quantity: 1,
        unit: 'tub',
        purchaseDate: addDays(-2),
        expiryDate: addDays(12),
        lowStockThreshold: 1,
        isLow: false,
        isEmpty: false,
        notes: 'Great for breakfast smoothies',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-cheddar-1',
        householdId: demoHousehold.id,
        productId: 'prod-cheddar',
        location: 'fridge',
        quantity: 0.2,
        unit: 'block',
        purchaseDate: addDays(-10),
        expiryDate: addDays(3),
        lowStockThreshold: 0.5,
        isLow: true,
        isEmpty: false,
        notes: 'Almost out of cheese',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-icecream-1',
        householdId: demoHousehold.id,
        productId: 'prod-icecream-vanilla',
        location: 'freezer',
        quantity: 1,
        unit: 'tub',
        purchaseDate: addDays(-8),
        expiryDate: addDays(90),
        lowStockThreshold: 1,
        isLow: false,
        isEmpty: false,
        notes: 'Dessert for weekend',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-peas-1',
        householdId: demoHousehold.id,
        productId: 'prod-frozen-peas',
        location: 'freezer',
        quantity: 0.4,
        unit: 'bag',
        purchaseDate: addDays(-20),
        expiryDate: addDays(120),
        lowStockThreshold: 0.5,
        isLow: true,
        isEmpty: false,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-salmon-1',
        householdId: demoHousehold.id,
        productId: 'prod-frozen-salmon',
        location: 'freezer',
        quantity: 4,
        unit: 'pack',
        purchaseDate: addDays(-5),
        expiryDate: addDays(60),
        lowStockThreshold: 2,
        isLow: false,
        isEmpty: false,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-sourdough-1',
        householdId: demoHousehold.id,
        productId: 'prod-sourdough',
        location: 'pantry',
        quantity: 1,
        unit: 'loaf',
        purchaseDate: addDays(-1),
        expiryDate: addDays(3),
        lowStockThreshold: 1,
        isLow: false,
        isEmpty: false,
        notes: 'Freshly baked',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-spaghetti-1',
        householdId: demoHousehold.id,
        productId: 'prod-spaghetti',
        location: 'pantry',
        quantity: 3,
        unit: 'pack',
        purchaseDate: addDays(-15),
        expiryDate: addDays(360),
        lowStockThreshold: 1,
        isLow: false,
        isEmpty: false,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-oliveoil-1',
        householdId: demoHousehold.id,
        productId: 'prod-olive-oil',
        location: 'pantry',
        quantity: 1,
        unit: 'bottle',
        purchaseDate: addDays(-12),
        expiryDate: addDays(240),
        lowStockThreshold: 1,
        isLow: false,
        isEmpty: false,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const inv of initialInventory) {
      await this.put('inventory', inv);
    }

    // 4. Demo Shopping List Items (Including auto-added low stock items)
    const initialShopping: ShoppingItem[] = [
      {
        id: 'shop-item-1',
        householdId: demoHousehold.id,
        productId: 'prod-milk-full',
        customName: 'Full Cream Milk 2L',
        quantity: 2,
        unit: 'L',
        preferredStore: 'Coles / Woolworths',
        category: 'Dairy',
        targetLocation: 'fridge',
        isPurchased: false,
        autoAddedFromDepletion: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'shop-item-2',
        householdId: demoHousehold.id,
        productId: 'prod-cheddar',
        customName: 'Tasty Cheddar Block 500g',
        quantity: 1,
        unit: 'pack',
        preferredStore: 'ALDI',
        category: 'Dairy',
        targetLocation: 'fridge',
        isPurchased: false,
        autoAddedFromDepletion: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'shop-item-3',
        householdId: demoHousehold.id,
        customName: 'Fresh Bananas (Cavendish)',
        quantity: 1,
        unit: 'bunch',
        preferredStore: 'Local Grocer',
        category: 'Produce',
        targetLocation: 'pantry',
        isPurchased: false,
        autoAddedFromDepletion: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'shop-item-4',
        householdId: demoHousehold.id,
        customName: 'Paper Towels 3pk',
        quantity: 1,
        unit: 'pack',
        preferredStore: 'Woolworths',
        category: 'Household',
        targetLocation: 'pantry',
        isPurchased: true,
        purchasedAt: addDays(-1),
        purchasedByUserId: demoUser.id,
        autoAddedFromDepletion: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const s of initialShopping) {
      await this.put('shopping', s);
    }

    // 5. Initial Audit Log
    const auditLog: AuditLog = {
      id: 'audit-init-1',
      householdId: demoHousehold.id,
      userId: demoUser.id,
      userName: demoUser.name,
      action: 'HOUSEHOLD_INITIALIZED',
      details: 'Created household "The Main Residence" with offline-ready local storage.',
      createdAt: new Date().toISOString()
    };
    await this.put('audit_logs', auditLog);
  }

  // Generic DB Operations
  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.getDb();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | null> {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Inventory Specific with Product Joins ---
  async getInventory(householdId: string): Promise<InventoryItem[]> {
    const items = await this.getAll<InventoryItem>('inventory');
    const filtered = items.filter(
      (item) => item.householdId === householdId && !item.deletedAt
    );

    // Join products
    const products = await this.getAll<Product>('products');
    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    return filtered.map((item) => ({
      ...item,
      product: productMap.get(item.productId)
    }));
  }

  async saveInventoryItem(
    item: InventoryItem,
    addToSyncQueue = true
  ): Promise<void> {
    item.updatedAt = new Date().toISOString();
    await this.put('inventory', item);

    if (addToSyncQueue) {
      await this.enqueueSync({
        id: 'sync-' + crypto.randomUUID(),
        householdId: item.householdId,
        entityType: 'inventory',
        entityId: item.id,
        action: 'UPSERT',
        payload: item,
        clientTimestamp: item.updatedAt,
        status: 'pending',
        retryCount: 0
      });
    }
  }

  async softDeleteInventoryItem(
    id: string,
    householdId: string
  ): Promise<void> {
    const existing = await this.getById<InventoryItem>('inventory', id);
    if (!existing) return;

    existing.deletedAt = new Date().toISOString();
    existing.updatedAt = existing.deletedAt;
    await this.put('inventory', existing);

    await this.enqueueSync({
      id: 'sync-' + crypto.randomUUID(),
      householdId,
      entityType: 'inventory',
      entityId: id,
      action: 'DELETE',
      payload: { id, deletedAt: existing.deletedAt },
      clientTimestamp: existing.deletedAt,
      status: 'pending',
      retryCount: 0
    });
  }

  // --- Shopping List Operations ---
  async getShoppingList(householdId: string): Promise<ShoppingItem[]> {
    const items = await this.getAll<ShoppingItem>('shopping');
    const filtered = items.filter(
      (item) => item.householdId === householdId && !item.deletedAt
    );

    const products = await this.getAll<Product>('products');
    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    return filtered.map((item) => ({
      ...item,
      product: item.productId ? productMap.get(item.productId) : undefined
    }));
  }

  async saveShoppingItem(
    item: ShoppingItem,
    addToSyncQueue = true
  ): Promise<void> {
    item.updatedAt = new Date().toISOString();
    await this.put('shopping', item);

    if (addToSyncQueue) {
      await this.enqueueSync({
        id: 'sync-' + crypto.randomUUID(),
        householdId: item.householdId,
        entityType: 'shopping',
        entityId: item.id,
        action: 'UPSERT',
        payload: item,
        clientTimestamp: item.updatedAt,
        status: 'pending',
        retryCount: 0
      });
    }
  }

  async softDeleteShoppingItem(
    id: string,
    householdId: string
  ): Promise<void> {
    const existing = await this.getById<ShoppingItem>('shopping', id);
    if (!existing) return;

    existing.deletedAt = new Date().toISOString();
    existing.updatedAt = existing.deletedAt;
    await this.put('shopping', existing);

    await this.enqueueSync({
      id: 'sync-' + crypto.randomUUID(),
      householdId,
      entityType: 'shopping',
      entityId: id,
      action: 'DELETE',
      payload: { id, deletedAt: existing.deletedAt },
      clientTimestamp: existing.deletedAt,
      status: 'pending',
      retryCount: 0
    });
  }

  // --- Barcode / Product Catalog ---
  async findProductByBarcode(barcode: string): Promise<Product | null> {
    const cleanBarcode = barcode.trim();
    const products = await this.getAll<Product>('products');
    const found = products.find((p) => p.barcode === cleanBarcode);
    return found || null;
  }

  async saveProduct(product: Product, addToSync = true): Promise<void> {
    await this.put('products', product);
    if (addToSync) {
      await this.enqueueSync({
        id: 'sync-' + crypto.randomUUID(),
        householdId: 'global',
        entityType: 'product',
        entityId: product.id,
        action: 'UPSERT',
        payload: product,
        clientTimestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0
      });
    }
  }

  // --- Sync Queue ---
  async enqueueSync(queueItem: SyncQueueItem): Promise<void> {
    await this.put('sync_queue', queueItem);
  }

  async getPendingSyncQueue(householdId?: string): Promise<SyncQueueItem[]> {
    const all = await this.getAll<SyncQueueItem>('sync_queue');
    return all.filter((item) => {
      const matchesHh = !householdId || item.householdId === householdId || item.householdId === 'global';
      return matchesHh && (item.status === 'pending' || item.status === 'failed');
    });
  }

  async updateSyncItemStatus(
    id: string,
    status: SyncQueueItem['status'],
    errorMessage?: string
  ): Promise<void> {
    const item = await this.getById<SyncQueueItem>('sync_queue', id);
    if (item) {
      item.status = status;
      if (errorMessage) item.errorMessage = errorMessage;
      if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;
      await this.put('sync_queue', item);
    }
  }

  async clearCompletedSyncItems(): Promise<void> {
    const all = await this.getAll<SyncQueueItem>('sync_queue');
    for (const item of all) {
      if (item.status === 'synced') {
        await this.delete('sync_queue', item.id);
      }
    }
  }

  // --- Audit Logs ---
  async logAudit(
    householdId: string,
    userId: string,
    userName: string,
    action: string,
    details: string
  ): Promise<void> {
    const log: AuditLog = {
      id: 'audit-' + crypto.randomUUID(),
      householdId,
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    await this.put('audit_logs', log);
  }

  async getAuditLogs(householdId: string): Promise<AuditLog[]> {
    const all = await this.getAll<AuditLog>('audit_logs');
    return all
      .filter((l) => l.householdId === householdId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // --- Household & User Management ---
  async getHouseholds(): Promise<Household[]> {
    return this.getAll<Household>('households');
  }

  async saveHousehold(household: Household): Promise<void> {
    await this.put('households', household);
  }

  async getCurrentUser(): Promise<User> {
    const users = await this.getAll<User>('users');
    if (users.length > 0) return users[0];
    const defaultUser: User = {
      id: 'usr-admin-1',
      email: 'nathum@gmail.com',
      name: 'Nathum (Admin)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
    };
    await this.put('users', defaultUser);
    return defaultUser;
  }

  // --- Backup & Restore JSON ---
  async exportFullDatabase(): Promise<string> {
    const [products, inventory, shopping, households, users, auditLogs] =
      await Promise.all([
        this.getAll('products'),
        this.getAll('inventory'),
        this.getAll('shopping'),
        this.getAll('households'),
        this.getAll('users'),
        this.getAll('audit_logs')
      ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Kitchiq',
      data: {
        products,
        inventory,
        shopping,
        households,
        users,
        auditLogs
      }
    };

    return JSON.stringify(backupData, null, 2);
  }

  async importFullDatabase(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) throw new Error('Invalid Kitchiq backup JSON file.');

      const { products, inventory, shopping, households } = parsed.data;

      if (Array.isArray(products)) {
        for (const p of products) await this.put('products', p);
      }
      if (Array.isArray(inventory)) {
        for (const i of inventory) await this.put('inventory', i);
      }
      if (Array.isArray(shopping)) {
        for (const s of shopping) await this.put('shopping', s);
      }
      if (Array.isArray(households)) {
        for (const h of households) await this.put('households', h);
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup', err);
      return false;
    }
  }
}

export const localDb = new LocalDatabase();
