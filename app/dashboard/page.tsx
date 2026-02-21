'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { SwapRequest, MatchChain } from '@/shared/types';
import { findMatches } from '@/services/MatchingEngine';
import {
  FilePlus, Edit2, Link2Off, ArrowRight, ArrowDown, ArrowUp,
  Phone, MessageSquare, ShieldCheck, FileText, Home,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function readCurrentUser(): SwapRequest | null {
  try {
    const raw = localStorage.getItem('authenticatedUser');
    if (!raw) return null;
    return JSON.parse(raw) as SwapRequest;
  } catch {
    return null;
  }
}

// Read all swap requests saved to localStorage.
// In a real multi-user scenario, replace this with an API call.
function readAllRequests(): SwapRequest[] {
  try {
    const raw = localStorage.getItem('allRequests');
    if (!raw) return [];
    return JSON.parse(raw) as SwapRequest[];
  } catch {
    return [];
  }
}

// ─── component ───────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SwapRequest | null>(null);
  const [storedRequests, setStoredRequests] = useState<SwapRequest[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  // Read from localStorage once on mount (avoids SSR mismatch)
  useEffect(() => {
    const user = readCurrentUser();
    const all  = readAllRequests();
    setCurrentUser(user);
    setStoredRequests(all);
    setHydrated(true);
  }, []);

  // Merge live user into the full pool so the engine includes them
  const allRequests: SwapRequest[] = useMemo(() => {
    if (!currentUser) return storedRequests;
    const others = storedRequests.filter(r => r.id !== currentUser.id);
    return [currentUser, ...others];
  }, [currentUser, storedRequests]);

  const homes: MatchChain[] = useMemo(() => {
    if (!currentUser) return [];
    return findMatches(currentUser, allRequests);
  }, [currentUser, allRequests]);

  // Avoid flash before localStorage is read
  if (!hydrated) return null;

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!currentUser) {
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

  // ── Main dashboard ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-poppins-bold text-slate-900 tracking-tight">
            Your Swap Dashboard
          </h2>
          <p className="text-slate-500 font-poppins-regular mt-2">
            Algorithm detected{' '}
            <span className="text-emerald-600 font-poppins-bold">{homes.length}</span>{' '}
            potential {homes.length === 1 ? 'home' : 'homes'} for you.
          </p>
        </div>
        <Link
          href="/engine"
          className="bg-white border border-slate-200 px-6 py-3 rounded-xl font-poppins-medium text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <Edit2 size={18} /> Edit Request
        </Link>
      </div>

      {/* User's current request summary */}
      <div className="mb-10 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">You're Leaving</p>
          <p className="font-poppins-bold text-slate-800">
            {currentUser.leavingFrom.type} · {currentUser.leavingFrom.location}
          </p>
          {currentUser.leavingFrom.vacancyDate && (
            <p className="text-xs text-slate-500 font-poppins-regular mt-1">
              Available {new Date(currentUser.leavingFrom.vacancyDate).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
            </p>
          )}
        </div>
        <div className="hidden sm:flex items-center text-emerald-400">
          <ArrowRight size={24} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">You're Looking For</p>
          <p className="font-poppins-bold text-slate-800">
            {currentUser.lookingFor.type} · {currentUser.lookingFor.location}
          </p>
          <p className="text-xs text-slate-500 font-poppins-regular mt-1">
            Budget: ₦{currentUser.lookingFor.budget.toLocaleString()} / yr · {currentUser.lookingFor.timeline}
          </p>
        </div>
        {currentUser.features.length > 0 && (
          <div className="flex-1">
            <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-2">Features</p>
            <div className="flex flex-wrap gap-2">
              {currentUser.features.map(f => (
                <span key={f} className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg font-poppins-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Homes */}
      <div className="grid grid-cols-1 gap-12">
        {homes.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-300 text-center">
            <div className="text-slate-300 flex justify-center mb-6">
              <Link2Off size={64} />
            </div>
            <h3 className="text-2xl font-poppins-bold text-slate-400">No homes found yet</h3>
            <p className="text-slate-400 font-poppins-regular mt-2">
              Wait for more tenants to join or try adjusting your requirements.
            </p>
          </div>
        ) : (
          homes.map((home) => (
            <div key={home.id} className="relative">
              {/* Home label badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full font-poppins-bold text-sm shadow-lg z-10">
                {home.isDirect ? 'Direct 2-Way Match' : `${home.participants.length}-Way Swap`}
              </div>

              <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-xl border border-emerald-100 overflow-hidden">
                <div className="flex flex-col lg:flex-row items-stretch gap-8 relative">
                  {home.participants.map((p, pIdx) => (
                    <React.Fragment key={p.id}>
                      <div className="flex-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between hover:border-emerald-300 transition-all">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-poppins-bold uppercase tracking-widest text-emerald-600">
                              {p.id === currentUser.id ? 'YOU' : `Tenant #${pIdx + 1}`}
                            </span>
                            <span className="text-xs bg-white px-2 py-1 rounded-md text-slate-400 border border-slate-200 font-poppins-regular">
                              ID: {p.id.split('-')[1]}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-slate-400 font-poppins-bold uppercase mb-1">Has</p>
                              <p className="text-slate-800 font-poppins-bold">
                                {p.leavingFrom.type} in {p.leavingFrom.location}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-poppins-bold uppercase mb-1">Wants</p>
                              <p className="text-slate-800 font-poppins-bold">
                                {p.lookingFor.type} in {p.lookingFor.location}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {p.canConnectLandlord && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg font-poppins-medium">
                                  Can connect landlord
                                </span>
                              )}
                              {p.hasLandlordContact && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg font-poppins-medium">
                                  Has landlord contact
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {p.id !== currentUser.id && (
                          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-3">
                            <button
                              onClick={() =>
                                setRevealedPhone(revealedPhone === p.phoneNumber ? null : p.phoneNumber)
                              }
                              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-poppins-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/10"
                            >
                              <Phone size={16} />
                              {revealedPhone === p.phoneNumber ? p.phoneNumber : 'Connect'}
                            </button>
                            <button className="w-full bg-slate-200 text-slate-600 py-3 rounded-xl font-poppins-bold hover:bg-slate-300 transition-all text-sm flex items-center justify-center gap-2">
                              <MessageSquare size={16} /> Message
                            </button>
                          </div>
                        )}
                      </div>

                      {pIdx < home.participants.length - 1 && (
                        <div className="flex flex-col justify-center items-center text-emerald-400">
                          <div className="hidden lg:block">
                            <ArrowRight size={32} />
                          </div>
                          <div className="lg:hidden py-2">
                            <ArrowDown size={28} />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}

                  {!home.isDirect && (
                    <div className="hidden lg:flex flex-col justify-center items-center text-emerald-200 absolute -right-4 top-1/2 -translate-y-1/2">
                      <div className="h-64 border-r-2 border-dashed border-emerald-200 rounded-r-full w-12" />
                      <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-180">
                        <ArrowUp size={24} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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