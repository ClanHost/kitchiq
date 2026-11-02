import React, { useState } from 'react';
import { Household, HouseholdMember, User, UserRole } from '../types';
import {
  Users,
  ShieldCheck,
  Copy,
  Check,
  Plus,
  KeyRound,
  LogOut,
  Sparkles,
  Lock,
  X,
  UserPlus,
  Home,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface HouseholdManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHousehold: Household;
  currentUser: User;
  onSelectHousehold: (household: Household) => void;
  availableHouseholds: Household[];
  onCreateHousehold: (name: string) => Promise<void>;
  onJoinHousehold: (inviteCode: string) => Promise<boolean>;
  onSwitchUserRole?: (role: UserRole) => void;
}

export const HouseholdManagerModal: React.FC<HouseholdManagerModalProps> = ({
  isOpen,
  onClose,
  currentHousehold,
  currentUser,
  onSelectHousehold,
  availableHouseholds,
  onCreateHousehold,
  onJoinHousehold
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'create' | 'join'>('members');
  const [copiedCode, setCopiedCode] = useState(false);
  const [newHhName, setNewHhName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  if (!isOpen) return null;

  const currentMember = currentHousehold.members?.find((m) => m.userId === currentUser.id);
  const isAdmin = currentMember?.role === 'admin' || currentHousehold.createdByUserId === currentUser.id;

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(currentHousehold.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHhName.trim()) return;
    await onCreateHousehold(newHhName.trim());
    setNewHhName('');
    setActiveTab('members');
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(false);
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;

    const ok = await onJoinHousehold(code);
    if (ok) {
      setJoinSuccess(true);
      setTimeout(() => {
        setJoinSuccess(false);
        setJoinCodeInput('');
        setActiveTab('members');
      }, 1500);
    } else {
      setJoinError('Invalid invitation code or household not found. Check with your household admin.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Household & Multi-User Accounts
              </h2>
              <p className="text-xs text-slate-400">
                Multi-tenant data isolation & secure invitation codes
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
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/50 flex gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer ${
              activeTab === 'members'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members & Code</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Household</span>
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer ${
              activeTab === 'join'
                ? 'bg-slate-800 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'members' && (
            <div className="space-y-5">
              {/* Active Household Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Current Household
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      {currentHousehold.name}
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {currentHousehold.planType === 'free_self_hosted' ? 'Self-Hosted' : 'Hosted Standard'}
                  </span>
                </div>

                {/* Unique Join / Invite Code Box */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-400">Unique Invite Code:</div>
                    <div className="text-lg font-mono font-bold text-emerald-400 tracking-wider">
                      {currentHousehold.inviteCode}
                    </div>
                  </div>

                  <button
                    onClick={handleCopyInviteCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Household Members ({currentHousehold.members?.length || 1})
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Your Role: {isAdmin ? 'Administrator' : 'Member'}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentHousehold.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                          {member.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{member.userName}</span>
                            {member.userId === currentUser.id && (
                              <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{member.userEmail}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          member.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Household Switcher if user belongs to multiple */}
              {availableHouseholds.length > 1 && (
                <div className="pt-3 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                    Switch Active Household:
                  </label>
                  <div className="flex gap-2">
                    {availableHouseholds.map((hh) => (
                      <button
                        key={hh.id}
                        onClick={() => onSelectHousehold(hh)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          hh.id === currentHousehold.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {hh.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                Create a distinct household. All inventory, shopping lists, and scans will remain 100% private and isolated to this household.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Household Name
                </label>
                <input
                  type="text"
                  value={newHhName}
                  onChange={(e) => setNewHhName(e.target.value)}
                  placeholder="e.g. Beach House, Grandma's Pantry, Flat 4B"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!newHhName.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Create Household & Generate Join Code
              </button>
            </form>
          )}

          {activeTab === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                Enter the unique 6 to 10-character invitation code provided by the administrator of the household.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Invitation / Join Code
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. KITCH-892F"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono tracking-wider text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
                  autoFocus
                />
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {joinError}
                </div>
              )}

              {joinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Successfully joined household! Switching view...</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!joinCodeInput.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Join Household
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
