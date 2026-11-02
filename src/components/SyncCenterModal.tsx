import React, { useState, useEffect } from 'react';
import { syncService, SyncState } from '../services/syncService';
import { localDb } from '../services/db';
import { SyncQueueItem } from '../types';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Server,
  Layers,
  ArrowDownUp
} from 'lucide-react';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  householdId
}) => {
  const [syncState, setSyncState] = useState<SyncState>(() => syncService.getState());
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
      loadQueue();
    });

    loadQueue();
    return unsubscribe;
  }, [isOpen, householdId]);

  const loadQueue = async () => {
    const queue = await localDb.getPendingSyncQueue(householdId);
    setQueueItems(queue);
  };

  const handleManualSync = async () => {
    await syncService.triggerSync(householdId);
    await loadQueue();
  };

  const handleToggleOffline = (simOffline: boolean) => {
    syncService.setSimulatedOffline(simOffline);
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const json = await localDb.exportFullDatabase();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kitchiq-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const success = await localDb.importFullDatabase(text);
      if (success) {
        setImportStatus('Backup restored successfully! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setImportStatus('Failed to import backup file. Verify valid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Synchronization & Offline Engine
              </h2>
              <p className="text-xs text-slate-400">
                Two-way sync, mutation queue & conflict resolution
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status & Diagnostics Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Online / Offline status */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Network State</span>
                {syncState.simulatedOffline ? (
                  <WifiOff className="w-4 h-4 text-amber-400" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="mt-2 text-sm font-extrabold text-white flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncState.simulatedOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span>{syncState.simulatedOffline ? 'Simulated Offline' : 'Connected (Online)'}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {syncState.simulatedOffline
                  ? 'All writes save directly to IndexedDB'
                  : 'Syncing with kitchiq.clanhost.com.au'}
              </p>
            </div>

            {/* Pending queue items */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Sync Queue</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-sm font-extrabold text-white">
                {syncState.pendingCount} Changes Queued
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Queued locally for idempotent server push
              </p>
            </div>

            {/* Last sync time */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Last Synchronization</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-sm font-extrabold text-white">
                {syncState.lastSyncTime || 'Pending initial'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Background auto-poll: 30s
              </p>
            </div>
          </div>

          {/* Offline Testing Simulation Switch */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Simulate Offline Kitchen Operation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
                  Testing Tool
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Disconnect from the server to verify that fridge scanning, quantity edits, and shopping continue working 100% offline.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleOffline(!syncState.simulatedOffline)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  syncState.simulatedOffline
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {syncState.simulatedOffline ? (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Go Online & Drain Queue</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span>Simulate Disconnected</span>
                  </>
                )}
              </button>

              <button
                onClick={handleManualSync}
                disabled={syncState.status === 'syncing' || syncState.simulatedOffline}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`}
                />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {/* Pending Mutation Queue Inspector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pending Local Mutation Queue ({queueItems.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Store: IndexedDB (sync_queue)
              </span>
            </div>

            {queueItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All household changes are fully synchronized!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-white">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                          {item.action}
                        </span>
                        <span className="font-bold">{item.entityType}</span>
                        <span className="text-slate-400 text-[11px]">#{item.entityId}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Timestamp: {item.clientTimestamp}
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup & Disaster Recovery */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Offline Backup & Disaster Recovery
            </h3>
            <p className="text-xs text-slate-400">
              Export an encrypted JSON snapshot of your household's entire inventory, shopping lists, and custom products, or restore to a fresh self-hosted installation.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Household JSON Backup</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Restore from JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {importStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
