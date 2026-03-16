"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PROPERTY_TYPES, LOCATIONS, TIMELINES, FEATURES } from '@/constants';
import GuestLayout from '@/app/GuestLayout';
import { CheckSquare, Square, X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Alert } from '@heroui/alert';
import { z } from 'zod';
import StepHeader from '@/components/Stepper';
import { BinocularsIcon, DoorOpenIcon } from 'lucide-react';
import { Client } from '@/shared/utils/ApiClient';
import { useToken, unsetToken } from '@/shared/hooks/useToken';

// ─── types ────────────────────────────────────────────────────────────────────

type PropertyType = typeof PROPERTY_TYPES[number]
type Location = typeof LOCATIONS[number]
type Timeline = typeof TIMELINES[number]

// ─── schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  desiredType: z.enum(PROPERTY_TYPES as [string, ...string[]], 'Select a property type'),
  desiredCity: z.enum(LOCATIONS as [string, ...string[]], 'Select a location'),
  maxBudget: z
    .number('Budget must be a number')
    .positive('Budget must be greater than ₦0')
    .max(100_000_000, 'Budget seems too high — please double check'),
  timeline: z.enum(TIMELINES as [string, ...string[]], 'Select a timeline'),
});

const step2Schema = z.object({
  currentType: z.enum(PROPERTY_TYPES as [string, ...string[]], 'Select a property type'),
  currentCity: z.enum(LOCATIONS as [string, ...string[]], 'Select a location'),
  currentAvailable: z.boolean('Please indicate if the apartment is available'),
  currentRent: z.number('Rent must be a number').positive('Rent must be greater than ₦0'),
  currentAvailableOn: z.string().optional(),
  features: z.array(z.string()).min(1, 'Please select at least one home feature'),
})
  .refine(
    data => {
      if (data.currentAvailable === true) {
        return !!data.currentAvailableOn && data.currentAvailableOn.length > 0
      }
      return true
    },
    { message: 'Please select an availability date', path: ['currentAvailableOn'] }
  )
  .refine(
    data => {
      if (data.currentAvailable === true && data.currentAvailableOn) {
        return new Date(data.currentAvailableOn) >= new Date(new Date().toDateString())
      }
      return true
    },
    { message: 'Availability date cannot be in the past', path: ['currentAvailableOn'] }
  )

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>
type AllErrors = Partial<Record<keyof Step1Values | keyof Step2Values, string>>

// ─── component ────────────────────────────────────────────────────────────────

const Engine: React.FC = () => {
  const router = useRouter()
   const token = useToken()

  // ── Step 1 fields ──────────────────────────────────────────────────────────
  const [desiredType, setDesiredType] = useState<PropertyType>('No Option')
  const [desiredCity, setDesiredCity] = useState<Location>('No Option')
  const [maxBudget, setMaxBudget] = useState<number>(0)
  const [budgetDisplay, setBudgetDisplay] = useState('')
  const [timeline, setTimeline] = useState<Timeline>('No Option')

  // ── Step 2 fields ──────────────────────────────────────────────────────────
  const [currentType, setCurrentType] = useState<PropertyType>('No Option')
  const [currentCity, setCurrentCity] = useState<Location>('No Option')
  const [currentAvailable, setCurrentAvailable] = useState<boolean | null>(null)
  const [currentAvailableOn, setCurrentAvailableOn] = useState('')
  const [currentRent, setCurrentRent] = useState<number | null>(null)
  const [currentRentDisplay, setCurrentRentDisplay] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // ── UI state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<AllErrors>({})
  const [alertMsg, setAlertMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!alertMsg) return
    const t = setTimeout(() => setAlertMsg(''), 4000)
    return () => clearTimeout(t)
  }, [alertMsg])

  const toggleFeature = (f: string) =>
    setSelectedFeatures(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 0) {
      const result = step1Schema.safeParse({ desiredType, desiredCity, maxBudget, timeline })
      if (!result.success) {
        const errs: AllErrors = {}
        result.error.issues.forEach(i => { errs[i.path[0] as keyof AllErrors] = i.message })
        setErrors(errs)
        setAlertMsg('Please fix the highlighted fields before continuing.')
        return
      }
      setErrors({})
      setAlertMsg('')
      setStep(1)

    } else if (step === 1) {
      const result = step2Schema.safeParse({
        currentType,
        currentCity,
        currentAvailable,
        currentRent,
        currentAvailableOn: currentAvailableOn || undefined,
        features: selectedFeatures,
      })
      if (!result.success) {
        const errs: AllErrors = {}
        result.error.issues.forEach(i => { errs[i.path[0] as keyof AllErrors] = i.message })
        setErrors(errs)
        setAlertMsg('Please fix the highlighted fields before continuing.')
        return
      }
      setErrors({})
      setAlertMsg('')
      setStep(2)
    }
  }

  const goBack = () => {
    setErrors({})
    setAlertMsg('')
    setStep(s => s - 1)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!token) {
      router.push('/login')
      return
    }

    const payload = {
      desiredType,
      desiredCity,
      maxBudget,
      timeline,
      currentRent,
      currentType,
      currentCity,
      currentAvailable,
      currentAvailableOn: currentAvailable ? new Date(currentAvailableOn).toISOString() : null,
      features: selectedFeatures,
    }

    setLoading(true)

    console.log(payload)
    // return;

    try {
      const response = await Client.post('/listings', payload, {
        Authorization: `Bearer ${token}`,
      })

      console.log(response.data)

      if (response.status === 200 || response.status === 201) {
        router.push('/dashboard')
        return
      }

      if (response.status === 401) {

      unsetToken()

          router.push('/login')
          return


      }

      if (response.status === 403) {
        setAlertMsg('You do not have permission to create a listing.')
        return
      }

      if (response.status === 422) {
        setAlertMsg('Some fields are invalid. Please review your details.')
        return
      }

      if (response.status === 429) {
        setAlertMsg('Too many requests. Please wait a moment and try again.')
        return
      }

      setAlertMsg('Something went wrong. Please try again.')

    } catch (e) {
      console.error('Listing submit error:', e)
      setAlertMsg('Unable to reach the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Field helpers ──────────────────────────────────────────────────────────

  const fc = (key: keyof AllErrors) =>
    `w-full p-4 rounded-xl border outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] ${errors[key]
      ? 'border-red-400 focus:border-red-500'
      : 'border-slate-200 focus:border-emerald-500'
    }`

  const Err = ({ field }: { field: keyof AllErrors }) =>
    errors[field]
      ? <p className="text-red-500 text-xs mt-1 font-poppins-medium">{errors[field]}</p>
      : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <GuestLayout>
      {alertMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-md">
          <Alert
            color="danger"
            variant="solid"
            isVisible
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

      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-poppins-bold text-slate-900 mb-4">Set Your Swap Engine</h2>
          <p className="text-slate-500 font-poppins-regular">Tell us where you are and where you want to be.</p>
        </div>

        <StepHeader current={step} />

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[420px] flex flex-col">

          {/* ── Step 1: Looking For ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">Looking For</h3>
                  <p className="text-sm text-slate-400 font-poppins-regular">Where do you want to move to?</p>
                </div>
                <div className="rounded-full border p-2 shadow-xl shadow-black/20">
                  <BinocularsIcon className="text-black" size={30} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Property Type</label>
                  <select value={desiredType} onChange={e => setDesiredType(e.target.value as PropertyType)} className={fc('desiredType')}>
                    <option value="No Option" disabled>Select type…</option>
                    {PROPERTY_TYPES.filter(t => t !== 'No Option').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Err field="desiredType" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Desired State</label>
                  <select value={desiredCity} onChange={e => setDesiredCity(e.target.value as Location)} className={fc('desiredCity')}>
                    <option value="No Option" disabled>Select state…</option>
                    {LOCATIONS.filter(l => l !== 'No Option').map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <Err field="desiredCity" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Max Budget (₦ / Yearly)</label>
                  <input
                    type="text"
                    value={budgetDisplay}
                    onChange={e => {
                      const raw = e.target.value.replace(/,/g, '')
                      const num = Number(raw)
                      if (isNaN(num)) return
                      setMaxBudget(num)
                      setBudgetDisplay(num === 0 ? '' : num.toLocaleString('en-NG'))
                    }}
                    placeholder="e.g. 800,000"
                    className={fc('maxBudget')}
                  />
                  <Err field="maxBudget" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Timeline</label>
                  <select value={timeline} onChange={e => setTimeline(e.target.value as Timeline)} className={fc('timeline')}>
                    <option value="No Option" disabled>Select timeline…</option>
                    {TIMELINES.filter(t => t !== 'No Option').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Err field="timeline" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Leaving From ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">Leaving From</h3>
                  <p className="text-sm text-slate-400 font-poppins-regular">Tell us about your current home.</p>
                </div>
                <div className="rounded-full border p-2 shadow-xl shadow-black/20">
                  <DoorOpenIcon className="text-black" size={30} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Property Type</label>
                  <select value={currentType} onChange={e => setCurrentType(e.target.value as PropertyType)} className={fc('currentType')}>
                    <option value="No Option" disabled>Select type…</option>
                    {PROPERTY_TYPES.filter(t => t !== 'No Option').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Err field="currentType" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Current State</label>
                  <select value={currentCity} onChange={e => setCurrentCity(e.target.value as Location)} className={fc('currentCity')}>
                    <option value="No Option" disabled>Select state…</option>
                    {LOCATIONS.filter(l => l !== 'No Option').map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <Err field="currentCity" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Is the apartment available?</label>
                  <select
                    value={currentAvailable === null ? 'No Option' : String(currentAvailable)}
                    onChange={e => setCurrentAvailable(e.target.value === 'true')}
                    className={fc('currentAvailable')}
                  >
                    <option value="No Option" disabled>Select…</option>
                    <option value="true">Yes, it's available</option>
                    <option value="false">No, not yet</option>
                  </select>
                  <Err field="currentAvailable" />
                </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Available On</label>
                    <input
                      type="date"
                      disabled={!currentAvailable}
                      value={currentAvailableOn}
                      onChange={e => setCurrentAvailableOn(e.target.value)}
                      className={fc('currentAvailableOn')}
                    />
                    <Err field="currentAvailableOn" />
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Current Rent (₦ / Yearly)</label>
                  <input
                    type="text"
                    value={currentRentDisplay}
                    onChange={e => {
                      const raw = e.target.value.replace(/,/g, '')
                      const num = Number(raw)
                      if (isNaN(num)) return
                      setCurrentRent(num)
                      setCurrentRentDisplay(num === 0 ? '' : num.toLocaleString('en-NG'))
                    }}
                    placeholder="e.g. 800,000"
                    className={fc('currentRent')}
                  />
                  <Err field="currentRent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-poppins-medium text-slate-600 mb-3">
                  Home Features <span className="text-slate-400">(Select at least one)</span>
                </label>
                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl transition-all ${errors.features ? 'bg-red-50 border border-red-300' : ''}`}>
                  {FEATURES.map(feat => (
                    <label
                      key={feat}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${selectedFeatures.includes(feat)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-poppins-bold'
                        : 'border-slate-200 text-slate-500 font-poppins-regular'
                        }`}
                    >
                      <input type="checkbox" className="hidden" checked={selectedFeatures.includes(feat)} onChange={() => toggleFeature(feat)} />
                      {selectedFeatures.includes(feat) ? <CheckSquare size={18} /> : <Square size={18} />}
                      {feat}
                    </label>
                  ))}
                </div>
                <Err field="features" />
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">Confirm Your Swap</h3>
                <p className="text-sm text-slate-400 font-poppins-regular">Review your details before we find your match.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[10px] font-poppins-bold text-emerald-600 uppercase tracking-widest mb-3">Looking For</p>
                  <p className="font-poppins-bold text-slate-800">{desiredType}</p>
                  <p className="text-slate-500 font-poppins-regular text-sm mt-1">{desiredCity}</p>
                  <p className="text-slate-500 font-poppins-regular text-sm">₦{maxBudget.toLocaleString()} / yr</p>
                  <p className="text-slate-500 font-poppins-regular text-sm">{timeline}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-widest mb-3">Leaving From</p>
                  <p className="font-poppins-bold text-slate-800">{currentType}</p>
                  <p className="text-slate-500 font-poppins-regular text-sm mt-1">{currentCity}</p>
                  <p className="text-slate-500 font-poppins-regular text-sm">
                    {currentAvailable
                      ? `Available ${currentAvailableOn ? new Date(currentAvailableOn).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : '—'}`
                      : 'Not currently available'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-widest mb-2">Home Features</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatures.map(f => (
                    <span key={f} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-poppins-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ──────────────────────────────────────────────────── */}
          <div className={`flex mt-8 pt-6 border-t border-slate-100 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-poppins-medium hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Find My Swap Match <ChevronRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </GuestLayout>
  )
}

export default Engine