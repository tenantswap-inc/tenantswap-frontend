'use client';

import React, { useState } from 'react';
import { useRouter } from'next/navigation';
import { PhoneCall, Info, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import type { RegisteredUser } from '@/app/register/page';

interface OnboardingProps {
  currentUser: RegisteredUser | null;
  onComplete: (updatedUser: RegisteredUser) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ currentUser, onComplete }) => {
  const [canConnect, setCanConnect] = useState<boolean | null>(null);
  const [hasContact, setHasContact] = useState<boolean | null>(null);
    const [allowCalls, setAllowCalls] = useState<boolean | null>(null);

  const [error, setError] = useState('');

  const handleComplete = () => {
     if (canConnect === null || hasContact === null || allowCalls === null) {
      setError('Please answer all questions to continue.');
      return;
    }

    if (!currentUser) return;

    const updatedUser: RegisteredUser = {
      ...currentUser,
      canConnectLandlord: canConnect,
      hasLandlordContact: hasContact,
      allowIncomingCalls: allowCalls,
    };

    onComplete(updatedUser);
  };

  return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex items-center justify-center py-12 px-4">
  {/* Decorative blobs */}
  <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl" />
  </div>

  <div className="relative w-full max-w-md">
    <div className="bg-white rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.10)] overflow-hidden border border-slate-100/80">

      {/* Header banner */}
      <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-8 pt-10 pb-12 overflow-hidden">
        {/* Geometric accents */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute top-10 right-10 w-1 h-1 rounded-full bg-white/30" />

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
            <Image
              src="/assets/TenantSwap Logo Monochrome.svg"
              alt="TenantSwap"
              width={40}
              height={40}
              preload={true}
              quality={100}
              />
          </div>
          <div>
            <p className="text-emerald-200 text-xs font-poppins-medium tracking-widest uppercase mb-0.5">
              Almost there
            </p>
            <h2 className="text-2xl font-poppins-bold text-white leading-tight">
              Set Up Your Profile
            </h2>
          </div>
        </div>

        <p className="relative text-emerald-100/80 text-sm font-poppins-regular mt-3 leading-relaxed">
          Let's set up your profile for successful matching.
        </p>
      </div>

      {/* Wave divider */}
      <div className="-mt-6 relative z-10">
        <svg viewBox="0 0 400 24" className="w-full fill-white" preserveAspectRatio="none" height="24">
          <path d="M0,24 L0,12 Q100,0 200,12 Q300,24 400,12 L400,24 Z" />
        </svg>
      </div>

      {/* Body */}
      <div className="px-8 pb-8 -mt-2 space-y-8">

        {/* Question 1 */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
              Landlord Connection
            </label>
            <h3 className="text-sm font-poppins-bold text-slate-800 leading-snug mt-1">
              Are you fine with connecting an incoming Tenant to the Landlord of your apartment?
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCanConnect(true)}
              className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canConnect === true
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]'
                  : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
              }`}
            >
              {canConnect === true && <CheckCircle2 size={15} />}
              Yes
            </button>
            <button
              onClick={() => setCanConnect(false)}
              className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canConnect === false
                  ? 'border-red-400 bg-red-50 text-red-600 shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                  : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
              }`}
            >
              {canConnect === false && <CheckCircle2 size={15} />}
              No
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex gap-3 items-start">
            <PhoneCall className="text-amber-500 flex-shrink-0 mt-0.5" size={15} />
            <p className="text-amber-800 text-xs font-poppins-regular leading-relaxed">
              <strong className="font-poppins-bold">Note:</strong> You will be called by interested applicants to connect them to your landlord or property manager.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Question 2 */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
              Landlord Contact
            </label>
            <h3 className="text-sm font-poppins-bold text-slate-800 leading-snug mt-1">
              Do you have your caretaker or Landlord contact details?
            </h3>
            <p className="text-slate-400 mt-1 text-xs font-poppins-regular">
              Having this contact helps our engine prioritize your request.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setHasContact(true)}
              className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
                hasContact === true
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]'
                  : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
              }`}
            >
              {hasContact === true && <CheckCircle2 size={15} />}
              Yes, I have it
            </button>
            <button
              onClick={() => setHasContact(false)}
              className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
                hasContact === false
                  ? 'border-slate-400 bg-slate-50 text-slate-600 shadow-[0_0_0_4px_rgba(148,163,184,0.1)]'
                  : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
              }`}
            >
              {hasContact === false && <CheckCircle2 size={15} />}
              Not yet
            </button>
          </div>
        </div>

 {/* Divider */}
<div className="h-px bg-slate-100" />

{/* Question 3 */}
<div className="space-y-3">
  <div>
    <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
      Incoming Calls
    </label>
    <h3 className="text-sm font-poppins-bold text-slate-800 leading-snug mt-1">
      Are you open to receiving calls from tenants interested in your apartment?
    </h3>
    <p className="text-slate-400 mt-1 text-xs font-poppins-regular">
      Allowing calls increases your chances of finding a match faster.
    </p>
  </div>

  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => setAllowCalls(true)}
      className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
        allowCalls === true
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]'
          : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
      }`}
    >
      {allowCalls === true && <CheckCircle2 size={15} />}
      Yes, I'm open
    </button>
    <button
      onClick={() => setAllowCalls(false)}
      className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
        allowCalls === false
          ? 'border-red-400 bg-red-50 text-red-600 shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
          : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
      }`}
    >
      {allowCalls === false && <CheckCircle2 size={15} />}
      No, not now
    </button>
  </div>

  <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex gap-3 items-start">
    <ShieldCheck className="text-amber-500 flex-shrink-0 mt-0.5" size={15} />
    <p className="text-amber-800 text-xs font-poppins-regular leading-relaxed">
      <strong className="font-poppins-bold">Note:</strong> Your number will only be shared with verified tenants who express interest in your listing.
    </p>
  </div>
</div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-3.5 rounded-xl text-xs font-poppins-medium">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleComplete}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-3.5 font-poppins-bold text-white text-sm shadow-[0_4px_16px_rgba(5,150,105,0.4)] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(5,150,105,0.5)] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-none"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <span className="relative flex items-center justify-center gap-2 tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Continue to Swap Engine
          </span>
        </button>

        <div className="flex items-center gap-2 justify-center text-slate-400 text-xs font-poppins-regular">
          <Info size={13} />
          <span>Your answers help us find the perfect match for your relocation.</span>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

export default Onboarding;
