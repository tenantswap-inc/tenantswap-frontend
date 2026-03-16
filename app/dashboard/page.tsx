'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SwapListing } from '@/shared/types';
import {
  FilePlus, Edit2, Link2Off, ArrowRight,
  ShieldCheck, FileText, Home, CalendarClock,
  BadgeCheck, Clock4,
} from 'lucide-react';
import { Client } from '@/shared/utils/ApiClient';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'USER' | 'ADMIN';
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  subscriptionExpiresAt: string | null;
  reliabilityScore: number;
  cancellationCount: number;
  noShowCount: number;
  cooldownUntil: string | null;
  blockedUntil: string | null;
  profilePhotoUrl: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  occupation: string | null;
  allowIncomingCalls: boolean;
  oauthProvider: 'GOOGLE' | 'APPLE' | null;
  canConnectLandlord: boolean;
  hasLandlordContact: boolean;
  onboardingComplete: boolean;
  phoneVerifiedAt: string | null;
  listings: SwapListing[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getActiveListing(listings: SwapListing[]): SwapListing | null {
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

const STATUS_COLORS: Record<SwapListing['status'], string> = {
  DRAFT:   'bg-slate-100 text-slate-500',
  ACTIVE:  'bg-emerald-100 text-emerald-700',
  MATCHED: 'bg-blue-100 text-blue-700',
  CLOSED:  'bg-red-100 text-red-600',
  EXPIRED: 'bg-amber-100 text-amber-700',
};

// ─── component ────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hydrated, setHydrated]       = useState(false);
  const router = useRouter();

  const readCurrentUser = async () => {
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      if (!token) { router.push('/login'); return; }

      const response = await Client.get('/users/me', {}, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        setCurrentUser(response.data.data.user);
        return;
      }

      localStorage.removeItem('JWT_TOKEN');
      router.push('/login');
    } catch {
      localStorage.removeItem('JWT_TOKEN');
      router.push('/login');
    }
  };

  useEffect(() => {
    readCurrentUser().finally(() => setHydrated(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) return null;

  const activeListing = currentUser ? getActiveListing(currentUser.listings) : null;

  // ── no listing ─────────────────────────────────────────────────────────────

  if (!currentUser || !activeListing) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FilePlus size={40} />
          </div>
          <h2 className="text-3xl font-poppins-bold mb-4">Complete your profile</h2>
          <p className="text-slate-500 font-poppins-regular mb-8 max-w-md mx-auto">
            We need to know what you're leaving and what you're looking for to run the home matching algorithm.
          </p>
          <Link
            href="/engine"
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold hover:bg-emerald-700 transition-all"
          >
            Enter Swap Details
          </Link>
        </div>
      </div>
    );
  }

  // ── main dashboard ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <p className="text-sm text-slate-400 font-poppins-regular mb-1">
            Welcome back, <span className="text-slate-700 font-poppins-bold">{currentUser.fullName}</span>
          </p>
          <h2 className="text-4xl font-poppins-bold text-slate-900 tracking-tight">
            Your Swap Dashboard
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-block text-xs font-poppins-bold px-3 py-1 rounded-full ${STATUS_COLORS[activeListing.status]}`}>
              {activeListing.status}
            </span>
            {activeListing.expiresAt && (
              <span className="text-xs text-slate-400 font-poppins-regular flex items-center gap-1">
                <Clock4 size={12} />
                Expires {formatDate(activeListing.expiresAt)}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/engine"
          className="bg-white border border-slate-200 px-6 py-3 rounded-xl font-poppins-medium text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <Edit2 size={18} /> Edit Request
        </Link>
      </div>

      {/* Active listing summary */}
      <div className="mb-10 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col sm:flex-row gap-6">

        {/* Leaving */}
        <div className="flex-1">
          <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">
            You're Leaving
          </p>
          <p className="font-poppins-bold text-slate-800">
            {activeListing.currentType} · {activeListing.currentCity}
          </p>
          <p className="text-xs text-slate-500 font-poppins-regular mt-1">
            Current rent: ₦{activeListing.currentRent.toLocaleString()} / yr
          </p>
          {activeListing.currentAvailable ? (
            <p className="text-xs text-emerald-600 font-poppins-medium mt-1 flex items-center gap-1">
              <BadgeCheck size={12} />
              Available from {formatDate(activeListing.currentAvailableOn)}
            </p>
          ) : (
            <p className="text-xs text-slate-400 font-poppins-regular mt-1">Not yet available</p>
          )}
        </div>

        <div className="hidden sm:flex items-center text-emerald-400">
          <ArrowRight size={24} />
        </div>

        {/* Looking for */}
        <div className="flex-1">
          <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">
            You're Looking For
          </p>
          <p className="font-poppins-bold text-slate-800">
            {activeListing.desiredType} · {activeListing.desiredCity}
          </p>
          <p className="text-xs text-slate-500 font-poppins-regular mt-1">
            Budget: ₦{activeListing.maxBudget.toLocaleString()} / yr
          </p>
          <p className="text-xs text-slate-500 font-poppins-regular mt-0.5 flex items-center gap-1">
            <CalendarClock size={12} />
            {activeListing.timeline}
          </p>
        </div>

        {/* Features */}
        {activeListing.features.length > 0 && (
          <div className="flex-1">
            <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-2">
              Features
            </p>
            <div className="flex flex-wrap gap-2">
              {activeListing.features.map((f) => (
                <span
                  key={f}
                  className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg font-poppins-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All listings (if user has multiple) */}
      {currentUser.listings.length > 1 && (
        <div className="mb-10">
          <h3 className="text-lg font-poppins-bold text-slate-700 mb-4">All Your Listings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentUser.listings.map((listing) => (
              <div
                key={listing.id}
                className={`bg-white border rounded-2xl p-5 ${
                  listing.id === activeListing.id
                    ? 'border-emerald-400 shadow-md'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-poppins-bold px-2 py-1 rounded-full ${STATUS_COLORS[listing.status]}`}>
                    {listing.status}
                  </span>
                  <span className="text-xs text-slate-400 font-poppins-regular">
                    {formatDate(listing.createdAt)}
                  </span>
                </div>
                <p className="font-poppins-bold text-slate-800 text-sm">
                  {listing.currentType} → {listing.desiredType}
                </p>
                <p className="text-xs text-slate-500 font-poppins-regular mt-1">
                  {listing.currentCity} → {listing.desiredCity}
                </p>
                <p className="text-xs text-slate-400 font-poppins-regular mt-1">
                  ₦{listing.maxBudget.toLocaleString()} budget ·{' '}
                  {listing.currentAvailable
                    ? `Available ${formatDate(listing.currentAvailableOn)}`
                    : 'Not available yet'}
                </p>
                {listing.matchedAt && (
                  <p className="text-xs text-blue-600 font-poppins-medium mt-2">
                    Matched {formatDate(listing.matchedAt)}
                  </p>
                )}
                {listing.expiresAt && (
                  <p className="text-xs text-amber-500 font-poppins-medium mt-1 flex items-center gap-1">
                    <Clock4 size={10} /> Expires {formatDate(listing.expiresAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No matches yet */}
      <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-300 text-center">
        <div className="text-slate-300 flex justify-center mb-6">
          <Link2Off size={64} />
        </div>
        <h3 className="text-2xl font-poppins-bold text-slate-400">No homes found yet</h3>
        <p className="text-slate-400 font-poppins-regular mt-2">
          Wait for more tenants to join or try adjusting your requirements.
        </p>
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
  );
};

export default Dashboard;