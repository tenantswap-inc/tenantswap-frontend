'use client'
import React, { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PROPERTY_TYPES, TIMELINES, FEATURES } from '@/constants'
import GuestLayout from '@/app/GuestLayout'
import {
  CheckSquare,
  Square,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Megaphone,
  Upload,
  Home,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Alert } from '@heroui/alert'
import { z } from 'zod'
import StepHeader from '@/components/Stepper'
import { BinocularsIcon, DoorOpenIcon } from 'lucide-react'
import { Client } from '@/shared/utils/ApiClient'
import { useToken, unsetToken } from '@/shared/hooks/useToken'
import type { Location, SeekerCategory, UserSwapListing } from '@/shared/types'
import posthog from 'posthog-js'
import {
  ALLOWED_SWAP_STATES,
  formatSwapLocation,
  getAllowedSwapCities,
  getSwapAreasForCity,
} from '@/shared/utils/swapLocationMeta'

// ─── types ────────────────────────────────────────────────────────────────────

type PropertyType = (typeof PROPERTY_TYPES)[number]
type Timeline = (typeof TIMELINES)[number]
type ListingMode = 'undecided' | 'SWAP' | 'SEEKING'

// ─── schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    desiredType: z.enum(
      PROPERTY_TYPES as [string, ...string[]],
      'Select a property type'
    ),
    desiredState: z.enum(ALLOWED_SWAP_STATES, 'Select a state'),
    desiredCity: z.string().trim().min(1, 'Select a city'),
    maxBudget: z
      .number('Budget must be a number')
      .positive('Budget must be greater than ₦0')
      .max(100_000_000, 'Budget seems too high — please double check'),
    timeline: z.enum(TIMELINES as [string, ...string[]], 'Select a timeline'),
  })
  .superRefine((data, ctx) => {
    if (!getAllowedSwapCities(data.desiredState).includes(data.desiredCity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['desiredCity'],
        message: 'Select a valid city',
      })
    }
  })

const step2Schema = z
  .object({
    currentType: z.enum(
      PROPERTY_TYPES as [string, ...string[]],
      'Select a property type'
    ),
    currentState: z.enum(ALLOWED_SWAP_STATES, 'Select a state'),
    currentCity: z.string().trim().min(1, 'Select a city'),
    currentArea: z.string().trim().optional(),
    currentAvailable: z.boolean(
      'Please indicate if the apartment is available'
    ),
    currentRent: z
      .number('Rent must be a number')
      .positive('Rent must be greater than ₦0'),
    currentAvailableOn: z.string().optional(),
    features: z
      .array(z.string())
      .min(1, 'Please select at least one home feature'),
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
    (data) => {
      if (data.currentAvailable === true)
        return !!data.currentAvailableOn && data.currentAvailableOn.length > 0
      return true
    },
    {
      message: 'Please select an availability date',
      path: ['currentAvailableOn'],
    }
  )
  .refine(
    (data) => {
      if (data.currentAvailable === true && data.currentAvailableOn)
        return (
          new Date(data.currentAvailableOn) >=
          new Date(new Date().toDateString())
        )
      return true
    },
    {
      message: 'Availability date cannot be in the past',
      path: ['currentAvailableOn'],
    }
  )

type VacancyKeys =
  | 'hasVacancyAlert'
  | 'vacancyApartmentType'
  | 'vacancyState'
  | 'vacancyCity'
  | 'vacancyArea'
  | 'vacancyFeatures'

const vacancySchema = z
  .object({
    hasVacancyAlert: z.boolean('Please choose Yes or No'),
    vacancyApartmentType: z.string().optional(),
    vacancyState: z.string().optional(),
    vacancyCity: z.string().optional(),
    vacancyArea: z.string().optional(),
    vacancyFeatures: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasVacancyAlert) return
    if (
      !data.vacancyApartmentType ||
      data.vacancyApartmentType === 'No Option'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vacancyApartmentType'],
        message: 'Select an apartment type',
      })
    }
    if (
      !data.vacancyState ||
      !(ALLOWED_SWAP_STATES as readonly string[]).includes(data.vacancyState)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vacancyState'],
        message: 'Select a state',
      })
      return
    }
    const vacancyCities = getAllowedSwapCities(data.vacancyState as Location)
    if (!data.vacancyCity || !vacancyCities.includes(data.vacancyCity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vacancyCity'],
        message: 'Select a valid city',
      })
    }
    const vacancyAreas = data.vacancyCity
      ? getSwapAreasForCity(data.vacancyState as Location, data.vacancyCity)
      : []
    if (vacancyAreas.length > 0) {
      if (!data.vacancyArea) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vacancyArea'],
          message: 'Select an area',
        })
      } else if (!vacancyAreas.includes(data.vacancyArea)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vacancyArea'],
          message: 'Select a valid area',
        })
      }
    }
    if (!data.vacancyFeatures || data.vacancyFeatures.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vacancyFeatures'],
        message: 'Please select at least one feature',
      })
    }
  })

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>
type AllErrors = Partial<
  Record<
    keyof Step1Values | keyof Step2Values | VacancyKeys | 'verificationFile',
    string
  >
>

// ─── seeker category config ───────────────────────────────────────────────────

const SEEKER_CATEGORIES: {
  value: SeekerCategory
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: 'NYSC',
    label: 'NYSC Corps Member',
    description: 'Being posted to a new state for national service',
    icon: <ShieldCheck size={22} />,
  },
  {
    value: 'OTHER',
    label: 'Future Resident',
    description: 'Planning to move to a new area',
    icon: <Home size={22} />,
  },
]

// ─── component ────────────────────────────────────────────────────────────────

const Engine: React.FC = () => {
  const router = useRouter()
  const { token, ready: tokenReady } = useToken()
  const [fromDashboard, setFromDashboard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Mode / seeker state ────────────────────────────────────────────────────
  const [listingMode, setListingMode] = useState<ListingMode>('undecided')
  const [seekerCategory, setSeekerCategory] = useState<SeekerCategory | null>(
    null
  )
  const [verificationFile, setVerificationFile] = useState<File | null>(null)

  const [underReview, setUnderReview] = useState(false)
  const [createdListingId, setCreatedListingId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('ts_pending_listing_id')
  })

  // ── Step 1 fields ──────────────────────────────────────────────────────────
  const [desiredType, setDesiredType] = useState<PropertyType>('No Option')
  const [desiredState, setDesiredState] = useState<Location>('No Option')
  const [desiredCity, setDesiredCity] = useState('')
  const [desiredArea, setDesiredArea] = useState('')
  const [maxBudget, setMaxBudget] = useState<number>(0)
  const [budgetDisplay, setBudgetDisplay] = useState('')
  const [timeline, setTimeline] = useState<Timeline>('No Option')

  // ── Step 2 fields (SWAP only) ──────────────────────────────────────────────
  const [currentType, setCurrentType] = useState<PropertyType>('No Option')
  const [currentState, setCurrentState] = useState<Location>('No Option')
  const [currentCity, setCurrentCity] = useState('')
  const [currentArea, setCurrentArea] = useState('')
  const [currentAvailable, setCurrentAvailable] = useState<boolean | null>(null)
  const [currentAvailableOn, setCurrentAvailableOn] = useState('')
  const [currentRent, setCurrentRent] = useState<number | null>(null)
  const [currentRentDisplay, setCurrentRentDisplay] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // ── Vacancy alert fields ───────────────────────────────────────────────────
  const [hasVacancyAlert, setHasVacancyAlert] = useState<boolean | null>(null)
  const [vacancyApartmentType, setVacancyApartmentType] =
    useState<PropertyType>('No Option')
  const [vacancyState, setVacancyState] = useState<Location>('No Option')
  const [vacancyCity, setVacancyCity] = useState('')
  const [vacancyArea, setVacancyArea] = useState('')
  const [vacancyFeatures, setVacancyFeatures] = useState<string[]>([])

  // ── UI state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<AllErrors>({})
  const [alertMsg, setAlertMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Existing listings (to skip gate for return users) ──────────────────────
  const [existingListings, setExistingListings] = useState<
    UserSwapListing[] | null
  >(null)

  const desiredCities = getAllowedSwapCities(desiredState)
  const desiredAreas = getSwapAreasForCity(desiredState, desiredCity)
  const currentCities = getAllowedSwapCities(currentState)
  const vacancyCities = getAllowedSwapCities(vacancyState)
  const currentAreas = getSwapAreasForCity(currentState, currentCity)
  const vacancyAreas = getSwapAreasForCity(vacancyState, vacancyCity)

  const maxStep = listingMode === 'SEEKING' ? 2 : 3

  const seekerSteps = ['Looking For', 'Upload Document', 'Confirm']

  useEffect(() => {
    if (!alertMsg) return
    const t = setTimeout(() => setAlertMsg(''), 4000)
    return () => clearTimeout(t)
  }, [alertMsg])

  useEffect(() => {
    setFromDashboard(window.location.search.includes('from=dashboard'))
  }, [])

  // Fetch existing listings once the token is definitively known
  // Wait for tokenReady so we never run with a null token that's just not loaded yet
  useEffect(() => {
    if (!tokenReady) return // token not determined yet — keep showing spinner
    if (!token) {
      setExistingListings([])
      return
    } // not logged in

    Client.get<{ data: { user: { listings: UserSwapListing[] } } }>(
      '/users/me',
      {},
      { Authorization: `Bearer ${token}` }
    )
      .then((res) => {
        const listings: UserSwapListing[] = res.data?.data?.user?.listings ?? []
        setExistingListings(listings)

        // Validate stored pending listing ID — discard if the listing is already
        // active or doesn't need a document (was created before the fix)
        const storedId = localStorage.getItem('ts_pending_listing_id')
        if (storedId) {
          const storedListing = listings.find((l) => l.id === storedId)
          if (
            !storedListing ||
            storedListing.status === 'ACTIVE' ||
            storedListing.verificationStatus === 'NOT_REQUIRED' ||
            storedListing.verificationStatus === 'APPROVED'
          ) {
            localStorage.removeItem('ts_pending_listing_id')
            setCreatedListingId(null)
          }
        }

        if (listings.length > 0) {
          // Determine mode from most recent non-closed listing, fallback to any
          const recent =
            listings.find((l) => l.status !== 'CLOSED') ?? listings[0]
          if (recent.listingType === 'SWAP') {
            setListingMode('SWAP')
          } else {
            setListingMode('SEEKING')
            // Pre-select seekerCategory from most recent SEEKING listing
            const lastCat =
              listings
                .filter((l) => l.listingType === 'SEEKING' && l.seekerCategory)
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )[0]?.seekerCategory ?? null
            if (lastCat) setSeekerCategory(lastCat)
          }
        }
      })
      .catch(() => setExistingListings([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenReady])

  const toggleFeature = (f: string) =>
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )

  const toggleVacancyFeature = (f: string) =>
    setVacancyFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = async () => {
    if (step === 0) {
      const result = step1Schema.safeParse({
        desiredType,
        desiredState,
        desiredCity,
        maxBudget,
        timeline,
      })
      if (!result.success) {
        const errs: AllErrors = {}
        result.error.issues.forEach((i) => {
          errs[i.path[0] as keyof AllErrors] = i.message
        })
        setErrors(errs)
        setAlertMsg('Please fix the highlighted fields before continuing.')
        return
      }
      setErrors({})
      setAlertMsg('')
      setStep(1)
    } else if (listingMode === 'SWAP' && step === 1) {
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
        result.error.issues.forEach((i) => {
          errs[i.path[0] as keyof AllErrors] = i.message
        })
        setErrors(errs)
        setAlertMsg('Please fix the highlighted fields before continuing.')
        return
      }
      setErrors({})
      setAlertMsg('')
      setStep(2)
    } else if (listingMode === 'SWAP' && step === 2) {
      if (hasVacancyAlert === null) {
        setErrors({ hasVacancyAlert: 'Please choose Yes or No' })
        setAlertMsg('Please tell us whether you know of a vacancy.')
        return
      }
      const result = vacancySchema.safeParse({
        hasVacancyAlert,
        vacancyApartmentType,
        vacancyState,
        vacancyCity,
        vacancyArea,
        vacancyFeatures,
      })
      if (!result.success) {
        const errs: AllErrors = {}
        result.error.issues.forEach((i) => {
          errs[i.path[0] as keyof AllErrors] = i.message
        })
        setErrors(errs)
        setAlertMsg(
          'Please fix the highlighted vacancy fields before continuing.'
        )
        return
      }
      setErrors({})
      setAlertMsg('')
      setStep(3)
    } else if (listingMode === 'SEEKING' && step === 1) {
      // Document upload is required for ALL seeker categories
      if (!verificationFile) {
        setErrors({ verificationFile: 'Please upload a supporting document' })
        setAlertMsg('Please upload your supporting document before continuing.')
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
    setStep((s) => s - 1)
  }

  const handleCancel = () => {
    // Always go to dashboard if the user is logged in — router.back() can land
    // on /login if that was the previous page, which looks like a logout
    if (token) {
      router.push('/dashboard')
      return
    }
    router.back()
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!token) {
      router.push('/login')
      return
    }

    const isSeeking = listingMode === 'SEEKING'

    const payload = isSeeking
      ? {
          listingType: 'SEEKING',
          seekerCategory,
          desiredType,
          desiredState,
          desiredCity,
          desiredArea: desiredArea || null,
          maxBudget,
          timeline,
        }
      : {
          listingType: 'SWAP',
          desiredType,
          desiredState,
          desiredCity,
          desiredArea: desiredArea || null,
          maxBudget,
          timeline,
          currentRent,
          currentType,
          currentState,
          currentCity,
          currentArea: currentArea || null,
          currentAvailable,
          currentAvailableOn: currentAvailable
            ? new Date(currentAvailableOn).toISOString()
            : null,
          features: selectedFeatures,
        }

    setLoading(true)

    try {
      // Only create the listing if we haven't already (prevents duplicates on retry)
      let listingId = createdListingId

      if (!listingId) {
        const response = await Client.post('/listings', payload, {
          Authorization: `Bearer ${token}`,
        })

        if (response.status === 401) {
          unsetToken()
          router.push('/login')
          return
        }

        if (response.status !== 200 && response.status !== 201) {
          const serverMsg: string =
            response.data?.message ??
            response.data?.error ??
            `Error ${response.status}`
          setAlertMsg(serverMsg)
          return
        }

        listingId = (response.data?.data?.listing?.id ?? response.data?.listing?.id) as string | null
        if (listingId) {
          setCreatedListingId(listingId)
          localStorage.setItem('ts_pending_listing_id', listingId)
        }

        posthog.capture('listing_created', {
          listing_type: listingMode,
          desired_city: desiredCity,
          desired_state: desiredState,
          desired_type: desiredType,
          max_budget: maxBudget,
          timeline,
          ...(listingMode === 'SEEKING'
            ? { seeker_category: seekerCategory }
            : {}),
        })
      }

      // Upload verification document for SEEKING listings
      if (isSeeking && verificationFile && listingId) {
        const formData = new FormData()
        formData.append('document', verificationFile)
        const uploadRes = await Client.postFormData(
          `/listings/${listingId}/verification-document`,
          formData,
          { Authorization: `Bearer ${token}` }
        )
        if (uploadRes.status !== 200 && uploadRes.status !== 201) {
          const uploadMsg: string =
            uploadRes.data?.message ??
            uploadRes.data?.error ??
            `Upload failed (${uploadRes.status}). Please try again.`
          setAlertMsg(uploadMsg)
          return
        }
        localStorage.removeItem('ts_pending_listing_id')
        setUnderReview(true)
        return
      }

      localStorage.removeItem('ts_pending_listing_id')
      router.push('/dashboard')
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Unable to reach the server. Please check your connection.'
      console.error('Listing submit error:', e)
      posthog.captureException(e)
      setAlertMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Field helpers ──────────────────────────────────────────────────────────

  const fc = (key: keyof AllErrors) =>
    `w-full p-4 rounded-xl border outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] ${
      errors[key]
        ? 'border-red-400 focus:border-red-500'
        : 'border-slate-200 focus:border-emerald-500'
    }`

  const Err = ({ field }: { field: keyof AllErrors }) =>
    errors[field] ? (
      <p className="text-red-500 text-xs mt-1 font-poppins-medium">
        {errors[field]}
      </p>
    ) : null

  // ── Under-review success screen ────────────────────────────────────────────

  if (underReview) {
    return (
      <GuestLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-amber-500" />
              </div>
            </div>
            <h2 className="text-3xl font-poppins-bold text-slate-900 mb-3">
              Application Submitted
            </h2>
            <p className="text-slate-500 font-poppins-regular mb-2">
              Your document is under review. We typically review applications
              within 24 hours.
            </p>
            <p className="text-slate-500 font-poppins-regular mb-8">
              You will be notified by{' '}
              <span className="font-poppins-bold text-slate-700">
                SMS and email
              </span>{' '}
              once your listing is approved.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold transition-all hover:bg-emerald-700 hover:-translate-y-0.5 shadow-lg shadow-emerald-600/20"
            >
              Go to Dashboard <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>
      </GuestLayout>
    )
  }

  // ── Loading user info ──────────────────────────────────────────────────────
  if (existingListings === null) {
    return (
      <GuestLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
        </div>
      </GuestLayout>
    )
  }

  // ── Listing limit screen ───────────────────────────────────────────────────
  if (existingListings.length >= 2) {
    return (
      <GuestLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
              <Home size={36} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-poppins-bold text-slate-900 mb-3">
              Listing Limit Reached
            </h2>
            <p className="text-slate-500 font-poppins-regular mb-8">
              You already have{' '}
              <span className="font-poppins-bold text-slate-700">
                2 listings
              </span>{' '}
              on TenantSwap. Please close an existing listing before creating a
              new one.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold transition-all hover:bg-emerald-700"
            >
              Go to Dashboard <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </GuestLayout>
    )
  }

  // ── Gate screen ────────────────────────────────────────────────────────────
  // Only show if first-time user (no listings yet) OR returning SEEKING user who hasn't picked a category

  if (
    listingMode === 'undecided' ||
    (listingMode === 'SEEKING' && !seekerCategory)
  ) {
    return (
      <GuestLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <h2 className="text-4xl font-poppins-bold text-slate-900 mb-4">
              Set Your Swap Engine
            </h2>
            <p className="text-slate-500 font-poppins-regular">
              First, let us know your current situation.
            </p>
          </motion.div>

          <motion.div
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: 'easeOut' }}
          >
            {/* Only ask about apartment for first-time users */}
            {existingListings.length === 0 && (
              <>
                <h3 className="text-xl font-poppins-bold text-slate-800 mb-2">
                  Do you Live in a Rented Apartment?
                </h3>
                <p className="text-sm text-slate-400 font-poppins-regular mb-6">
                  This helps us find the right match for you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <button
                    type="button"
                    onClick={() => setListingMode('SWAP')}
                    className="rounded-2xl border border-slate-200 p-6 text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                      <Home size={22} className="text-emerald-700" />
                    </div>
                    <p className="font-poppins-bold text-slate-800 text-base">
                      Yes, I have an apartment
                    </p>
                    <p className="text-xs text-slate-500 font-poppins-regular mt-1">
                      I want to swap my current apartment for one in another
                      location
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setListingMode('SEEKING')}
                    className="rounded-2xl border border-slate-200 p-6 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <BinocularsIcon size={22} className="text-blue-700" />
                    </div>
                    <p className="font-poppins-bold text-slate-800 text-base">
                      No, I&apos;m looking for one
                    </p>
                    <p className="text-xs text-slate-500 font-poppins-regular mt-1">
                      I need to find housing in a specific city
                    </p>
                  </button>
                </div>
              </>
            )}

            {listingMode === 'SEEKING' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
              >
                <p className="text-sm font-poppins-bold text-slate-700 mb-3">
                  Why are you looking?{' '}
                  <span className="text-slate-400 font-poppins-regular">
                    (Select one)
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {SEEKER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setSeekerCategory(cat.value)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        seekerCategory === cat.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 ${seekerCategory === cat.value ? 'text-emerald-600' : 'text-slate-400'}`}
                      >
                        {cat.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-poppins-bold text-slate-800">
                          {cat.label}
                        </span>
                        <span className="block text-xs font-poppins-regular text-slate-500 mt-0.5">
                          {cat.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {listingMode === 'SEEKING' && seekerCategory && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex justify-end"
            >
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold transition-all hover:bg-emerald-700 hover:-translate-y-0.5 shadow-lg shadow-emerald-600/20"
              >
                Continue <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </GuestLayout>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────

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
              <X
                size={20}
                className="rounded-sm text-red-500 bg-white flex-shrink-0"
              />
              <span className="text-white font-poppins-bold">{alertMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      <div className="max-w-2xl mx-auto py-12 px-4">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <h2 className="text-4xl font-poppins-bold text-slate-900 mb-4">
            Set Your Swap Engine
          </h2>
          <p className="text-slate-500 font-poppins-regular">
            {listingMode === 'SEEKING'
              ? 'Tell us what you are looking for and we will find available apartments for you.'
              : 'Tell us where you are, where you want to be, and whether you know of a vacancy nearby.'}
          </p>
        </motion.div>

        <StepHeader
          current={step}
          steps={listingMode === 'SEEKING' ? seekerSteps : undefined}
        />

        <motion.div
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[420px] flex flex-col"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: 'easeOut' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* ── Step 0: Looking For (shared) ── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                className="flex-1 space-y-6"
                initial={{ opacity: 0, x: 28, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -28, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">
                      Looking For
                    </h3>
                    <p className="text-sm text-slate-400 font-poppins-regular">
                      Where do you want to move to?
                    </p>
                  </div>
                  <div className="rounded-full border p-2 shadow-xl shadow-black/20">
                    <BinocularsIcon className="text-black" size={30} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Property Type
                    </label>
                    <select
                      value={desiredType}
                      onChange={(e) =>
                        setDesiredType(e.target.value as PropertyType)
                      }
                      className={fc('desiredType')}
                    >
                      <option value="No Option" disabled>
                        Select type…
                      </option>
                      {PROPERTY_TYPES.filter((t) => t !== 'No Option').map(
                        (t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>
                    <Err field="desiredType" />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Desired State
                    </label>
                    <select
                      value={desiredState}
                      onChange={(e) => {
                        setDesiredState(e.target.value as Location)
                        setDesiredCity('')
                        setDesiredArea('')
                      }}
                      className={fc('desiredState')}
                    >
                      <option value="No Option" disabled>
                        Select state…
                      </option>
                      {ALLOWED_SWAP_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <Err field="desiredState" />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Desired City
                    </label>
                    <select
                      value={desiredCity}
                      onChange={(e) => {
                        setDesiredCity(e.target.value)
                        setDesiredArea('')
                      }}
                      disabled={desiredState === 'No Option'}
                      className={fc('desiredCity')}
                    >
                      <option value="" disabled>
                        {desiredState === 'No Option'
                          ? 'Select state first…'
                          : 'Select city…'}
                      </option>
                      {desiredCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <Err field="desiredCity" />
                  </div>

                  {desiredAreas.length > 0 && (
                    <div>
                      <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                        Desired Area
                      </label>
                      <select
                        value={desiredArea}
                        onChange={(e) => setDesiredArea(e.target.value)}
                        className={fc('desiredCity')}
                      >
                        <option value="">Select area…</option>
                        {desiredAreas.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Max Budget (₦ / Yearly)
                    </label>
                    <input
                      type="text"
                      value={budgetDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '')
                        const num = Number(raw)
                        if (isNaN(num)) return
                        setMaxBudget(num)
                        setBudgetDisplay(
                          num === 0 ? '' : num.toLocaleString('en-NG')
                        )
                      }}
                      placeholder="e.g. 800,000"
                      className={fc('maxBudget')}
                    />
                    <Err field="maxBudget" />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Timeline
                    </label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value as Timeline)}
                      className={fc('timeline')}
                    >
                      <option value="No Option" disabled>
                        Select timeline…
                      </option>
                      {TIMELINES.filter((t) => t !== 'No Option').map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <Err field="timeline" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1 SWAP: Leaving From ── */}
            {listingMode === 'SWAP' && step === 1 && (
              <motion.div
                key="step-1-swap"
                className="flex-1 space-y-6"
                initial={{ opacity: 0, x: 28, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -28, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">
                      Leaving From
                    </h3>
                    <p className="text-sm text-slate-400 font-poppins-regular">
                      Tell us about your current home.
                    </p>
                  </div>
                  <div className="rounded-full border p-2 shadow-xl shadow-black/20">
                    <DoorOpenIcon className="text-black" size={30} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Property Type
                    </label>
                    <select
                      value={currentType}
                      onChange={(e) =>
                        setCurrentType(e.target.value as PropertyType)
                      }
                      className={fc('currentType')}
                    >
                      <option value="No Option" disabled>
                        Select type…
                      </option>
                      {PROPERTY_TYPES.filter((t) => t !== 'No Option').map(
                        (t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>
                    <Err field="currentType" />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Current State
                    </label>
                    <select
                      value={currentState}
                      onChange={(e) => {
                        setCurrentState(e.target.value as Location)
                        setCurrentCity('')
                        setCurrentArea('')
                      }}
                      className={fc('currentState')}
                    >
                      <option value="No Option" disabled>
                        Select state…
                      </option>
                      {ALLOWED_SWAP_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <Err field="currentState" />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Current City
                    </label>
                    <select
                      value={currentCity}
                      onChange={(e) => {
                        setCurrentCity(e.target.value)
                        setCurrentArea('')
                      }}
                      disabled={currentState === 'No Option'}
                      className={fc('currentCity')}
                    >
                      <option value="" disabled>
                        {currentState === 'No Option'
                          ? 'Select state first…'
                          : 'Select city…'}
                      </option>
                      {currentCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <Err field="currentCity" />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Current Area / Region
                    </label>
                    <select
                      value={currentArea}
                      onChange={(e) => setCurrentArea(e.target.value)}
                      disabled={!currentCity || currentAreas.length === 0}
                      className={fc('currentArea')}
                    >
                      <option value="" disabled>
                        {!currentCity
                          ? 'Select city first…'
                          : currentAreas.length === 0
                            ? 'No areas configured yet'
                            : 'Select area…'}
                      </option>
                      {currentAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                    <Err field="currentArea" />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Is the apartment available?
                    </label>
                    <select
                      value={
                        currentAvailable === null
                          ? 'No Option'
                          : String(currentAvailable)
                      }
                      onChange={(e) => {
                        setCurrentAvailable(e.target.value === 'true')
                        if (e.target.value === 'false')
                          setCurrentAvailableOn('')
                      }}
                      className={fc('currentAvailable')}
                    >
                      <option value="No Option" disabled>
                        Select…
                      </option>
                      <option value="true">Yes, it is available</option>
                      <option value="false">No, not yet</option>
                    </select>
                    <Err field="currentAvailable" />
                  </div>

                  {currentAvailable !== false && (
                    <div>
                      <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                        Available On
                      </label>
                      <input
                        type="date"
                        value={currentAvailableOn}
                        onChange={(e) => setCurrentAvailableOn(e.target.value)}
                        className={fc('currentAvailableOn')}
                      />
                      <Err field="currentAvailableOn" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                      Current Rent (₦ / Yearly)
                    </label>
                    <input
                      type="text"
                      value={currentRentDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '')
                        const num = Number(raw)
                        if (isNaN(num)) return
                        setCurrentRent(num)
                        setCurrentRentDisplay(
                          num === 0 ? '' : num.toLocaleString('en-NG')
                        )
                      }}
                      placeholder="e.g. 800,000"
                      className={fc('currentRent')}
                    />
                    <Err field="currentRent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-3">
                    Home Features{' '}
                    <span className="text-slate-400">
                      (Select at least one)
                    </span>
                  </label>
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl transition-all ${errors.features ? 'bg-red-50 border border-red-300' : ''}`}
                  >
                    {FEATURES.map((feat) => (
                      <label
                        key={feat}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${selectedFeatures.includes(feat) ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-poppins-bold' : 'border-slate-200 text-slate-500 font-poppins-regular'}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedFeatures.includes(feat)}
                          onChange={() => toggleFeature(feat)}
                        />
                        {selectedFeatures.includes(feat) ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                        {feat}
                      </label>
                    ))}
                  </div>
                  <Err field="features" />
                </div>
              </motion.div>
            )}

            {/* ── Step 2 SWAP: Vacancy Alert ── */}
            {listingMode === 'SWAP' && step === 2 && (
              <motion.div
                key="step-2-swap"
                className="flex-1 space-y-6"
                initial={{ opacity: 0, x: 28, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -28, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">
                      Share Vacancy Alert
                    </h3>
                    <p className="text-sm text-slate-400 font-poppins-regular">
                      Is there a vacancy in your compound or building that you
                      know about?
                    </p>
                  </div>
                  <div className="rounded-full border p-2 shadow-xl shadow-black/20">
                    <Megaphone className="text-black" size={30} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-poppins-medium text-slate-600 mb-3">
                    Is there a vacancy?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setHasVacancyAlert(true)}
                      className={`rounded-2xl border p-5 text-left transition-all ${hasVacancyAlert === true ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <span className="block text-sm font-poppins-bold text-slate-800">
                        Yes, share a vacancy alert
                      </span>
                      <span className="block text-xs font-poppins-regular text-slate-500 mt-1">
                        We will notify users looking for or already living in
                        that area.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasVacancyAlert(false)}
                      className={`rounded-2xl border p-5 text-left transition-all ${hasVacancyAlert === false ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <span
                        className={`block text-sm font-poppins-bold ${hasVacancyAlert === false ? 'text-white' : 'text-slate-800'}`}
                      >
                        No vacancy to share
                      </span>
                      <span
                        className={`block text-xs font-poppins-regular mt-1 ${hasVacancyAlert === false ? 'text-slate-200' : 'text-slate-500'}`}
                      >
                        Skip this if you do not know of any apartment opening
                        nearby.
                      </span>
                    </button>
                  </div>
                  <Err field="hasVacancyAlert" />
                </div>

                {hasVacancyAlert && (
                  <div className="space-y-6 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6">
                    <div>
                      <h4 className="text-lg font-poppins-bold text-slate-800">
                        Vacancy Details
                      </h4>
                      <p className="text-sm text-slate-500 font-poppins-regular mt-1">
                        Share only what you know about the possible vacancy.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                          Apartment Type
                        </label>
                        <select
                          value={vacancyApartmentType}
                          onChange={(e) =>
                            setVacancyApartmentType(
                              e.target.value as PropertyType
                            )
                          }
                          className={fc('vacancyApartmentType')}
                        >
                          <option value="No Option" disabled>
                            Select type…
                          </option>
                          {PROPERTY_TYPES.filter((t) => t !== 'No Option').map(
                            (t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            )
                          )}
                        </select>
                        <Err field="vacancyApartmentType" />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                          State
                        </label>
                        <select
                          value={vacancyState}
                          onChange={(e) => {
                            setVacancyState(e.target.value as Location)
                            setVacancyCity('')
                            setVacancyArea('')
                          }}
                          className={fc('vacancyState')}
                        >
                          <option value="No Option" disabled>
                            Select state…
                          </option>
                          {ALLOWED_SWAP_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        <Err field="vacancyState" />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                          City
                        </label>
                        <select
                          value={vacancyCity}
                          onChange={(e) => {
                            setVacancyCity(e.target.value)
                            setVacancyArea('')
                          }}
                          disabled={vacancyState === 'No Option'}
                          className={fc('vacancyCity')}
                        >
                          <option value="" disabled>
                            {vacancyState === 'No Option'
                              ? 'Select state first…'
                              : 'Select city…'}
                          </option>
                          {vacancyCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <Err field="vacancyCity" />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins-medium text-slate-600 mb-2">
                          Area / Region
                        </label>
                        <select
                          value={vacancyArea}
                          onChange={(e) => setVacancyArea(e.target.value)}
                          disabled={!vacancyCity || vacancyAreas.length === 0}
                          className={fc('vacancyArea')}
                        >
                          <option value="" disabled>
                            {!vacancyCity
                              ? 'Select city first…'
                              : vacancyAreas.length === 0
                                ? 'No areas configured yet'
                                : 'Select area…'}
                          </option>
                          {vacancyAreas.map((area) => (
                            <option key={area} value={area}>
                              {area}
                            </option>
                          ))}
                        </select>
                        <Err field="vacancyArea" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-poppins-medium text-slate-600 mb-3">
                        Vacancy Features{' '}
                        <span className="text-slate-400">
                          (Select what applies)
                        </span>
                      </label>
                      <div
                        className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl transition-all ${errors.vacancyFeatures ? 'bg-red-50 border border-red-300' : ''}`}
                      >
                        {FEATURES.map((feat) => (
                          <label
                            key={feat}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${vacancyFeatures.includes(feat) ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-poppins-bold' : 'border-slate-200 text-slate-500 font-poppins-regular'}`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={vacancyFeatures.includes(feat)}
                              onChange={() => toggleVacancyFeature(feat)}
                            />
                            {vacancyFeatures.includes(feat) ? (
                              <CheckSquare size={18} />
                            ) : (
                              <Square size={18} />
                            )}
                            {feat}
                          </label>
                        ))}
                      </div>
                      <Err field="vacancyFeatures" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 3 SWAP: Confirm ── */}
            {listingMode === 'SWAP' && step === 3 && (
              <motion.div
                key="step-3-swap"
                className="flex-1 space-y-6"
                initial={{ opacity: 0, x: 28, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -28, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div>
                  <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">
                    Confirm Your Swap
                  </h3>
                  <p className="text-sm text-slate-400 font-poppins-regular">
                    Review your details before we find your match and share any
                    vacancy alert.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                    <p className="text-[10px] font-poppins-bold text-emerald-600 uppercase tracking-widest mb-3">
                      Looking For
                    </p>
                    <p className="font-poppins-bold text-slate-800">
                      {desiredType}
                    </p>
                    <p className="text-slate-500 font-poppins-regular text-sm mt-1">
                      {formatSwapLocation(desiredState, desiredCity, undefined)}
                    </p>
                    <p className="text-slate-500 font-poppins-regular text-sm">
                      ₦{maxBudget.toLocaleString()} / yr
                    </p>
                    <p className="text-slate-500 font-poppins-regular text-sm">
                      {timeline}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-widest mb-3">
                      Leaving From
                    </p>
                    <p className="font-poppins-bold text-slate-800">
                      {currentType}
                    </p>
                    <p className="text-slate-500 font-poppins-regular text-sm mt-1">
                      {formatSwapLocation(
                        currentState,
                        currentCity,
                        currentArea
                      )}
                    </p>
                    <p className="text-slate-500 font-poppins-regular text-sm">
                      {currentAvailable
                        ? 'Available ' +
                          (currentAvailableOn
                            ? new Date(currentAvailableOn).toLocaleDateString(
                                'en-NG',
                                { dateStyle: 'medium' }
                              )
                            : '—')
                        : 'Not currently available'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-widest mb-2">
                    Home Features
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeatures.map((f) => (
                      <span
                        key={f}
                        className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-poppins-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[10px] font-poppins-bold text-emerald-600 uppercase tracking-widest mb-3">
                    Vacancy Alert
                  </p>
                  {hasVacancyAlert ? (
                    <>
                      <p className="font-poppins-bold text-slate-800">
                        {vacancyApartmentType}
                      </p>
                      <p className="text-slate-500 font-poppins-regular text-sm mt-1">
                        {formatSwapLocation(
                          vacancyState,
                          vacancyCity,
                          vacancyArea
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {vacancyFeatures.map((f) => (
                          <span
                            key={f}
                            className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-poppins-medium"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 font-poppins-regular">
                      No vacancy alert will be shared with nearby users.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 1 SEEKING: Document Upload ── */}
            {listingMode === 'SEEKING' && step === 1 && (
              <motion.div
                key="step-1-seeking"
                className="flex-1 space-y-6"
                initial={{ opacity: 0, x: 28, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -28, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">
                        {seekerCategory === 'NYSC'
                          ? 'Upload Call-up Letter'
                          : 'Upload Supporting Document'}
                      </h3>
                      <p className="text-sm text-slate-400 font-poppins-regular">
                        {seekerCategory === 'NYSC'
                          ? 'Upload your NYSC call-up letter or state deployment letter.'
                          : 'Upload a workplace verification document that supports your housing request.'}
                      </p>
                    </div>
                    <div className="rounded-full border p-2 shadow-xl shadow-black/20">
                      <Upload className="text-black" size={30} />
                    </div>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${errors.verificationFile ? 'border-red-300 bg-red-50' : verificationFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        setVerificationFile(file)
                        if (file)
                          setErrors((prev) => ({
                            ...prev,
                            verificationFile: undefined,
                          }))
                      }}
                    />
                    {verificationFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 size={36} className="text-emerald-500" />
                        <p className="font-poppins-bold text-slate-800 text-sm">
                          {verificationFile.name}
                        </p>
                        <p className="text-xs text-slate-400 font-poppins-regular">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={36} className="text-slate-300" />
                        <p className="font-poppins-bold text-slate-600 text-sm">
                          Click to upload document
                        </p>
                        <p className="text-xs text-slate-400 font-poppins-regular">
                          PDF, JPEG, or PNG — max 10 MB
                        </p>
                      </div>
                    )}
                  </div>
                  <Err field="verificationFile" />

                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 font-poppins-regular">
                    Your document is only used to verify your housing need. It
                    is reviewed by our team and never shared publicly.
                  </div>
                </>
              </motion.div>
            )}

            {/* ── Step 2 SEEKING: Confirm ── */}
            {listingMode === 'SEEKING' && step === 2 && (
              <motion.div
                key="step-2-seeking"
                className="flex-1 space-y-6"
                initial={{ opacity: 0, x: 28, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -28, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div>
                  <h3 className="text-2xl font-poppins-bold text-slate-800 mb-1">
                    Confirm Your Search
                  </h3>
                  <p className="text-sm text-slate-400 font-poppins-regular">
                    Review your housing request before submitting.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[10px] font-poppins-bold text-emerald-600 uppercase tracking-widest mb-3">
                    Looking For
                  </p>
                  <p className="font-poppins-bold text-slate-800">
                    {desiredType}
                  </p>
                  <p className="text-slate-500 font-poppins-regular text-sm mt-1">
                    {formatSwapLocation(desiredState, desiredCity, undefined)}
                  </p>
                  <p className="text-slate-500 font-poppins-regular text-sm">
                    Budget: ₦{maxBudget.toLocaleString()} / yr
                  </p>
                  <p className="text-slate-500 font-poppins-regular text-sm">
                    Timeline: {timeline}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-widest mb-2">
                    Reason for Seeking
                  </p>
                  <p className="text-sm font-poppins-bold text-slate-800">
                    {SEEKER_CATEGORIES.find((c) => c.value === seekerCategory)
                      ?.label ?? seekerCategory}
                  </p>
                  <p className="text-xs text-slate-500 font-poppins-regular mt-1">
                    {verificationFile
                      ? `Document: ${verificationFile.name}`
                      : 'No document uploaded'}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 font-poppins-regular">
                  Your listing will be reviewed before it goes live. This
                  usually takes less than 24 hours.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-100 ${step > 0 || fromDashboard ? 'justify-between' : 'justify-end'}`}
          >
            <div className="flex items-center gap-3">
              {fromDashboard && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-poppins-medium cursor-pointer transition-all duration-300 ease-out hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <X size={18} /> Cancel
                </button>
              )}
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-poppins-medium cursor-pointer transition-all duration-300 ease-out hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <ChevronLeft size={18} /> Back
                </button>
              )}
            </div>

            {step < maxStep ? (
              <button
                type="button"
                onClick={goNext}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-poppins-bold cursor-pointer transition-all duration-300 ease-out shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Please wait…
                  </>
                ) : (
                  <>
                    Next <ChevronRight size={18} />
                  </>
                )}
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
                    Submitting…
                  </>
                ) : listingMode === 'SEEKING' ? (
                  <>
                    Submit Application <ChevronRight size={18} />
                  </>
                ) : (
                  <>
                    Find My Swap Match <ChevronRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </GuestLayout>
  )
}

export default Engine
