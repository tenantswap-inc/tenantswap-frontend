"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PROPERTY_TYPES, TIMELINES, FEATURES } from '@/constants';
import { CheckSquare, Square, X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Alert } from '@heroui/alert';
import { z } from 'zod';
import StepHeader from '@/components/Stepper';
import { BinocularsIcon, DoorOpenIcon } from 'lucide-react';
import { Client } from '@/shared/utils/ApiClient';
import { useToken, unsetToken } from '@/shared/hooks/useToken';
import type { Location, UserSwapListing } from '@/shared/types';
import {
  ALLOWED_SWAP_STATES,
  formatSwapLocation,
  getAllowedSwapCities,
  getSwapAreasForCity,
  parseStoredSwapLocation,
} from '@/shared/utils/swapLocationMeta';

// ─── types ────────────────────────────────────────────────────────────────────

type PropertyType = typeof PROPERTY_TYPES[number]
type Timeline = typeof TIMELINES[number]

// ─── schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  desiredType: z.enum(PROPERTY_TYPES as [string, ...string[]], 'Select a property type'),
  desiredState: z.enum(ALLOWED_SWAP_STATES, 'Select a state'),
  desiredCity: z.string().trim().min(1, 'Select a city'),
  maxBudget: z
    .number('Budget must be a number')
    .positive('Budget must be greater than ₦0')
    .max(100_000_000, 'Budget seems too high — please double check'),
  timeline: z.enum(TIMELINES as [string, ...string[]], 'Select a timeline'),
}).superRefine((data, ctx) => {
  if (!getAllowedSwapCities(data.desiredState).includes(data.desiredCity)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['desiredCity'],
      message: 'Select a valid city',
    })
  }
})

const step2Schema = z.object({
  currentType: z.enum(PROPERTY_TYPES as [string, ...string[]], 'Select a property type'),
  currentState: z.enum(ALLOWED_SWAP_STATES, 'Select a state'),
  currentCity: z.string().trim().min(1, 'Select a city'),
  currentArea: z.string().trim().optional(),
  currentAvailable: z.boolean('Please indicate if the apartment is available'),
  currentRent: z.number('Rent must be a number').positive('Rent must be greater than ₦0'),
  currentAvailableOn: z.string().optional(),
  features: z.array(z.string()).min(1, 'Please select at least one home feature'),
})
  .superRefine((data, ctx) => {
    if (!getAllowedSwapCities(data.currentState).includes(data.currentCity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentCity'],
        message: 'Select a valid city',
      })
    }

    const areas = getSwapAreasForCity(data.currentState, data.currentCity)

    if (areas.length > 0) {
      if (!data.currentArea) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentArea'],
          message: 'Select an area',
        })
        return
      }

      if (!areas.includes(data.currentArea)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentArea'],
          message: 'Select a valid area',
        })
      }
    }
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

interface UpdateEngineProps {
  listing: UserSwapListing;
  setListing: (listing: UserSwapListing | null) => void;
  successMsg: string;
  setSuccessMsg: (msg: string) => void;
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

const UpdateEngine: React.FC<UpdateEngineProps> = ({ listing, setListing, successMsg, setSuccessMsg }) => {
  const router = useRouter()
  const { token } = useToken()
  const desiredLocation = parseStoredSwapLocation(
    listing.desiredState && listing.desiredCity
      ? [listing.desiredCity, listing.desiredState].filter(Boolean).join(', ')
      : listing.desiredCity
  )
  const currentLocation = parseStoredSwapLocation(
    listing.currentState && listing.currentCity
      ? [listing.currentArea, listing.currentCity, listing.currentState].filter(Boolean).join(', ')
      : listing.currentCity
  )


  const [desiredType, setDesiredType] = useState<PropertyType>(listing.desiredType as PropertyType)
  const [desiredState, setDesiredState] = useState<Location>((listing.desiredState as Location) || desiredLocation.state)
  const [desiredCity, setDesiredCity] = useState(listing.desiredCity || desiredLocation.city)

  const [maxBudget, setMaxBudget] = useState<number>(listing.maxBudget)
  const [budgetDisplay, setBudgetDisplay] = useState(listing.maxBudget.toLocaleString('en-NG'))
  const [timeline, setTimeline] = useState<Timeline>(listing.timeline as Timeline)

  const [currentType, setCurrentType] = useState<PropertyType>(listing.currentType as PropertyType)
  const [currentState, setCurrentState] = useState<Location>((listing.currentState as Location) || currentLocation.state)
  const [currentCity, setCurrentCity] = useState(listing.currentCity || currentLocation.city)
  const [currentArea, setCurrentArea] = useState(listing.currentArea || currentLocation.area)

  const [currentAvailable, setCurrentAvailable] = useState<boolean | null>(listing.currentAvailable)
  const [currentAvailableOn, setCurrentAvailableOn] = useState(toDateInputValue(listing.currentAvailableOn))
  const [currentRent, setCurrentRent] = useState<number | null>(listing.currentRent)
  const [currentRentDisplay, setCurrentRentDisplay] = useState(listing.currentRent.toLocaleString('en-NG'))
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(listing.features)

  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<AllErrors>({})
  const [alertMsg, setAlertMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const desiredCities = getAllowedSwapCities(desiredState)
  const currentCities = getAllowedSwapCities(currentState)
  const currentAreas = getSwapAreasForCity(currentState, currentCity)

  useEffect(() => {
    if (!alertMsg) return
    const t = setTimeout(() => setAlertMsg(''), 4000)
    return () => clearTimeout(t)
  }, [alertMsg])

  const toggleFeature = (f: string) =>
    setSelectedFeatures(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )

  const goNext = () => {
    if (step === 0) {
      const result = step1Schema.safeParse({ desiredType, desiredState, desiredCity, maxBudget, timeline })
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
        currentState,
        currentCity,
        currentArea,
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

  const handleSubmit = async () => {
    if (!token) {
      router.push('/login')
      return
    }

    const payload = {
      desiredType,
      desiredState,
      desiredCity,
      desiredArea: null,
      maxBudget,
      timeline,
      currentRent,
      currentType,
      currentState,
      currentCity,
      currentArea: currentArea || null,
      currentAvailable,
      currentAvailableOn: currentAvailable ? new Date(currentAvailableOn).toISOString() : null,
      features: selectedFeatures,
    }


    setLoading(true)

    try {
      const response = await Client.patch(`/listings/${listing.id}`, payload, {
        Authorization: `Bearer ${token}`,
      })

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg('Your swap has been updated successfully!')
        setListing(null)
        return
      }
      if (response.status === 204) {
        setSuccessMsg(response.data.message)
        setListing(null)
        return
      }

      if (response.status === 401) {
        unsetToken()
        router.push('/login')
        return
      }

      if (response.status === 403) {
        setAlertMsg('You do not have permission to update this listing.')
        return
      }

      if (response.status === 404) {
        setAlertMsg('Listing not found. It may have been deleted.')
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
      console.error('Listing update error:', e)
      setAlertMsg('Unable to reach the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const isAvailableOnStale =
    listing.currentAvailable === true &&
    !!listing.currentAvailableOn &&
    new Date(listing.currentAvailableOn) < new Date()

  const fc = (key: keyof AllErrors, forceHighlight = false) =>
    `w-full p-4 rounded-xl border outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] ${
      errors[key] || forceHighlight
        ? 'border-red-400 focus:border-red-500'
        : 'border-slate-200 focus:border-emerald-500'
    }`

  const Err = ({ field }: { field: keyof AllErrors }) =>
    errors[field]
      ? <p className="text-red-500 text-xs mt-1 font-poppins-medium">{errors[field]}</p>
      : null

  return (
    <div>
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

      {successMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-md">
          <Alert
            color="success"
            variant="solid"
            isVisible
            onClose={() => { setSuccessMsg(''); setListing(null); }}
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

      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-poppins-bold text-slate-900 mb-4">Update Your Swap</h2>
          <p className="text-slate-500 font-poppins-regular">Make changes to your existing swap request.</p>
        </div>

        <StepHeader current={step} />

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[420px] flex flex-col">
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
                  <select
                    value={desiredState}
                    onChange={e => {
                      setDesiredState(e.target.value as Location)
                      setDesiredCity('')
                      setDesiredArea('')
                    }}
                    className={fc('desiredState')}
                  >
                    <option value="No Option" disabled>Select state…</option>
                    {ALLOWED_SWAP_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <Err field="desiredState" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Desired City</label>
                  <select
                    value={desiredCity}
                    onChange={e => {
                      setDesiredCity(e.target.value)
                    }}
                    disabled={desiredState === 'No Option'}
                    className={fc('desiredCity')}
                  >
                    <option value="" disabled>{desiredState === 'No Option' ? 'Select state first…' : 'Select city…'}</option>
                    {desiredCities.map(city => <option key={city} value={city}>{city}</option>)}
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
                  <select
                    value={currentState}
                    onChange={e => {
                      setCurrentState(e.target.value as Location)
                      setCurrentCity('')
                      setCurrentArea('')
                    }}
                    className={fc('currentState')}
                  >
                    <option value="No Option" disabled>Select state…</option>
                    {ALLOWED_SWAP_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <Err field="currentState" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Current City</label>
                  <select
                    value={currentCity}
                    onChange={e => {
                      setCurrentCity(e.target.value)
                      setCurrentArea('')
                    }}
                    disabled={currentState === 'No Option'}
                    className={fc('currentCity')}
                  >
                    <option value="" disabled>{currentState === 'No Option' ? 'Select state first…' : 'Select city…'}</option>
                    {currentCities.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                  <Err field="currentCity" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Current Area / Region</label>
                  <select
                    value={currentArea}
                    onChange={e => setCurrentArea(e.target.value)}
                    disabled={!currentCity || currentAreas.length === 0}
                    className={fc('currentArea')}
                  >
                    <option value="" disabled>
                      {!currentCity ? 'Select city first…' : currentAreas.length === 0 ? 'No areas configured yet' : 'Select area…'}
                    </option>
                    {currentAreas.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
                  <Err field="currentArea" />
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Is the apartment available?</label>
                  {isAvailableOnStale && !errors.currentAvailable && (
                    <p className="text-xs font-poppins-medium text-red-500 mb-1.5">
                      Your listed available date has passed — please update or mark as unavailable.
                    </p>
                  )}
                  <select
                    value={currentAvailable === null ? 'No Option' : String(currentAvailable)}
                    onChange={e => { setCurrentAvailable(e.target.value === 'true'); if (e.target.value === 'false') setCurrentAvailableOn('') }}
                    className={fc('currentAvailable', isAvailableOnStale)}
                  >
                    <option value="No Option" disabled>Select…</option>
                    <option value="true">Yes, it is available</option>
                    <option value="false">No, not yet</option>
                  </select>
                  <Err field="currentAvailable" />
                </div>

                {currentAvailable !== false && (
                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">Available On</label>
                    <input
                      type="date"
                      value={currentAvailableOn}
                      onChange={e => setCurrentAvailableOn(e.target.value)}
                      className={fc('currentAvailableOn', isAvailableOnStale)}
                    />
                    <Err field="currentAvailableOn" />
                  </div>
                )}
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

          {step === 2 && (
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">Confirm Your Changes</h3>
                <p className="text-sm text-slate-400 font-poppins-regular">Review your updates before saving.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[10px] font-poppins-bold text-emerald-600 uppercase tracking-widest mb-3">Looking For</p>
                  <p className="font-poppins-bold text-slate-800">{desiredType}</p>
                  <p className="text-slate-500 font-poppins-regular text-sm mt-1">{formatSwapLocation(desiredState, desiredCity, null)}</p>
                  <p className="text-slate-500 font-poppins-regular text-sm">₦{maxBudget.toLocaleString()} / yr</p>
                  <p className="text-slate-500 font-poppins-regular text-sm">{timeline}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-widest mb-3">Leaving From</p>
                  <p className="font-poppins-bold text-slate-800">{currentType}</p>
                  <p className="text-slate-500 font-poppins-regular text-sm mt-1">{formatSwapLocation(currentState, currentCity, currentArea)}</p>
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

          <div className="flex mt-8 pt-6 border-t border-slate-100 justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-poppins-medium cursor-pointer transition-all duration-300 ease-out hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )
              :
              (
                <button
                  type="button"
                  onClick={() => setListing(null)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-poppins-medium cursor-pointer transition-all duration-300 ease-out hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Back to Dashboard
                </button>
              )
            }

            {step < 2 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold cursor-pointer transition-all duration-300 ease-out shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98]"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold cursor-pointer transition-all duration-300 ease-out shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Save Changes <ChevronRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateEngine
