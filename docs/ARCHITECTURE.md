# Kitchiq System Architecture & Technical Specification

## 1. System Architecture Overview

Kitchiq is designed as an **offline-first, multi-tenant smart household inventory and grocery platform** deployable across two synchronized tiers:

1. **Global Hosted Version (`kitchiq.clanhost.com.au`)**:
   - Multi-tenant cloud application with MySQL 8 / MariaDB database (`clanhost_kitchiq`).
   - Global shared product catalogue (crowdsourced from Open Food Facts and verified scans).
   - User identity, encrypted credentials, household registry, and subscription/hosting management.
   - Central synchronization hub exposing idempotent REST/WebSocket endpoints.

2. **Local Household Nodes (Self-Hosted / Fridge Kiosk / Raspberry Pi)**:
   - Lightweight local Node.js/Express service backed by SQLite.
   - Local caching of household inventory, shopping lists, and recent product lookups.
   - USB Barcode scanner hardware integration (raw input / keyboard HID).
   - Works 100% offline indefinitely without internet connectivity.

3. **Client Devices (Mobile Phones, Kitchen Touchscreen, Tablets, Desktop)**:
   - Progressive Web App (PWA) with service worker caching static assets.
   - Local browser **IndexedDB** acting as the immediate persistence layer (Write-First).
   - USB barcode scanner listener (rapid keystroke buffer) and mobile camera barcode detection.

---

## 2. Complete Database Schema

All synchronized entities use **UUIDv4** as primary keys (never relying solely on autoincrement IDs) to guarantee conflict-free distributed creation across offline nodes. Every household-scoped table includes `household_id` to enforce strict multi-tenant isolation. Soft-deletes are handled via `deleted_at` timestamps to ensure deletions synchronize across offline devices.

### Schema Entity Relationship
```
Users (id, email, password_hash, name)
  │
  ├─ HouseholdMembers (household_id, user_id, role)
  │       │
Households (id, name, invite_code, plan_type)
  │
  ├─ Inventory (id, household_id, product_id, location, quantity, unit, purchase_date, expiry_date, is_low, is_empty)
  │       │
  │     Products (id, barcode, name, brand, category, image_url, default_location)
  │       │
  ├─ ShoppingListItems (id, household_id, product_id, custom_name, quantity, unit, preferred_store, is_purchased, auto_added)
  │
  ├─ SyncQueue / ChangeLog (id, household_id, table_name, record_id, action, payload, client_timestamp, sync_status)
  │
  └─ AuditLogs (id, household_id, user_id, action, details, created_at)
```

---

## 3. Two-Way Synchronization Protocol

The synchronization protocol operates using **vector timestamps + Last-Write-Wins (LWW) with client-side mutation queues**:

1. **Local Mutation (Write-First)**:
   - When a user scans or edits an item (e.g. at the fridge touchscreen), the change is written immediately to the local store (IndexedDB / SQLite).
   - A changelog record is appended to `sync_queue`:
     `{ id: UUID, household_id, entity_type: 'inventory', entity_id: UUID, action: 'UPSERT'|'DELETE', payload: {...}, updated_at: ISO8601, sync_version: 1 }`

2. **Push Phase (Client -> Server)**:
   - Client sends queued mutations via POST `/api/sync/push`.
   - The server validates permissions (`household_id` match) and processes each mutation idempotently.
   - Server compares the incoming `updated_at` with the database `updated_at`. If incoming > existing, database is updated; otherwise conflict is flagged or discarded.
   - On HTTP 200 response, client marks queue items as confirmed or purges them.

3. **Pull Phase (Server -> Client)**:
   - Client polls or requests GET `/api/sync/pull?since={last_sync_timestamp}&household_id={id}`.
   - Server returns all records modified or deleted since that timestamp.
   - Client merges incoming records into local store.

4. **Network Partition Resilience**:
   - If offline, the queue accumulates. No data is lost.
   - When connectivity resumes (monitored by `online` event + healthcheck ping), the queue automatically drains in chronological order.

---

## 4. Offline PWA Operation When Global Server is Unavailable

1. **Asset Precaching**: The Service Worker precaches all HTML, CSS, JavaScript, icons, and fonts via Workbox. Launching the PWA or refreshing while offline loads instantaneously.
2. **Local Product Database**: The PWA retains a local cache of recent and common supermarket barcodes in IndexedDB. If an unknown barcode is scanned while offline, the app prompts for the item name, stores it locally, and queues an Open Food Facts lookup once back online.
3. **Optimistic UI Updates**: All actions (adjusting quantities, moving from fridge to freezer, checking off shopping items) render with 0ms latency.
4. **Sync Queue Visualizer**: A non-intrusive status pill displays sync states:
   - `🟢 Online (Synced)`
   - `🟡 Offline (X changes queued)`
   - `🔄 Syncing...`

---

## 5. Remote Software Update Mechanism

1. **Web / PWA Layer**:
   - Central releases on `kitchiq.clanhost.com.au` update the Workbox service worker hash.
   - `vite-plugin-pwa` with `registerType: 'autoUpdate'` detects updates in the background.
   - When a new build is detected, the service worker skips waiting and automatically refreshes on the next navigation or prompts the user with an "Update Available" notification.
2. **Local Node / Express Service**:
   - Self-hosted installations query `/api/system/version` on the global host.
   - Containerized / Docker setups use watchtower or an authenticated self-updater script with sha256 checksum verification and automatic rollback if healthcheck `/api/health` fails.
3. **Database Migrations**:
   - Version-numbered SQL migration files (`V1__initial_schema.sql`, `V2__shopping_aisles.sql`) execute on boot to migrate SQLite / MySQL automatically.

---

## 6. Technical Limitations & Security Risks Mitigation

| Risk / Limitation | Potential Impact | Mitigation Strategy |
|---|---|---|
| **Multi-Tenant Leakage** | Household A sees Household B data | Mandatory `household_id` foreign key check on all database queries and API route middleware; UUIDs prevent sequential ID guessing. |
| **USB Scanner Input Collisions** | Scanner keystrokes injected into active text inputs | Scanner listener distinguishes hardware scanners via keystroke inter-arrival time (<45ms between chars) and termination with `Enter`. |
| **Offline Expiry Drift** | Timezone mismatch during offline logging | All dates stored in standardized UTC ISO-8601 strings with client-generated UTC timestamps. |
| **Open Food Facts Rate Limits / Downtime** | Lookup delays or 429 errors | In-memory and IndexedDB local barcode cache; graceful UI fallback permitting immediate manual product naming. |
| **Brute-forcing Household Join Codes** | Unauthorized household joining | Cryptographically random alphanumeric codes, 10-attempt rate limiting per IP, and revocable codes by household admin. |
