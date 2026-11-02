-- ==============================================================================
-- KITCHIQ LOCAL DATABASE SCHEMA (SQLite 3)
-- Target: Local Household Node (Fridge Touchscreen / Local Server)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. Local App Metadata
CREATE TABLE IF NOT EXISTS local_node_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 2. Cached Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Local Household Cache
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  plan_type TEXT DEFAULT 'hosted_standard',
  created_by_user_id TEXT NOT NULL,
  settings_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Catalogue (Local + Cached Open Food Facts)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT DEFAULT 'General',
  image_url TEXT,
  default_location TEXT DEFAULT 'pantry', -- 'fridge', 'freezer', 'pantry'
  default_unit TEXT DEFAULT 'units',
  openfoodfacts_id TEXT,
  nutriscore TEXT,
  is_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- 5. Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  location TEXT NOT NULL, -- 'fridge', 'freezer', 'pantry'
  quantity REAL NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'units',
  purchase_date TEXT,
  expiry_date TEXT,
  low_stock_threshold REAL DEFAULT 1.0,
  is_low INTEGER DEFAULT 0,
  is_empty INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_household ON inventory_items(household_id);
CREATE INDEX IF NOT EXISTS idx_inv_loc ON inventory_items(household_id, location);

-- 6. Shopping List Items
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  product_id TEXT,
  custom_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'units',
  preferred_store TEXT,
  category TEXT DEFAULT 'General',
  target_location TEXT DEFAULT 'pantry',
  is_purchased INTEGER DEFAULT 0,
  auto_added_from_depletion INTEGER DEFAULT 0,
  purchased_at TEXT,
  purchased_by_user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_shop_household ON shopping_list_items(household_id);

-- 7. Local Offline Mutation Sync Queue
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'UPSERT', 'DELETE'
  payload_json TEXT NOT NULL,
  client_timestamp TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed'
  retry_count INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON sync_queue(status, client_timestamp);
