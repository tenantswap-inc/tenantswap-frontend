'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/shared/utils/ApiClient';
import { User } from '@/shared/types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
  User as UserIcon,
  Calendar,
  Search,
} from 'lucide-react';
import Toasts from '@/components/Toasts';

interface PendingVerificationRequest {
  listingId: string;
  userId: string;
  seekerCategory: string;
  desiredType: string;
  desiredState: string;
  desiredCity: string;
  desiredArea: string | null;
  maxBudget: number;
  timeline: string;
  verificationDocumentUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

interface VerifyModalState {
  listingId: string;
  action: 'APPROVE' | 'REJECT';
}

const CATEGORY_LABELS: Record<string, string> = {
  NYSC: 'NYSC',
  WORK: 'Work Relocation',
  SCHOOL: 'Student',
  FAMILY_HOME: 'Family Home',
  OTHER: 'Other',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

const AdminVerificationsPage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [verifications, setVerifications] = useState<PendingVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifyModal, setVerifyModal] = useState<VerifyModalState | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING'>('ALL');

  const loadUser = useCallback(async (): Promise<User | null> => {
    const token = localStorage.getItem('ADMIN_JWT_TOKEN');
    if (!token) { router.replace('/admin/login'); return null; }
    const response = await Client.get('/users/me', {}, { Authorization: `Bearer ${token}` });
    if (response.status !== 200) { router.replace('/admin/login'); return null; }
    const user: User = response.data.data.user;
    if (user.role !== 'ADMIN') { router.replace('/dashboard'); return null; }
    setCurrentUser(user);
    return user;
  }, [router]);

  const loadVerifications = useCallback(async () => {
    const token = localStorage.getItem('ADMIN_JWT_TOKEN');
    if (!token) return;
    const response = await Client.get('/admin/verifications/pending', {}, { Authorization: `Bearer ${token}` });
    if (response.status === 200 && response.data) {
      const raw = response.data;
      const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
      setVerifications(Array.isArray(items) ? items : []);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVerifications();
    setRefreshing(false);
  };

  const openModal = (listingId: string, action: 'APPROVE' | 'REJECT') => {
    setRejectionNote('');
    setAdminNote('');
    setVerifyModal({ listingId, action });
  };

  const handleSubmitVerification = async () => {
    if (!verifyModal) return;
    if (verifyModal.action === 'REJECT' && !rejectionNote.trim()) {
      setAlertMsg('Please provide a rejection reason.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('ADMIN_JWT_TOKEN');
      const body: Record<string, string> = { action: verifyModal.action };
      if (verifyModal.action === 'REJECT') body.rejectionNote = rejectionNote.trim();
      if (adminNote.trim()) body.adminNote = adminNote.trim();

      const response = await Client.post(
        `/admin/listings/${verifyModal.listingId}/verify`,
        body,
        { Authorization: `Bearer ${token}` },
      );

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg(
          verifyModal.action === 'APPROVE'
            ? 'Listing approved and activated.'
            : 'Listing rejected. User has been notified.',
        );
        setVerifyModal(null);
        await loadVerifications();
      } else {
        setAlertMsg(response.data?.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setAlertMsg('Unable to reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadUser()
      .then((user) => { if (user) return loadVerifications(); })
      .finally(() => setLoading(false));
  }, [loadUser, loadVerifications]);

  if (loading) return null;
  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const displayed = filterStatus === 'PENDING'
    ? verifications.filter((v) => true) // all items from this endpoint are pending
    : verifications;

  return (
    <div>
      <Toasts
        alertMsg={alertMsg}
        successMsg={successMsg}
        onCloseAlert={() => setAlertMsg('')}
        onCloseSuccess={() => setSuccessMsg('')}
      />

      {/* Approve / Reject Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              {verifyModal.action === 'APPROVE' ? (
                <CheckCircle2 size={20} className="text-emerald-400" />
              ) : (
                <XCircle size={20} className="text-rose-400" />
              )}
              <h3 className="text-base font-poppins-bold text-white">
                {verifyModal.action === 'APPROVE' ? 'Approve Listing' : 'Reject Listing'}
              </h3>
            </div>

            {verifyModal.action === 'REJECT' && (
              <div className="mb-4">
                <label className="block text-xs font-poppins-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Explain why the document was rejected..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500/50 px-3 py-2 text-sm font-poppins-regular text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none transition-all"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-poppins-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                Internal Note <span className="text-slate-600 font-poppins-regular normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Note for the admin team..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-slate-500 px-3 py-2 text-sm font-poppins-regular text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVerifyModal(null)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-poppins-bold text-slate-400 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={submitting}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-poppins-bold text-white transition-all disabled:opacity-50 ${
                  verifyModal.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submitting ? 'Processing…' : verifyModal.action === 'APPROVE' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-poppins-bold text-white flex items-center gap-3">
              <ShieldCheck className="text-indigo-400" size={24} />
              Pending Verifications
            </h2>
            <p className="text-sm font-poppins-regular text-slate-400 mt-1">
              Review and verify seeker listing documents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-poppins-bold text-slate-500">Pending</span>
                <span className="text-lg font-poppins-bold text-amber-500">{verifications.length}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-poppins-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px] relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-2.5 rounded-xl text-xs font-poppins-bold transition-all border ${
                filterStatus === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-4 py-2.5 rounded-xl text-xs font-poppins-bold transition-all border ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30">
                  <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Seeker</th>
                  <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Listing Details</th>
                  <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Budget</th>
                  <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Submitted</th>
                  <th className="text-right py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="py-8 px-6">
                        <div className="h-4 bg-slate-800 rounded w-full opacity-50" />
                      </td>
                    </tr>
                  ))
                ) : displayed.length > 0 ? (
                  displayed.map((v) => (
                    <tr key={v.listingId} className="hover:bg-slate-800/20 transition-colors group">
                      {/* Seeker */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <UserIcon size={13} className="text-indigo-400" />
                            <span className="text-sm font-poppins-bold text-white">{v.user.fullName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{v.user.email}</span>
                          <span className="text-[11px] text-slate-600">{v.user.phone}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-poppins-bold border bg-purple-500/10 text-purple-400 border-purple-500/20">
                          {CATEGORY_LABELS[v.seekerCategory] ?? v.seekerCategory}
                        </span>
                      </td>

                      {/* Listing Details */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-poppins-bold text-slate-200">{v.desiredType}</span>
                          <span className="text-xs text-slate-500">{v.desiredCity}, {v.desiredState}</span>
                          {v.desiredArea && (
                            <span className="text-xs text-slate-600">{v.desiredArea}</span>
                          )}
                          <span className="text-[11px] text-slate-500 mt-0.5">Timeline: {v.timeline}</span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-4 px-6">
                        <span className="text-sm font-poppins-bold text-emerald-400">
                          ₦{v.maxBudget.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-600 block">/ yr</span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={13} />
                          <span className="text-xs">{formatDate(v.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {v.verificationDocumentUrl ? (
                            <a
                              href={v.verificationDocumentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                              title="View Document"
                            >
                              <ExternalLink size={15} />
                            </a>
                          ) : (
                            <span title="No document uploaded" className="p-2 text-amber-500/50 cursor-default">
                              <AlertCircle size={15} />
                            </span>
                          )}
                          <button
                            onClick={() => openModal(v.listingId, 'REJECT')}
                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                          <button
                            onClick={() => openModal(v.listingId, 'APPROVE')}
                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                            title="Approve"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Clock size={32} className="text-slate-700" />
                        <p className="text-slate-500 font-poppins-bold">No pending verifications</p>
                        <p className="text-slate-600 text-sm font-poppins-regular">All seeker listings have been reviewed.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVerificationsPage;