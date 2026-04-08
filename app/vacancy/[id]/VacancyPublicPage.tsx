'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, Flag, Home, Loader2, MapPin, Share2, UserCircle2, Zap } from 'lucide-react';
import { useToken } from '@/shared/hooks/useToken';
import { Client } from '@/shared/utils/ApiClient';
import ReportModal from '@/components/ReportModal';

interface VacancyData {
  id: string;
  apartmentType: string;
  state: string;
  city: string;
  area: string | null;
  features: string[];
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
  };
}

interface Props {
  vacancy: VacancyData | null;
  vacancyId: string;
}

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

export default function VacancyPublicPage({ vacancy, vacancyId }: Props) {
  const { token, ready } = useToken();
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectStatus, setConnectStatus] = useState<'idle' | 'success' | 'no_listing' | 'already' | 'error'>('idle');
  const [connectErrorMsg, setConnectErrorMsg] = useState('');
  const [showReport, setShowReport] = useState(false);

  // Restore previous connect status from localStorage so users can't re-send after navigating back
  useEffect(() => {
    const stored = localStorage.getItem(`vacancy_connected_${vacancyId}`);
    if (stored) setConnectStatus(stored as 'success' | 'already');
  }, [vacancyId]);

  useEffect(() => {
    void fetch(`${apiBase}/vacancy/${vacancyId}/click`, { method: 'POST' }).catch(() => undefined);
  }, [vacancyId]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    void fetch(`${apiBase}/vacancy/${vacancyId}/share`, { method: 'POST' }).catch(() => undefined);
    if (navigator.share && vacancy) {
      try {
        await navigator.share({
          title: `${vacancy.apartmentType} Available in ${vacancy.city} — TenantSwap`,
          text: `A ${vacancy.apartmentType} is available in ${[vacancy.area, vacancy.city, vacancy.state].filter(Boolean).join(', ')}. Check it out on TenantSwap!`,
          url: shareUrl,
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleConnect = async () => {
    if (!token) {
      window.location.href = `/login?redirect=/vacancy/${vacancyId}`;
      return;
    }
    setConnecting(true);
    try {
      const res = await Client.post(`/vacancy/${vacancyId}/connect`, {}, {
        Authorization: `Bearer ${token}`,
      });
      if (res.status === 200 || res.status === 201) {
        setConnectStatus('success');
        localStorage.setItem(`vacancy_connected_${vacancyId}`, 'success');
      } else {
        const msg: string = res.data?.message ?? '';
        console.error('Vacancy connect error:', res.status, msg);
        if (msg.toLowerCase().includes('active listing') || msg.toLowerCase().includes('need an active') || msg.toLowerCase().includes('not created a listing')) {
          setConnectStatus('no_listing');
        } else if (res.status === 409 || msg.toLowerCase().includes('already')) {
          setConnectStatus('already');
          localStorage.setItem(`vacancy_connected_${vacancyId}`, 'already');
        } else {
          setConnectErrorMsg(msg || `Error ${res.status}`);
          setConnectStatus('error');
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to reach the server.';
      console.error('Vacancy connect exception:', e);
      setConnectErrorMsg(msg);
      setConnectStatus('error');
    } finally {
      setConnecting(false);
    }
  };

  if (!vacancy) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <Home size={28} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-poppins-bold text-slate-900 mb-2">Vacancy Not Found</h1>
          <p className="text-slate-500 font-poppins-regular mb-8">
            This vacancy alert may have been removed or is no longer available.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-poppins-bold text-white hover:bg-emerald-700 transition-colors">
            Browse TenantSwap
          </Link>
        </div>
      </div>
    );
  }

  const location = [vacancy.area, vacancy.city, vacancy.state].filter(Boolean).join(', ');
  const isLoggedIn = ready && !!token;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/TenantSwap Logo Combination.png" alt="TenantSwap" className="h-8" />
          </Link>
          {!isLoggedIn && (
            <Link href="/register" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-poppins-bold text-white hover:bg-emerald-700 transition-colors">
              Join Free
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />

          <div className="p-6 sm:p-8">
            {/* Posted by */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
              {vacancy.user.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vacancy.user.profilePhotoUrl}
                  alt={vacancy.user.fullName}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <UserCircle2 size={22} className="text-emerald-500" />
                </div>
              )}
              <div>
                <p className="text-xs font-poppins-medium text-slate-400 uppercase tracking-wide">Posted by</p>
                <p className="text-sm font-poppins-bold text-slate-800">{vacancy.user.fullName}</p>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-poppins-bold text-emerald-700 mb-3">
                  Vacancy Available
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins-bold text-slate-900">{vacancy.apartmentType}</h1>
                <div className="mt-2 flex items-center gap-1.5 text-slate-500">
                  <MapPin size={15} />
                  <span className="text-sm font-poppins-regular">{location}</span>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-poppins-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {copied ? <Copy size={15} /> : <Share2 size={15} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>

            {/* Features */}
            <div>
              <p className="text-sm font-poppins-medium text-slate-500 mb-3">Features</p>
              <div className="flex flex-wrap gap-2">
                {vacancy.features.map((feature) => (
                  <span key={feature} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-poppins-medium text-emerald-700">
                    <CheckCircle size={13} />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 sm:px-8 py-6">
            {connectStatus === 'success' && (
              <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <p className="text-sm font-poppins-bold text-emerald-700">Connection request sent!</p>
                <p className="text-xs font-poppins-regular text-emerald-600 mt-0.5">
                  {vacancy.user.fullName} will be notified. If they approve, you'll both see each other's contacts.
                </p>
              </div>
            )}

            {connectStatus === 'no_listing' && (
              <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm font-poppins-bold text-amber-700">You need an active listing to connect</p>
                <p className="text-xs font-poppins-regular text-amber-600 mt-0.5">Create your swap listing first, then come back here to connect.</p>
                <Link href="/engine" className="mt-2 inline-block text-xs font-poppins-bold text-amber-700 underline">
                  Create a listing →
                </Link>
              </div>
            )}

            {connectStatus === 'already' && (
              <div className="mb-4 rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-sm font-poppins-bold text-slate-700">Request already sent — check your dashboard for updates.</p>
              </div>
            )}

            {connectStatus === 'already' && (
              <div className="mb-4 rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-sm font-poppins-bold text-slate-700">You've already sent a request to this person.</p>
              </div>
            )}

            {connectStatus === 'error' && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-poppins-bold text-red-700">Could not connect</p>
                {connectErrorMsg && (
                  <p className="text-xs font-poppins-regular text-red-600 mt-0.5">{connectErrorMsg}</p>
                )}
              </div>
            )}

            {connectStatus === 'idle' && (
              <>
                {isLoggedIn ? (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-poppins-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    {connecting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    {connecting ? 'Sending…' : `Connect with ${vacancy.user.fullName.split(' ')[0]}`}
                  </button>
                ) : (
                  <>
                    <p className="text-sm font-poppins-regular text-slate-500 mb-4">
                      Interested in this vacancy? Join TenantSwap to connect with {vacancy.user.fullName.split(' ')[0]} — Zero Agent Fees.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/register?redirect=/vacancy/${vacancy.id}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-poppins-bold text-white hover:bg-emerald-700 transition-colors">
                        Sign Up Free
                      </Link>
                      <Link href={`/login?redirect=/vacancy/${vacancy.id}`} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-poppins-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        I have an account
      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-poppins-regular text-slate-400">
          © {new Date().getFullYear()} TenantSwap Nigeria · Zero Agent Fees · Built for Tenants
        </p>

        {/* Report link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowReport(true)}
            className="inline-flex items-center gap-1.5 text-xs font-poppins-medium text-slate-300 hover:text-red-400 transition-colors"
          >
            <Flag size={12} /> Report this listing
          </button>
        </div>
      </main>

      <AnimatePresence>
        {showReport && vacancy && (
          <ReportModal
            reportedUserId={vacancy.user.id}
            reportedName={vacancy.user.fullName}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
