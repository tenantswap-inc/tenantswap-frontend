'use client';

import React, { useMemo, useRef, useState } from 'react';
import { PhoneCall, Info, CheckCircle2, AlertCircle, ShieldCheck, Briefcase, ChevronRight, ChevronLeft, Camera, X } from 'lucide-react';
import Image from 'next/image';
import type { RegisteredUser } from '@/app/register/page';
import {
  ALLOWED_SWAP_STATES,
  getAllowedSwapCities,
  getSwapAreasForCity,
} from '@/shared/utils/swapLocationMeta';
import type { Location } from '@/shared/types';

interface OnboardingProps {
  currentUser: RegisteredUser | null;
  onComplete: (updatedUser: RegisteredUser) => void;
  isLoading?: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ currentUser, onComplete, isLoading = false }) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [canConnect, setCanConnect] = useState<boolean | null>(null);
  const [hasContact, setHasContact] = useState<boolean | null>(null);
  const [allowCalls, setAllowCalls] = useState<boolean | null>(null);

  // Step 2 fields (all optional)
  const [workplaceName, setWorkplaceName] = useState('');
  const [workplaceState, setWorkplaceState] = useState<Location>('No Option');
  const [workplaceCity, setWorkplaceCity] = useState('');
  const [workplaceArea, setWorkplaceArea] = useState('');

  // Profile photo (optional)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');

  const cities = useMemo(() => getAllowedSwapCities(workplaceState), [workplaceState]);
  const areas = useMemo(() => getSwapAreasForCity(workplaceState, workplaceCity), [workplaceState, workplaceCity]);

  const handleStep1Next = () => {
    if (canConnect === null || hasContact === null || allowCalls === null) {
      setError('Please answer all questions to continue.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleComplete = (skip = false) => {
    if (!currentUser) return;
    // Store pending profile photo in sessionStorage for upload after first login
    if (!skip && photoPreview && photoMime) {
      try {
        sessionStorage.setItem('pending_profile_photo_data', photoPreview);
        sessionStorage.setItem('pending_profile_photo_mime', photoMime);
      } catch { /* quota exceeded — skip */ }
    }
    const updatedUser: RegisteredUser = {
      ...currentUser,
      canConnectLandlord: canConnect!,
      hasLandlordContact: hasContact!,
      allowIncomingCalls: allowCalls!,
      ...(!skip && workplaceName.trim() ? { workplaceName: workplaceName.trim() } : {}),
      ...(!skip && workplaceState !== 'No Option' ? { workplaceState } : {}),
      ...(!skip && workplaceCity ? { workplaceCity } : {}),
      ...(!skip && workplaceArea ? { workplaceArea } : {}),
    };
    onComplete(updatedUser);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
      setPhotoMime(file.type);
    };
    reader.readAsDataURL(file);
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
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4" />
            <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/40" />
            <div className="absolute top-10 right-10 w-1 h-1 rounded-full bg-white/30" />

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                <Image src="/assets/TenantSwap Logo Monochrome.svg" alt="TenantSwap" width={40} height={40} quality={100} />
              </div>
              <div>
                <p className="text-emerald-200 text-xs font-poppins-medium tracking-widest uppercase mb-0.5">
                  Step {step} of 2
                </p>
                <h2 className="text-2xl font-poppins-bold text-white leading-tight">
                  {step === 1 ? 'Set Up Your Profile' : 'Workplace Info'}
                </h2>
              </div>
            </div>

            <p className="relative text-emerald-100/80 text-sm font-poppins-regular mt-3 leading-relaxed">
              {step === 1
                ? "Let's set up your profile for successful matching."
                : 'Help us prioritize listings near your workplace. Totally optional.'}
            </p>

            {/* Step dots */}
            <div className="relative flex items-center gap-2 mt-4">
              <div className="w-6 h-1.5 rounded-full bg-white" />
              <div className={`w-6 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
          </div>

          {/* Wave divider */}
          <div className="-mt-6 relative z-10">
            <svg viewBox="0 0 400 24" className="w-full fill-white" preserveAspectRatio="none" height="24">
              <path d="M0,24 L0,12 Q100,0 200,12 Q300,24 400,12 L400,24 Z" />
            </svg>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="px-8 pb-8 -mt-2 space-y-8">

              {/* Question 1 */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Landlord Connection</label>
                  <h3 className="text-sm font-poppins-bold text-slate-800 leading-snug mt-1">
                    Are you fine with connecting an incoming Tenant to the Landlord of your apartment?
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val) => (
                    <button key={String(val)} onClick={() => setCanConnect(val)}
                      className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        canConnect === val
                          ? val ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]'
                                : 'border-red-400 bg-red-50 text-red-600 shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                          : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
                      }`}>
                      {canConnect === val && <CheckCircle2 size={15} />}
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex gap-3 items-start">
                  <PhoneCall className="text-amber-500 flex-shrink-0 mt-0.5" size={15} />
                  <p className="text-amber-800 text-xs font-poppins-regular leading-relaxed">
                    <strong className="font-poppins-bold">Note:</strong> You will be called by interested applicants to connect them to your landlord or property manager.
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Question 2 */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Landlord Contact</label>
                  <h3 className="text-sm font-poppins-bold text-slate-800 leading-snug mt-1">
                    Do you have your caretaker or Landlord contact details?
                  </h3>
                  <p className="text-slate-400 mt-1 text-xs font-poppins-regular">Having this contact helps our engine prioritize your request.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([true, false] as const).map((val) => (
                    <button key={String(val)} onClick={() => setHasContact(val)}
                      className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        hasContact === val
                          ? val ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]'
                                : 'border-slate-400 bg-slate-50 text-slate-600 shadow-[0_0_0_4px_rgba(148,163,184,0.1)]'
                          : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
                      }`}>
                      {hasContact === val && <CheckCircle2 size={15} />}
                      {val ? 'Yes, I have it' : 'Not yet'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Question 3 */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Incoming Calls</label>
                  <h3 className="text-sm font-poppins-bold text-slate-800 leading-snug mt-1">
                    Are you open to receiving calls from tenants interested in your apartment?
                  </h3>
                  <p className="text-slate-400 mt-1 text-xs font-poppins-regular">Allowing calls increases your chances of finding a match faster.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([true, false] as const).map((val) => (
                    <button key={String(val)} onClick={() => setAllowCalls(val)}
                      className={`py-3.5 rounded-xl border-2 font-poppins-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        allowCalls === val
                          ? val ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]'
                                : 'border-red-400 bg-red-50 text-red-600 shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                          : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/60'
                      }`}>
                      {allowCalls === val && <CheckCircle2 size={15} />}
                      {val ? "Yes, I'm open" : 'No, not now'}
                    </button>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex gap-3 items-start">
                  <ShieldCheck className="text-amber-500 flex-shrink-0 mt-0.5" size={15} />
                  <p className="text-amber-800 text-xs font-poppins-regular leading-relaxed">
                    <strong className="font-poppins-bold">Note:</strong> Your number will only be shared with verified tenants who express interest in your listing.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-3.5 rounded-xl text-xs font-poppins-medium">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button onClick={handleStep1Next}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-3.5 font-poppins-bold text-white text-sm shadow-[0_4px_16px_rgba(5,150,105,0.4)] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(5,150,105,0.5)] hover:-translate-y-0.5 active:scale-[0.98]">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative flex items-center justify-center gap-2 tracking-wide">
                  Next <ChevronRight size={16} />
                </span>
              </button>

              <div className="flex items-center gap-2 justify-center text-slate-400 text-xs font-poppins-regular">
                <Info size={13} />
                <span>Your answers help us find the perfect match for your relocation.</span>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="px-8 pb-8 -mt-2 space-y-6">
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <Briefcase className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-emerald-800 text-xs font-poppins-regular leading-relaxed">
                  Adding your workplace helps us surface listings closer to your office. All fields are optional — you can always fill this in later from Settings.
                </p>
              </div>

              {/* Profile photo */}
              <div className="space-y-2">
                <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <Camera size={22} className="text-slate-300" />
                      </div>
                    )}
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(null); setPhotoMime(''); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-poppins-medium text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all text-left"
                    >
                      {photoPreview ? 'Change photo…' : 'Upload a photo…'}
                    </button>
                    <p className="text-[10px] text-slate-400 font-poppins-regular mt-1">JPEG, PNG or WebP · optional</p>
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Workplace name */}
              <div className="space-y-1.5">
                <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Company / Organisation</label>
                <input
                  type="text"
                  placeholder="e.g. Access Bank, NNPC, University of Lagos"
                  value={workplaceName}
                  onChange={(e) => setWorkplaceName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300"
                />
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">State</label>
                <select
                  value={workplaceState}
                  onChange={(e) => { setWorkplaceState(e.target.value as Location); setWorkplaceCity(''); setWorkplaceArea(''); }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value="No Option">Select state…</option>
                  {ALLOWED_SWAP_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* City */}
              {workplaceState !== 'No Option' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">City</label>
                  <select
                    value={workplaceCity}
                    onChange={(e) => { setWorkplaceCity(e.target.value); setWorkplaceArea(''); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="">Select city…</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* Area */}
              {workplaceCity && areas.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Area / Neighbourhood</label>
                  <select
                    value={workplaceArea}
                    onChange={(e) => setWorkplaceArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="">Select area…</option>
                    {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-poppins-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft size={15} /> Back
                </button>

                <button
                  onClick={() => handleComplete(false)}
                  disabled={isLoading}
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-3.5 font-poppins-bold text-white text-sm shadow-[0_4px_16px_rgba(5,150,105,0.4)] transition-all hover:shadow-[0_8px_28px_rgba(5,150,105,0.5)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Completing…</>
                    ) : 'Complete Registration'}
                  </span>
                </button>
              </div>

              <button
                onClick={() => handleComplete(true)}
                disabled={isLoading}
                className="w-full text-center text-xs font-poppins-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Onboarding;
