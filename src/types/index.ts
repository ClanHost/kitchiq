export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export type UserRole = 'admin' | 'member';

export type PlanType = 'free_self_hosted' | 'hosted_standard' | 'hosted_premium';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  planType: PlanType;
  createdByUserId: string;
  createdAt: string;
  members?: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: UserRole;
  userName: string;
  userEmail: string;
  joinedAt: string;
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
  defaultLocation: StorageLocation;
  defaultUnit: string;
  openfoodfactsId?: string;
  nutriscore?: string;
  isVerified?: boolean;
}

export interface InventoryItem {
  id: string;
  householdId: string;
  productId: string;
  location: StorageLocation;
  quantity: number;
  unit: string;
  purchaseDate?: string;
  expiryDate?: string;
  lowStockThreshold: number;
  isLow: boolean;
  isEmpty: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Join product fields for display
  product?: Product;
}

export interface ShoppingItem {
  id: string;
  householdId: string;
  productId?: string;
  customName: string;
  quantity: number;
  unit: string;
  preferredStore?: string;
  category: string;
  targetLocation: StorageLocation;
  isPurchased: boolean;
  autoAddedFromDepletion?: boolean;
  purchasedAt?: string | null;
  purchasedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Join product fields if linked
  product?: Product;
}

export type SyncEntityType = 'inventory' | 'shopping' | 'product' | 'household';

export interface SyncQueueItem {
  id: string;
  householdId: string;
  entityType: SyncEntityType;
  entityId: string;
  action: 'UPSERT' | 'DELETE';
  payload: any;
  clientTimestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface AuditLog {
  id: string;
  householdId: string;
  userId: string;
  userName?: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface BarcodeScanResult {
  barcode: string;
  foundInLocal: boolean;
  foundInGlobal: boolean;
  product?: Product;
  rawSource: 'local' | 'cache' | 'openfoodfacts' | 'manual';
}

export type AppActiveView = 
  | 'fridge_touchscreen'
  | 'mobile_shopping'
  | 'inventory_hub'
  | 'household_manager'
  | 'sync_center'
  | 'architecture_docs';
