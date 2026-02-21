"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyType, Location, Timeline, SwapRequest } from '@/shared/types';
import { PROPERTY_TYPES, LOCATIONS, TIMELINES, FEATURES } from '@/constants';
import GuestLayout from '@/app/GuestLayout';
import { FormData } from '@/app/register/page';
import { CheckSquare, Square, X } from 'lucide-react';
import { Alert } from '@heroui/alert';
import { z } from 'zod';

type AuthenticatedUser = FormData & SwapRequest;

// ─── schema ──────────────────────────────────────────────────────────────────

const swapSchema = z.object({
  // Looking For
  lookingType: z.enum(PROPERTY_TYPES, 'Select a valid property type'),
  lookingLoc: z.enum(LOCATIONS, 'Select a valid location'),
  budget: z
    .number('Budget must be a number')
    .positive('Budget must be greater than ₦0')
    .max(100_000_000, 'Budget seems too high — please double check'),
  timeline: z.enum(TIMELINES, 'Select a valid property type'),

  // Leaving From
  leavingType: z.enum(PROPERTY_TYPES, 'Select a valid property type'),
  leavingLoc: z.enum(LOCATIONS, 'Select a valid property type'),
  vacancyDate: z
    .string()
    .min(1, 'Please select an availability date')
    .refine(
      d => new Date(d) >= new Date(new Date().toDateString()),
      'Availability date cannot be in the past'
    ),

  features: z.array(z.string()).min(1, 'Please select at least one home feature'),
}).refine(
  data => !(data.lookingType === data.leavingType && data.lookingLoc === data.leavingLoc),
  {
    message: "You can't swap for the same property type in the same location",
    path: ['lookingLoc'],
  });

type SwapFormValues = z.infer<typeof swapSchema>;

// ─── helpers ─────────────────────────────────────────────────────────────────

const randomId = () => `user-${Math.random().toString(36).substr(2, 9)}`;

// ─── component ───────────────────────────────────────────────────────────────

const DualForm: React.FC = () => {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('authenticatedUser');
    if (raw) {
      try {
        setAuthUser(JSON.parse(raw));
      } catch {
        console.error('Failed to parse authenticatedUser from localStorage');
      }
    }
  }, []);

  // ── Looking For ────────────────────────────────────────────────────────────
  const [lookingType, setLookingType] = useState<PropertyType>('2BR Flat');
  const [lookingLoc, setLookingLoc] = useState<Location>('Lagos');
  const [budget, setBudget] = useState(0);
  const [timeline, setTimeline] = useState<Timeline>('Immediate');

  // ── Leaving From ───────────────────────────────────────────────────────────
  const [leavingType, setLeavingType] = useState<PropertyType>('1BR Flat');
  const [leavingLoc, setLeavingLoc] = useState<Location>('Akure');
  const [vacancyDate, setVacancyDate] = useState('');

  // ── Features ───────────────────────────────────────────────────────────────
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Partial<Record<keyof SwapFormValues, string>>>({});
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    if (!alertMsg) return;
    const t = setTimeout(() => setAlertMsg(''), 4000);
    return () => clearTimeout(t);
  }, [alertMsg]);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const values: SwapFormValues = {
      lookingType, lookingLoc, budget, timeline,
      leavingType, leavingLoc, vacancyDate,
      features: selectedFeatures,
    };

    const result = swapSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SwapFormValues, string>> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path[0] as keyof SwapFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      setAlertMsg('Please fix the highlighted fields before continuing.');
      return;
    }

    setErrors({});
    setAlertMsg('');

    const updatedUser: AuthenticatedUser = {
      id: authUser?.id ?? randomId(),
      fullName: authUser?.fullName ?? '',
      phone: authUser?.phone ?? '',
      password: authUser?.password ?? '',
      confirmPassword: authUser?.confirmPassword ?? '',
      agreeTerms: authUser?.agreeTerms ?? false,
      email: authUser?.email,
      phoneNumber: authUser?.phoneNumber ?? '08000000000',
      lookingFor: { type: lookingType, location: lookingLoc, budget, timeline },
      leavingFrom: { type: leavingType, location: leavingLoc, vacancyDate },
      features: selectedFeatures,
      canConnectLandlord: authUser?.canConnectLandlord ?? false,
      hasLandlordContact: authUser?.hasLandlordContact ?? false,
      onboardingComplete: authUser?.onboardingComplete ?? false,
    };

    localStorage.setItem('authenticatedUser', JSON.stringify(updatedUser));
    localStorage.setItem('userRequest', JSON.stringify(updatedUser));
    setAuthUser(updatedUser);
    router.push('/dashboard');
  };

  // ── field class helpers ────────────────────────────────────────────────────

  const fieldClass = (key: keyof SwapFormValues) =>
    `w-full p-4 rounded-xl border outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] ${errors[key]
      ? 'border-red-400 focus:border-red-500'
      : 'border-slate-200 focus:border-emerald-500'
    }`;

  const ErrorMsg = ({ field }: { field: keyof SwapFormValues }) =>
    errors[field]
      ? <p className="text-red-500 text-xs mt-1 font-poppins-medium">{errors[field]}</p>
      : null;

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <GuestLayout>
      {/* Alert — fixed top-right, same pattern as Register */}
      {alertMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-md">
          <Alert
            color="danger"
            variant="solid"
            isVisible={true}
            onClose={() => setAlertMsg('')}
            classNames={{
              base: 'shadow-2xl rounded-2xl border border-red-500/20 bg-red-500 animate-in fade-in slide-in-from-top-2 duration-300',
            }}
          >
            <div className="flex items-center gap-3">
              <X size={20} className="rounded-sm text-red-500 bg-white flex-shrink-0" />
              <span className="text-white font-poppins-bold">{alertMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-poppins-bold text-slate-900 mb-4">Set Your Swap Engine</h2>
          <p className="text-slate-500 font-poppins-regular">Tell us where you are and where you want to be.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">

          {/* ── Section 1: Looking For ─────────────────────────────────── */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-poppins-bold">1</div>
              <h3 className="text-2xl font-poppins-bold text-slate-800">Looking For</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Preferred Property Type</label>
                <select value={lookingType} onChange={e => setLookingType(e.target.value as PropertyType)} className={fieldClass('lookingType')}>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ErrorMsg field="lookingType" />
              </div>

              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Desired City/Area</label>
                <select value={lookingLoc} onChange={e => setLookingLoc(e.target.value as Location)} className={fieldClass('lookingLoc')}>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ErrorMsg field="lookingLoc" />
              </div>

              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Max Budget (₦ / Yearly)</label>
                <input
                  type="number"
                  value={budget || ''}
                  onChange={e => setBudget(Number(e.target.value))}
                  placeholder="800,000"
                  className={fieldClass('budget')}
                />
                <ErrorMsg field="budget" />
              </div>

              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Timeline</label>
                <select value={timeline} onChange={e => setTimeline(e.target.value as Timeline)} className={fieldClass('timeline')}>
                  {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ErrorMsg field="timeline" />
              </div>
            </div>
          </div>

          {/* ── Section 2: Leaving From ────────────────────────────────── */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-poppins-bold">2</div>
              <h3 className="text-2xl font-poppins-bold text-slate-800">Leaving From</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Current Property Type</label>
                <select value={leavingType} onChange={e => setLeavingType(e.target.value as PropertyType)} className={fieldClass('leavingType')}>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ErrorMsg field="leavingType" />
              </div>

              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Current City/Area</label>
                <select value={leavingLoc} onChange={e => setLeavingLoc(e.target.value as Location)} className={fieldClass('leavingLoc')}>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ErrorMsg field="leavingLoc" />
              </div>

              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Available On</label>
                <input
                  type="date"
                  value={vacancyDate}
                  onChange={e => setVacancyDate(e.target.value)}
                  className={fieldClass('vacancyDate')}
                />
                <ErrorMsg field="vacancyDate" />
              </div>
            </div>

            {/* Features */}
            <div className="mt-10">
              <label className="block text-sm font-poppins-medium text-slate-600 mb-4">
                Home Features <span className="text-slate-400">(Check all that apply)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {FEATURES.map(feat => (
                  <label
                    key={feat}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedFeatures.includes(feat)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-poppins-bold'
                        : 'border-slate-200 text-slate-500 font-poppins-regular'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedFeatures.includes(feat)}
                      onChange={() => toggleFeature(feat)}
                    />
                    {selectedFeatures.includes(feat) ? <CheckSquare size={20} /> : <Square size={20} />}
                    {feat}
                  </label>
                ))}
              </div>
              <ErrorMsg field="features" />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-emerald-600 text-white px-12 py-5 rounded-2xl text-xl font-poppins-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30"
            >
              Find My Swap Chain
            </button>
          </div>
        </form>
      </div>
    </GuestLayout>
  );
};

export default DualForm;