'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSwapListing, MatchCandidate, User } from '@/shared/types';
import {
  FilePlus, Edit2, Link2Off, ArrowRight,
  ShieldCheck, FileText, Home, CalendarClock,
  BadgeCheck, Clock4, TrendingUp, MapPin,
} from 'lucide-react';
import { Client } from '@/shared/utils/ApiClient';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/app/AuthLayout';
import Navbar from '@/components/Navbar';
import UpdateEngine from '@/components/UpdateListing';
import { Alert } from '@heroui/alert';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getActiveListing(listings: UserSwapListing[]): UserSwapListing | null {
  if (!listings?.length) return null;
  return (
    listings.find((l) => l.status === 'ACTIVE') ??
    [...listings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
  );
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-400';
}

const STATUS_COLORS: Record<UserSwapListing['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  MATCHED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-amber-100 text-amber-700',
};

// ─── match card ───────────────────────────────────────────────────────────────

function MatchCard({ match }: { match: MatchCandidate }) {
  const { targetListing: t, totalScore } = match;

  return (
    <div className="group h-full bg-white border border-slate-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 w-fit">
          <TrendingUp size={14} className={scoreColor(totalScore)} />
          <span className={`text-sm font-poppins-bold ${scoreColor(totalScore)}`}>
            {totalScore}% match
          </span>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-emerald-700 shadow-sm opacity-0 translate-x-2 pointer-events-none transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-x-0 group-focus-within:pointer-events-auto hover:bg-emerald-50"
        >
          Explore <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="space-y-2">
        <p className="font-poppins-bold text-slate-800 text-sm flex items-center gap-1.5">
          <MapPin size={13} className="text-emerald-500 shrink-0" />
          <span>{t.currentType} in {t.currentCity}</span>
        </p>
        <p className="text-xs text-slate-500 font-poppins-regular">
          Rent: ₦{t.currentRent.toLocaleString()} / yr
        </p>
        {t.currentAvailable && t.currentAvailableOn && (
          <p className="text-xs text-emerald-600 font-poppins-medium flex items-center gap-1">
            <BadgeCheck size={11} className="shrink-0" /> Available {formatDate(t.currentAvailableOn)}
          </p>
        )}
      </div>

      {t.features.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[10px] text-slate-400 font-poppins-bold uppercase tracking-widest mb-2">
            Features
          </p>
          <div className="flex flex-wrap gap-1.5">
            {t.features.map((f) => (
              <span
                key={f}
                className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md font-poppins-medium"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [updateListing, setUpdateListing] = useState<UserSwapListing | null>(null);
  const router = useRouter();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [successMsg, setSuccessMsg] = useState('')


  const readCurrentUser = async () => {
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      if (!token) { router.replace('/login'); return; }

      const response = await Client.get('/users/me', {}, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        setCurrentUser(response.data.data.user);
        return;
      }

      localStorage.removeItem('JWT_TOKEN');
      router.replace('/login');
    } catch {
      localStorage.removeItem('JWT_TOKEN');
      router.replace('/login');
    }
  };

  useEffect(() => {
    readCurrentUser().finally(() => setHydrated(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout( async () => {
      setSuccessMsg('')
      setUpdateListing(null)
      await readCurrentUser()
router.refresh()
    }, 2000)
    return () => clearTimeout(t)
  }, [successMsg])

  if (!hydrated) return null;

  const activeListing = currentUser ? getActiveListing(currentUser.listings) : null;

  // ── no listing ─────────────────────────────────────────────────────────────

  if (!currentUser || !activeListing) {
    return (
      <AuthLayout>

      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FilePlus size={40} />
          </div>
          <h2 className="text-3xl font-poppins-bold mb-4">Setup Your Swap Engine</h2>
          <p className="text-slate-500 font-poppins-regular mb-8 max-w-md mx-auto">
            We need to know what you are leaving and what you are looking for to run the home matching algorithm.
          </p>
          <Link
            href="/engine"
            className="bg-primary-green/90 text-white px-8 py-3 rounded-xl font-poppins-bold hover:bg-primary-green transition-all"
          >
            Enter Swap Details
          </Link>
        </div>
      </div>
      </AuthLayout>
    );
  }

  //  ── Update listing ─────────────────────────────────────────────────────────

  if (updateListing) {
  return (
   <UpdateEngine listing={updateListing} setListing={setUpdateListing} successMsg={successMsg} setSuccessMsg={setSuccessMsg} />
  )
}

  // ── main dashboard ─────────────────────────────────────────────────────────

  return (
    <AuthLayout>
      {successMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-md">
          <Alert
            color="success"
            variant="solid"
            isVisible
            onClose={() => { setSuccessMsg(''); }}
            classNames={{
              base: 'shadow-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500 animate-in fade-in slide-in-from-top-2 duration-300',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-poppins-bold">{successMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      <div className="max-w-6xl mx-auto py-12 px-4">

{/* Header */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
  <div>
    <p className="text-sm text-slate-500 font-poppins-medium mb-1">
      Welcome back,{' '}
      <span className="text-slate-700 font-poppins-bold">{currentUser.fullName}</span>
    </p>
    <h2 className="text-4xl font-poppins-bold text-slate-900 tracking-tight">
      Your Swap Dashboard
    </h2>
    <div className="flex items-center gap-3 mt-2">
      {activeListing.expiresAt && (
        <span className="text-sm text-slate-600 font-poppins-medium flex items-center gap-1">
          <Clock4 size={15} />
          Expires {formatDate(activeListing.expiresAt)}
        </span>
      )}
    </div>
  </div>
</div>


{/* Listings & Matches */}
<div className="space-y-12">
  {currentUser.listings.map((listing) => (
    <div key={listing.id}>

      {/* Listing header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-poppins-bold text-slate-700">
            {listing.currentType} → {listing.desiredType}
          </h3>
          <span className={`text-xs font-poppins-bold px-2 py-1 rounded-full ${STATUS_COLORS[listing.status]}`}>
            {listing.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {listing.expiresAt && (
            <span className="text-xs text-amber-500 font-poppins-medium flex items-center gap-1">
              <Clock4 size={11} /> Expires {formatDate(listing.expiresAt)}
            </span>
          )}
          <button
            onClick={() => setUpdateListing(listing)}
            className="flex items-center gap-1.5 text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-50 font-poppins-medium transition-all"
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>
      </div>

      {/* Listing summary strip */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">Leaving</p>
          <p className="font-poppins-bold text-slate-800 text-sm">{listing.currentType} · {listing.currentCity}</p>
          <p className="text-xs text-slate-500 font-poppins-regular mt-0.5">
            ₦{listing.currentRent.toLocaleString()} / yr
          </p>
          {listing.currentAvailable ? (
            <p className="text-xs text-emerald-600 font-poppins-medium mt-0.5 flex items-center gap-1">
              <BadgeCheck size={11} className="shrink-0" /> Available {formatDate(listing.currentAvailableOn)}
            </p>
          ) : (
            <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">Not yet available</p>
          )}
        </div>

        <div className="hidden sm:flex items-center text-emerald-400">
          <ArrowRight size={18} />
        </div>

        <div className="flex-1">
          <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">Looking For</p>
          <p className="font-poppins-bold text-slate-800 text-sm">{listing.desiredType} · {listing.desiredCity}</p>
          <p className="text-xs text-slate-500 font-poppins-regular mt-0.5">
            Budget: ₦{listing.maxBudget.toLocaleString()} / yr
          </p>
          <p className="text-xs text-slate-500 font-poppins-regular mt-0.5 flex items-center gap-1">
            <CalendarClock size={11} className="shrink-0" /> {listing.timeline}
          </p>
        </div>

        {listing.features.length > 0 && (
          <div className="flex-1">
            <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-2">Features</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.features.map((f) => (
                <span
                  key={f}
                  className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md font-poppins-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Matches for this listing */}
      <div>
        <h4 className="text-sm font-poppins-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          Potential Matches
          {listing.matchCount > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-poppins-medium normal-case tracking-normal">
              {listing.matchCount}
            </span>
          )}
        </h4>

        {listing.matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listing.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center">
            <div className="text-slate-200 flex justify-center mb-3">
              <Link2Off size={40} />
            </div>
            <p className="text-slate-400 font-poppins-bold text-sm">No matches yet</p>
            <p className="text-slate-300 font-poppins-regular text-xs mt-1">
              We will notify you when someone matches this listing.
            </p>
          </div>
        )}
      </div>

      {/* Divider between listings */}
      {currentUser.listings.indexOf(listing) < currentUser.listings.length - 1 && (
        <div className="border-b border-slate-100 mt-12" />
      )}

    </div>
  ))}
</div>

        {/* Protocol footer */}
        <div className="mt-20 bg-slate-900 text-white p-12 rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-3xl font-poppins-bold mb-4">The Swap Protocol</h3>
            <p className="text-slate-400 font-poppins-regular leading-relaxed mb-8">
              TenantSwap only facilitates the connection. Once you connect with others in your home match,
              you should collectively contact your respective landlords or property managers to handle
              the paperwork.
            </p>
            <div className="flex gap-4">
              <div className="bg-emerald-600/20 text-emerald-400 p-4 rounded-2xl border border-emerald-600/30">
                <ShieldCheck size={24} className="mb-2" />
                <p className="text-xs font-poppins-bold uppercase">Safe Swapping</p>
              </div>
              <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl border border-slate-700">
                <FileText size={24} className="mb-2" />
                <p className="text-xs font-poppins-bold uppercase">Legal Advice</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 opacity-10 pointer-events-none">
            <Home size={320} />
          </div>
        </div>

      </div>
    </AuthLayout>
  );


};

export default Dashboard;
