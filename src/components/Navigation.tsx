import React from 'react';
import {
  AppActiveView,
  Household,
  User
} from '../types';
import {
  Refrigerator,
  ShoppingCart,
  Layers,
  Scan,
  RefreshCw,
  Home,
  BookOpen,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { SyncState } from '../services/syncService';

interface NavigationProps {
  activeView: AppActiveView;
  onSelectView: (view: AppActiveView) => void;
  currentHousehold: Household;
  currentUser: User;
  syncState: SyncState;
  onOpenScanner: () => void;
  onOpenSyncCenter: () => void;
  onOpenHouseholdManager: () => void;
  onOpenArchitecture: () => void;
  shoppingPendingCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onSelectView,
  currentHousehold,
  currentUser,
  syncState,
  onOpenScanner,
  onOpenSyncCenter,
  onOpenHouseholdManager,
  onOpenArchitecture,
  shoppingPendingCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Household */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView('fridge_touchscreen')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/40 group-hover:scale-105 transition">
                <Refrigerator className="w-5 h-5" />
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition">
                    Kitchiq
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PWA
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono hidden md:block">
                  kitchiq.clanhost.com.au
                </div>
              </div>
            </button>

            {/* Active Household Pill */}
            <button
              onClick={onOpenHouseholdManager}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 transition cursor-pointer"
              title="Manage Household & Members"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold max-w-[120px] truncate">
                {currentHousehold.name}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                {currentHousehold.inviteCode}
              </span>
            </button>
          </div>

          {/* Primary View Switcher Navigation */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => onSelectView('fridge_touchscreen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeView === 'fridge_touchscreen'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Refrigerator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fridge Touchscreen</span>
              <span className="sm:hidden">Fridge</span>
            </button>

            <button
              onClick={() => onSelectView('mobile_shopping')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                activeView === 'mobile_shopping'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shopping Checklist</span>
              <span className="sm:hidden">Shopping</span>
              {shoppingPendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
                  {shoppingPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectView('inventory_hub')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeView === 'inventory_hub'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop Hub</span>
              <span className="md:hidden">Stock</span>
            </button>
          </nav>

          {/* Action Tools & Status */}
          <div className="flex items-center gap-2">
            {/* Quick Barcode Scan Button */}
            <button
              onClick={onOpenScanner}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer active:scale-95 transition"
              title="Scan Barcode via Camera or USB hardware scanner"
            >
              <Scan className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scan</span>
            </button>

            {/* Sync Status Button */}
            <button
              onClick={onOpenSyncCenter}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                syncState.simulatedOffline
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : syncState.pendingCount > 0
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
              title="Click for Synchronization & Offline Center"
            >
              {syncState.simulatedOffline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              ) : syncState.status === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {syncState.simulatedOffline
                  ? 'Offline Mode'
                  : syncState.pendingCount > 0
                  ? `${syncState.pendingCount} Queued`
                  : 'Synced'}
              </span>
            </button>

            {/* Architecture Docs Trigger */}
            <button
              onClick={onOpenArchitecture}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
              title="View Architecture, MySQL/SQLite Schemas & Sync Design"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Mandatory PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </header>
  );
};
