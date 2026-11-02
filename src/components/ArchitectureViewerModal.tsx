import React, { useState } from 'react';
import { BookOpen, X, Copy, Check, Database, Server, Cpu, Shield, ArrowDownUp } from 'lucide-react';

interface ArchitectureViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureViewerModal: React.FC<ArchitectureViewerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'mysql' | 'sqlite' | 'sync' | 'docker'>('architecture');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const mysqlScript = `-- Kitchiq Production MySQL 8 Schema (Target: clanhost_kitchiq)
CREATE DATABASE IF NOT EXISTS clanhost_kitchiq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clanhost_kitchiq;

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE households (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  invite_code VARCHAR(16) NOT NULL UNIQUE,
  plan_type ENUM('free_self_hosted', 'hosted_standard') DEFAULT 'hosted_standard',
  created_by_user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  barcode VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(150) NULL,
  category VARCHAR(100) DEFAULT 'General',
  image_url TEXT NULL,
  default_location ENUM('fridge', 'freezer', 'pantry') DEFAULT 'pantry',
  default_unit VARCHAR(32) DEFAULT 'units'
);

CREATE TABLE inventory_items (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  location ENUM('fridge', 'freezer', 'pantry') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(32) NOT NULL DEFAULT 'units',
  purchase_date DATE NULL,
  expiry_date DATE NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_inv_household (household_id)
);

CREATE TABLE shopping_list_items (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  custom_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(32) NOT NULL DEFAULT 'units',
  preferred_store VARCHAR(100) NULL,
  target_location ENUM('fridge', 'freezer', 'pantry') DEFAULT 'pantry',
  is_purchased BOOLEAN DEFAULT FALSE,
  auto_added_from_depletion BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

  const sqliteScript = `-- Kitchiq Local Household SQLite 3 Schema
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT DEFAULT 'General',
  image_url TEXT,
  default_location TEXT DEFAULT 'pantry',
  default_unit TEXT DEFAULT 'units'
);

CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  location TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'units',
  purchase_date TEXT,
  expiry_date TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  client_timestamp TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);`;

  const dockerCompose = `# Docker Compose for Self-Hosted Kitchiq Household Server
version: '3.8'

services:
  kitchiq-local:
    image: ghcr.io/kitchiq/kitchiq-applet:latest
    container_name: kitchiq-fridge-node
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - KITCHIQ_MODE=self_hosted
      - DATABASE_TYPE=sqlite
      - DATABASE_PATH=/data/kitchiq.db
      - GLOBAL_SYNC_URL=https://kitchiq.clanhost.com.au/api/sync
      - PORT=3000
    volumes:
      - ./kitchiq-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Kitchiq Project Specification & Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Offline-First PWA, MySQL 8 / SQLite schemas, and two-way sync protocol
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/50 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition shrink-0 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Architecture Design</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition shrink-0 cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownUp className="w-4 h-4" />
            <span>Sync & Offline Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('mysql')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition shrink-0 cursor-pointer ${
              activeTab === 'mysql'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>MySQL 8 DDL</span>
          </button>
          <button
            onClick={() => setActiveTab('sqlite')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition shrink-0 cursor-pointer ${
              activeTab === 'sqlite'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>SQLite Local DDL</span>
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition shrink-0 cursor-pointer ${
              activeTab === 'docker'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Self-Hosted Deployment</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-xs leading-relaxed">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-2">1. System Architecture</h3>
                <p>
                  Kitchiq implements an <strong>offline-first distributed model</strong> where the client browser (PWA on fridge touchscreens or smartphones) writes directly to local persistent storage (IndexedDB) with zero latency.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">
                      Global Hosted (kitchiq.clanhost.com.au)
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li>MySQL 8 database: <code className="text-slate-200">clanhost_kitchiq</code></li>
                      <li>Crowdsourced Open Food Facts product database</li>
                      <li>Multi-tenant household isolation with UUIDs</li>
                      <li>Idempotent REST synchronization endpoints</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">
                      Self-Hosted & Local Node
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li>Lightweight SQLite database engine</li>
                      <li>Runs on Raspberry Pi, fridge mini PC, or Docker</li>
                      <li>USB barcode scanner hardware listener</li>
                      <li>100% operational when internet is disconnected</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-2">2. Hardware Barcode Scanner Integration</h3>
                <p>
                  Most USB barcode scanners emulate keyboard input devices (HID). Kitchiq uses a global keystroke listener (<code className="text-emerald-400">useBarcodeScanner</code>) that detects rapid keyboard input (&lt;50ms per key) terminating in an Enter keypress, automatically buffering the barcode without requiring the user to tap into an input field!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-2">Two-Way Synchronization & Conflict Resolution</h3>
                <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                  <li>
                    <strong>Write-First Principle:</strong> All updates (scans, quantity changes, shopping items) immediately write to the local IndexedDB and append a record to <code className="text-emerald-400">sync_queue</code> with client timestamp.
                  </li>
                  <li>
                    <strong>Push Batch:</strong> When connectivity is detected, pending mutations are sent via <code className="text-emerald-400">POST /api/sync/push</code>. The server compares timestamps and applies updates idempotently.
                  </li>
                  <li>
                    <strong>Conflict Resolution:</strong> Uses Last-Write-Wins (LWW) based on UTC timestamps. Deletions are tracked via <code className="text-emerald-400">deleted_at</code> timestamps to prevent resurrected records.
                  </li>
                  <li>
                    <strong>Network Recovery:</strong> If the global domain is unreachable, the queue accumulates safely in IndexedDB and automatically flushes on network restoration.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'mysql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Production MySQL 8 DDL for <code className="text-emerald-400 font-mono">clanhost_kitchiq</code>
                </span>
                <button
                  onClick={() => handleCopy(mysqlScript, 'mysql')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  {copied === 'mysql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'mysql' ? 'Copied SQL' : 'Copy SQL Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-80">
                {mysqlScript}
              </pre>
            </div>
          )}

          {activeTab === 'sqlite' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Local Household SQLite 3 Schema
                </span>
                <button
                  onClick={() => handleCopy(sqliteScript, 'sqlite')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  {copied === 'sqlite' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'sqlite' ? 'Copied SQL' : 'Copy SQLite'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-80">
                {sqliteScript}
              </pre>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Self-Hosted Docker Compose Stack
                </span>
                <button
                  onClick={() => handleCopy(dockerCompose, 'docker')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  {copied === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'docker' ? 'Copied Compose' : 'Copy Docker Compose'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-80">
                {dockerCompose}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
