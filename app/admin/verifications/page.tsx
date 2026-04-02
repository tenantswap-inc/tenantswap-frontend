'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/app/AuthLayout';
import { Client } from '@/shared/utils/ApiClient';
import { User } from '@/shared/types';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Alert } from '@heroui/alert';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifyModal, setVerifyModal] = useState<VerifyModalState | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadUser = useCallback(async (): Promise<User | null> => {
    const token = localStorage.getItem('JWT_TOKEN');
    if (!token) { router.replace('/login'); return null; }
    const response = await Client.get('/users/me', {}, { Authorization: `Bearer ${token}` });
    if (response.status !== 200) { router.replace('/login'); return null; }
    const user: User = response.data.data.user;
    if (user.role !== 'ADMIN') { router.replace('/dashboard'); return null; }
    setCurrentUser(user);
    return user;
  }, [router]);

  const loadVerifications = useCallback(async () => {
    const token = localStorage.getItem('JWT_TOKEN');
    if (!token) return;
    const response = await Client.get('/admin/verifications/pending', {}, { Authorization: `Bearer ${token}` });
    if (response.status === 200) {
      setVerifications(response.data.data ?? []);
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
      setErrorMsg('Please provide a rejection reason.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('JWT_TOKEN');
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
        setErrorMsg(response.data?.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadUser()
      .then((user) => { if (user) return loadVerifications(); })
      .finally(() => setLoading(false));
  }, [loadUser, loadVerifications]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(''), 4000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  if (loading) return null;
  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const toastClass = 'fixed top-4 right-4 left-4 sm:left-auto z-[9999] sm:w-full sm:max-w-md';

  return (
    <AuthLayout>
      {successMsg && (
        <div className={toastClass}>
          <Alert
            color="success"
            variant="solid"
            isVisible
            onClose={() => setSuccessMsg('')}
            classNames={{ base: 'shadow-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500 animate-in fade-in slide-in-from-top-2 duration-300' }}
          >
            <span className="text-white font-poppins-bold">{successMsg}</span>
          </Alert>
        </div>
      )}
      {errorMsg && (
        <div className={toastClass}>
          <Alert
            color="danger"
            variant="solid"
            isVisible
            onClose={() => setErrorMsg('')}
            classNames={{ base: 'shadow-2xl rounded-2xl border border-red-500/20 bg-red-500 animate-in fade-in slide-in-from-top-2 duration-300' }}
          >
            <span className="text-white font-poppins-bold">{errorMsg}</span>
          </Alert>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              {verifyModal.action === 'APPROVE' ? (
                <CheckCircle2 size={22} className="text-emerald-500" />
              ) : (
                <XCircle size={22} className="text-red-500" />
              )}
              <h3 className="text-lg font-poppins-bold text-slate-800">
                {verifyModal.action === 'APPROVE' ? 'Approve Listing' : 'Reject Listing'}
              </h3>
            </div>

            {verifyModal.action === 'REJECT' && (
              <div className="mb-4">
                <label className="block text-xs font-poppins-bold text-slate-600 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Explain why the document was rejected..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-poppins-regular text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-poppins-bold text-slate-600 mb-1">
                Internal Note <span className="text-slate-400 font-poppins-regular">(optional)</span>
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Note for the admin team..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-poppins-regular text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVerifyModal(null)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-poppins-bold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={submitting}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-poppins-bold text-white transition-all disabled:opacity-50 ${
                  verifyModal.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {submitting ? 'Processing…' : verifyModal.action === 'APPROVE' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-poppins-bold text-slate-400 uppercase tracking-widest mb-1">Admin Panel</p>
            <h2 className="text-2xl sm:text-3xl font-poppins-bold text-slate-900">Pending Verifications</h2>
            <p className="text-sm font-poppins-regular text-slate-500 mt-1">
              Review and verify seeker listing documents.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-poppins-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Queue */}
        {verifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <div className="text-slate-200 flex justify-center mb-4">
              <FileText size={48} />
            </div>
            <p className="text-slate-400 font-poppins-bold">No pending verifications</p>
            <p className="text-slate-300 font-poppins-regular text-sm mt-1">
              All seeker listings have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((v) => (
              <div key={v.listingId} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-poppins-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {CATEGORY_LABELS[v.seekerCategory] ?? v.seekerCategory}
                      </span>
                      <span className="text-xs font-poppins-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                        <Clock size={10} /> Pending Review
                      </span>
                    </div>
                    <p className="text-base font-poppins-bold text-slate-800">
                      {v.user.fullName}
                    </p>
                    <p className="text-xs font-poppins-regular text-slate-400 mt-0.5">
                      {v.user.email} · {v.user.phone}
                    </p>
                  </div>
                  <p className="text-xs font-poppins-regular text-slate-400 shrink-0">
                    Submitted {formatDate(v.createdAt)}
                  </p>
                </div>

                {/* Listing details */}
                <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-0.5">Looking For</p>
                    <p className="font-poppins-bold text-slate-700">{v.desiredType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                    <p className="font-poppins-bold text-slate-700">{v.desiredCity}, {v.desiredState}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-0.5">Budget</p>
                    <p className="font-poppins-bold text-slate-700">₦{v.maxBudget.toLocaleString()} / yr</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-0.5">Timeline</p>
                    <p className="font-poppins-bold text-slate-700">{v.timeline}</p>
                  </div>
                </div>

                {/* Document + actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {v.verificationDocumentUrl ? (
                    <a
                      href={v.verificationDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-poppins-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FileText size={14} />
                      View Document
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <p className="text-sm font-poppins-regular text-slate-400 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-400" />
                      No document uploaded
                    </p>
                  )}

                  <div className="flex gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => openModal(v.listingId, 'REJECT')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-poppins-bold text-red-600 hover:bg-red-50 transition-all"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => openModal(v.listingId, 'APPROVE')}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-poppins-bold text-white hover:bg-emerald-700 transition-all"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default AdminVerificationsPage;
