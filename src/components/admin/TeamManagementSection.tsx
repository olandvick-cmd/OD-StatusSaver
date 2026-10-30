import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Crown,
  KeyRound,
  Mail
} from 'lucide-react';
import { AdminProfile, AdminRole, OWNER_BOOTSTRAP_EMAIL } from '../../services/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { saveAdmin, deleteAdmin } from '../../services/adminService';

interface TeamManagementSectionProps {
  admins: AdminProfile[];
  onRefresh: () => void;
}

export const TeamManagementSection: React.FC<TeamManagementSectionProps> = ({
  admins,
  onRefresh
}) => {
  const { isOwner, isAdmin, currentUser, adminProfile } = useAdminAuth();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<AdminRole>('analyst');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setErrorMsg(null);

    const emailClean = newEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setErrorMsg('Please enter a valid administrator email address.');
      return;
    }

    if (newRole === 'owner' && !isOwner) {
      setErrorMsg('Only current Owners can appoint another Owner.');
      return;
    }

    setSubmitting(true);
    try {
      const actorEmail = adminProfile?.email || currentUser?.email || 'admin';
      const actorUid = adminProfile?.uid || currentUser?.uid || 'uid';
      const uid = `admin-${emailClean.replace(/[^a-zA-Z0-9]/g, '_')}`;

      await saveAdmin({
        uid,
        email: emailClean,
        displayName: emailClean.split('@')[0],
        role: newRole,
        addedAt: new Date().toISOString(),
        addedBy: actorEmail
      }, actorUid, actorEmail);

      setNewEmail('');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (targetUid: string, targetEmail: string) => {
    if (!isOwner) return;
    if (targetEmail.toLowerCase() === OWNER_BOOTSTRAP_EMAIL.toLowerCase()) {
      alert('The primary owner cannot be revoked.');
      return;
    }

    if (confirm(`Are you sure you want to revoke admin access for ${targetEmail}?`)) {
      const actorEmail = adminProfile?.email || currentUser?.email || 'admin';
      const actorUid = adminProfile?.uid || currentUser?.uid || 'uid';
      await deleteAdmin(targetUid, targetEmail, actorUid, actorEmail);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white">Administrator Access Control (RBAC)</h2>
          <p className="text-xs text-slate-400">
            Strict server-enforced role access. Public registration is prohibited.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer self-start sm:self-center"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Authorized Account</span>
          </button>
        )}
      </div>

      {/* Admins Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Administrator / Email</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Authorized Date</th>
                <th className="py-3 px-4">Added By</th>
                {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {admins.map((admin) => {
                const isPrimary = admin.email?.toLowerCase() === OWNER_BOOTSTRAP_EMAIL.toLowerCase();
                return (
                  <tr key={admin.uid} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                          {admin.displayName ? admin.displayName[0].toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="text-white font-semibold flex items-center gap-1.5">
                            {admin.email}
                            {isPrimary && (
                              <span title="Primary Bootstrapped Owner">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{admin.uid}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                        admin.role === 'owner' 
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/50' 
                          : admin.role === 'administrator'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                      }`}>
                        {admin.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {admin.addedAt ? new Date(admin.addedAt).toLocaleDateString() : 'Initial'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {admin.addedBy || 'system'}
                    </td>

                    {isOwner && (
                      <td className="py-3 px-4 text-right">
                        {!isPrimary ? (
                          <button
                            onClick={() => handleRevoke(admin.uid, admin.email)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                            title="Revoke access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">Protected</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Authorize New Administrator
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Google Account Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="analyst@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Access Role Tier
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="analyst">Analyst (Read-only metrics & export)</option>
                  <option value="administrator">Administrator (Manage announcements & ads)</option>
                  {isOwner && <option value="owner">Owner (Full root privileges & team management)</option>}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Authorize Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
