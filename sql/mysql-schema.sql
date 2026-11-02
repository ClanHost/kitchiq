-- ==============================================================================
-- KITCHIQ GLOBAL PRODUCTION DATABASE SCHEMA (MySQL 8 / MariaDB)
-- Target Database: clanhost_kitchiq
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
CREATE DATABASE IF NOT EXISTS clanhost_kitchiq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clanhost_kitchiq;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  avatar_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Households Table (Multi-tenant container)
CREATE TABLE IF NOT EXISTS households (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  invite_code VARCHAR(16) NOT NULL UNIQUE,
  plan_type ENUM('free_self_hosted', 'hosted_standard', 'hosted_premium') DEFAULT 'hosted_standard',
  created_by_user_id VARCHAR(36) NOT NULL,
  settings_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_households_invite (invite_code),
  CONSTRAINT fk_household_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Household Members Table (RBAC)
CREATE TABLE IF NOT EXISTS household_members (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_household_user (household_id, user_id),
  INDEX idx_hm_household (household_id),
  INDEX idx_hm_user (user_id),
  CONSTRAINT fk_hm_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  CONSTRAINT fk_hm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Shared Products Catalogue (Global / Cached)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  barcode VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(150) NULL,
  category VARCHAR(100) DEFAULT 'General',
  image_url TEXT NULL,
  default_location ENUM('fridge', 'freezer', 'pantry') DEFAULT 'pantry',
  default_unit VARCHAR(32) DEFAULT 'units',
  openfoodfacts_id VARCHAR(64) NULL,
  nutriscore VARCHAR(8) NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_barcode (barcode),
  INDEX idx_products_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Household Inventory Items (Isolated per household)
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  location ENUM('fridge', 'freezer', 'pantry') NOT NULL DEFAULT 'fridge',
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(32) NOT NULL DEFAULT 'units',
  purchase_date DATE NULL,
  expiry_date DATE NULL,
  low_stock_threshold DECIMAL(10,2) DEFAULT 1.00,
  is_low BOOLEAN DEFAULT FALSE,
  is_empty BOOLEAN DEFAULT FALSE,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_inv_household (household_id),
  INDEX idx_inv_location (household_id, location),
  INDEX idx_inv_expiry (household_id, expiry_date),
  CONSTRAINT fk_inv_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Shopping List Items
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NULL,
  custom_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(32) NOT NULL DEFAULT 'units',
  preferred_store VARCHAR(100) NULL,
  category VARCHAR(100) DEFAULT 'General',
  target_location ENUM('fridge', 'freezer', 'pantry') DEFAULT 'pantry',
  is_purchased BOOLEAN DEFAULT FALSE,
  auto_added_from_depletion BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP NULL DEFAULT NULL,
  purchased_by_user_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_shopping_household (household_id),
  INDEX idx_shopping_purchased (household_id, is_purchased),
  CONSTRAINT fk_shop_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Change Log & Sync Tracking (For 2-way sync conflict resolution)
CREATE TABLE IF NOT EXISTS sync_change_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  entity_type VARCHAR(64) NOT NULL, -- 'inventory', 'shopping', 'product'
  entity_id VARCHAR(36) NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  payload_json JSON NOT NULL,
  client_id VARCHAR(64) NULL,
  client_timestamp TIMESTAMP NOT NULL,
  server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_household_time (household_id, server_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_household (household_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
