'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  IncomingInterestListing,
  MatchCandidate,
  NearMiss,
  User,
  UserSwapListing,
  UserSwapRequest,
  VacancyAlert,
} from '@/shared/types'
import {
  FilePlus,
  Edit2,
  BadgeCheck,
  Clock4,
  Bell,
  Plus,
  Phone,
  TrendingUp,
  UserCheck,
  AlertCircle,
  FileUp,
  Search,
  Share2,
  Copy,
  ChevronRight,
  Megaphone,
} from 'lucide-react'
import { Client } from '@/shared/utils/ApiClient'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthLayout from '@/app/AuthLayout'
import UpdateEngine from '@/components/UpdateListing'
import { Alert } from '@heroui/alert'
import MatchModal from '@/components/MatchingModal'
import MatchCard from '@/components/MatchCard'
import RequestListModal from '@/components/RequestListModal'
import VacancyAlertModal from '@/components/VacancyAlertModal'
import {
  LIVE_UPDATE_CUE_EVENT,
  LIVE_UPDATE_EVENT,
  LiveUpdateCueKind,
  suppressNextInterestSound,
  playLiveUpdateSound,
  type LiveUpdateEventDetail,
} from '@/shared/utils/liveUpdates'
import posthog from 'posthog-js'

function getActiveListing(listings: UserSwapListing[]): UserSwapListing | null {
  if (!listings?.length) return null
  return (
    listings.find((l) => l.status === 'ACTIVE') ??
    listings.find(
      (l) => l.listingType === 'SEEKING' && l.verificationStatus === 'PENDING'
    ) ??
    listings.find(
      (l) => l.listingType === 'SEEKING' && l.verificationStatus === 'REJECTED'
    ) ??
    [...listings].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  )
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' })
}

const STATUS_COLORS: Record<UserSwapListing['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  MATCHED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-amber-100 text-amber-700',
}

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [updateListing, setUpdateListing] = useState<UserSwapListing | null>(
    null
  )
  const [selectedMatch, setSelectedMatch] = useState<MatchCandidate | null>(
    null
  )
  const [errorMsg, setErrorMsg] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [outgoingRequests, setOutgoingRequests] = useState<UserSwapRequest[]>(
    []
  )
  const [incomingListings, setIncomingListings] = useState<
    IncomingInterestListing[]
  >([])
  const [openRequestList, setOpenRequestList] = useState(false)
  const [requestTab, setRequestTab] = useState<'incoming' | 'outgoing'>(
    'incoming'
  )
  const [processingInterestId, setProcessingInterestId] = useState<
    string | null
  >(null)
  const [requestAttentionActive, setRequestAttentionActive] = useState(false)
  const [requestAttentionPulseActive, setRequestAttentionPulseActive] =
    useState(false)
  const [vacancyListing, setVacancyListing] = useState<UserSwapListing | null>(
    null
  )
  const [vacancySaving, setVacancySaving] = useState(false)
  const [myVacancies, setMyVacancies] = useState<VacancyAlert[]>([])
  const [copiedVacancyId, setCopiedVacancyId] = useState<string | null>(null)
  const [demandByCity, setDemandByCity] = useState<Record<string, number>>({})
  const [resubmitListingId, setResubmitListingId] = useState<string | null>(
    null
  )
  const [resubmitting, setResubmitting] = useState(false)
  const [recentVacancies, setRecentVacancies] = useState<
    { id: string; apartmentType: string; city: string; state: string }[]
  >([])
  const resubmitFileRef = useRef<HTMLInputElement | null>(null)
  const previousIncomingOpenRequests = useRef(0)
  const requestAttentionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const requestSoundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const router = useRouter()
  const searchParams = useSearchParams()

  const pendingIncomingListings = useMemo(
    () =>
      incomingListings
        .map((listing) => ({
          ...listing,
          requests: listing.requests.filter(
            (request) => request.status === 'REQUESTED'
          ),
        }))
        .filter((listing) => listing.requests.length > 0),
    [incomingListings]
  )

  const outgoingRequestByListingId = useMemo(
    () =>
      new Map(outgoingRequests.map((request) => [request.listing.id, request])),
    [outgoingRequests]
  )

  const pendingOutgoingRequests = useMemo(
    () => outgoingRequests.filter((request) => request.status === 'REQUESTED'),
    [outgoingRequests]
  )

  const pendingIncomingRequestCount = useMemo(
    () =>
      pendingIncomingListings.reduce(
        (total, listing) => total + listing.requests.length,
        0
      ),
    [pendingIncomingListings]
  )

  const listingCount = currentUser?.listings.length ?? 0
  const maxFreeListings = 2
  const canCreateListing = listingCount < maxFreeListings
  const requestCount =
    pendingIncomingRequestCount + pendingOutgoingRequests.length

  const readCurrentUser = async () => {
    const token = localStorage.getItem('JWT_TOKEN')
    if (!token) {
      router.replace('/login')
      return
    }

    try {
      const response = await Client.get(
        '/users/me',
        {},
        { Authorization: `Bearer ${token}` }
      )

      if (response.status === 200) {
        const user = response.data.data.user
        setCurrentUser(user)
        // Kick off demand fetch with the listings we already have — no second /users/me call
        void readDemand(user?.listings ?? [])
        // Fetch vacancies near user's desired location
        const firstListing = user?.listings?.[0]
        void readRecentVacancies(
          firstListing?.desiredCity,
          firstListing?.desiredState
        )
        return
      }

      // Only clear token and redirect on explicit auth failures
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('JWT_TOKEN')
        router.replace('/login')
      }
      // Any other status (500, network timeout etc.) — leave token, show nothing
    } catch {
      // Network error — don't log the user out, just silently fail
    }
  }

  const readOutgoingRequests = async () => {
    const token = localStorage.getItem('JWT_TOKEN')
    if (!token) return
    const response = await Client.get(
      '/matching/interests/outgoing',
      {},
      { Authorization: `Bearer ${token}` }
    )
    if (response.status === 200)
      setOutgoingRequests(response.data.data.requests ?? [])
  }

  const readIncomingRequests = async () => {
    const token = localStorage.getItem('JWT_TOKEN')
    if (!token) return
    const response = await Client.get(
      '/matching/interests/incoming',
      {},
      { Authorization: `Bearer ${token}` }
    )
    if (response.status === 200)
      setIncomingListings(response.data.data.listings ?? [])
  }

  const readRequests = async () => {
    await Promise.all([readIncomingRequests(), readOutgoingRequests()])
  }

  const readVacancies = async () => {
    const token = localStorage.getItem('JWT_TOKEN')
    if (!token) return
    const response = await Client.get(
      '/vacancy/me/all',
      {},
      { Authorization: `Bearer ${token}` }
    )
    if (response.status === 200) setMyVacancies(response.data.data ?? [])
  }

  const readRecentVacancies = async (
    desiredCity?: string,
    desiredState?: string
  ) => {
    try {
      const params: Record<string, string> = { limit: '5' }
      if (desiredCity) params.city = desiredCity
      else if (desiredState) params.state = desiredState
      const response = await Client.get('/vacancy', params)
      if (response.status === 200) {
        setRecentVacancies(
          response.data.data?.items ?? response.data.data ?? []
        )
      }
    } catch {
      /* silent */
    }
  }

  const readDemand = async (listings: { desiredCity: string }[]) => {
    const token = localStorage.getItem('JWT_TOKEN')
    if (!token) return
    const cities = [
      ...new Set(listings.map((l) => l.desiredCity).filter(Boolean)),
    ]
    const results = await Promise.allSettled(
      cities.map((city) =>
        Client.get(
          '/listings/demand',
          { city },
          { Authorization: `Bearer ${token}` }
        )
      )
    )
    const map: Record<string, number> = {}
    cities.forEach((city, i) => {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value.status === 200) {
        map[city] = r.value.data?.data?.count ?? 0
      }
    })
    setDemandByCity(map)
  }

  const handleConnect = async (targetListingId: string) => {
    setConnecting(true)
    suppressNextInterestSound()
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      const response = await Client.post(
        `/matching/interests/${targetListingId}/request`,
        {},
        { Authorization: `Bearer ${token}` }
      )

      if (response.status === 200 || response.status === 201) {
        posthog.capture('swap_request_sent', {
          target_listing_id: targetListingId,
        })
        setSelectedMatch(null)
        setSuccessMsg('Connection request sent!')
        await readRequests()
        return
      }

      if (response.status === 403) {
        setErrorMsg('You do not have permission to connect with this listing.')
        return
      }
      if (response.status === 429) {
        setErrorMsg('Too many requests. Please wait a moment and try again.')
        return
      }
      setErrorMsg('Something went wrong. Please try again.')
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleApproveInterest = async (interestId: string) => {
    setProcessingInterestId(interestId)
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      const response = await Client.post(
        `/matching/interests/${interestId}/approve`,
        {},
        { Authorization: `Bearer ${token}` }
      )
      if (response.status === 200 || response.status === 201) {
        posthog.capture('swap_request_approved', { interest_id: interestId })
        setSuccessMsg('Connection request approved.')
        await readRequests()
        return
      }
      setErrorMsg(
        response.data?.message ?? 'Unable to approve this request right now.'
      )
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.')
    } finally {
      setProcessingInterestId(null)
    }
  }

  const handleDeclineInterest = async (interestId: string) => {
    setProcessingInterestId(interestId)
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      const response = await Client.post(
        `/matching/interests/${interestId}/decline`,
        {},
        { Authorization: `Bearer ${token}` }
      )
      if (response.status === 200 || response.status === 201) {
        posthog.capture('swap_request_declined', { interest_id: interestId })
        setSuccessMsg('Connection request declined.')
        await readRequests()
        return
      }
      setErrorMsg(
        response.data?.message ?? 'Unable to decline this request right now.'
      )
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.')
    } finally {
      setProcessingInterestId(null)
    }
  }

  const handleOpenListings = () => {
    document
      .getElementById('listings-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleAddListing = () => {
    if (!canCreateListing) {
      setErrorMsg(
        'Free plan includes up to 2 listings. Upgrade to Premium for more.'
      )
      return
    }
    router.push('/engine?from=dashboard')
  }

  const handleSaveVacancyAlert = async (
    _listingId: string,
    vacancyPayload: {
      apartmentType: string
      state: string
      city: string
      area: string | null
      features: string[]
    } | null
  ) => {
    setVacancySaving(true)
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      if (!vacancyPayload) {
        // Delete all existing vacancies (or just the first one if multiple)
        if (myVacancies.length > 0) {
          await Client.delete(`/vacancy/${myVacancies[0].id}`, undefined, {
            Authorization: `Bearer ${token}`,
          })
        }
        posthog.capture('vacancy_alert_removed')
        setVacancyListing(null)
        setSuccessMsg('Vacancy alert removed.')
        await readVacancies()
        return
      }
      const response = await Client.post('/vacancy', vacancyPayload, {
        Authorization: `Bearer ${token}`,
      })
      if (response.status === 200 || response.status === 201) {
        posthog.capture('vacancy_alert_created', {
          apartment_type: vacancyPayload.apartmentType,
          state: vacancyPayload.state,
          city: vacancyPayload.city,
          has_area: !!vacancyPayload.area,
          feature_count: vacancyPayload.features.length,
        })
        setVacancyListing(null)
        setSuccessMsg('Vacancy alert created.')
        await readVacancies()
        return
      }
      setErrorMsg(
        response.data?.message ?? 'Unable to save this vacancy alert right now.'
      )
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.')
    } finally {
      setVacancySaving(false)
    }
  }

  const handleResubmitDocument = async (listingId: string, file: File) => {
    setResubmitting(true)
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      const formData = new FormData()
      formData.append('document', file)
      const response = await Client.postFormData(
        `/listings/${listingId}/verification-document`,
        formData,
        { Authorization: `Bearer ${token}` }
      )
      if (response.status === 200 || response.status === 201) {
        setSuccessMsg('Document re-submitted. We will review it shortly.')
        await readCurrentUser()
      } else {
        setErrorMsg(
          response.data?.message ??
            'Unable to upload document. Please try again.'
        )
      }
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.')
    } finally {
      setResubmitting(false)
      setResubmitListingId(null)
    }
  }

  useEffect(() => {
    // Fire all independent fetches in parallel — readCurrentUser also triggers readDemand internally
    Promise.all([readCurrentUser(), readRequests(), readVacancies()]).finally(
      () => setHydrated(true)
    )
  }, [])

  // Deep-link from notification clicks
  useEffect(() => {
    const tab = searchParams.get('requests')
    if (tab === 'incoming' || tab === 'outgoing') {
      setRequestTab(tab)
      setOpenRequestList(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!openRequestList) return
    void readRequests()
  }, [openRequestList])

  useEffect(() => {
    if (
      openRequestList &&
      pendingIncomingRequestCount > previousIncomingOpenRequests.current &&
      pendingIncomingListings.length > 0
    ) {
      setRequestTab('incoming')
    }
    previousIncomingOpenRequests.current = pendingIncomingRequestCount
  }, [
    pendingIncomingRequestCount,
    openRequestList,
    pendingIncomingListings.length,
  ])

  useEffect(() => {
    const handleLiveCue = (event: Event) => {
      const customEvent = event as CustomEvent<{ kind?: LiveUpdateCueKind }>
      if (customEvent.detail?.kind !== 'request') return

      setRequestAttentionActive(true)
      setRequestAttentionPulseActive(true)

      if (requestAttentionTimeoutRef.current)
        clearTimeout(requestAttentionTimeoutRef.current)
      requestAttentionTimeoutRef.current = setTimeout(() => {
        setRequestAttentionPulseActive(false)
        requestAttentionTimeoutRef.current = null
      }, 2400)

      if (requestSoundIntervalRef.current)
        clearInterval(requestSoundIntervalRef.current)
      requestSoundIntervalRef.current = setInterval(() => {
        playLiveUpdateSound('request')
      }, 4000)
    }

    window.addEventListener(
      LIVE_UPDATE_CUE_EVENT,
      handleLiveCue as EventListener
    )
    return () => {
      window.removeEventListener(
        LIVE_UPDATE_CUE_EVENT,
        handleLiveCue as EventListener
      )
      if (requestAttentionTimeoutRef.current)
        clearTimeout(requestAttentionTimeoutRef.current)
      if (requestSoundIntervalRef.current)
        clearInterval(requestSoundIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (openRequestList && requestSoundIntervalRef.current) {
      clearInterval(requestSoundIntervalRef.current)
      requestSoundIntervalRef.current = null
    }
  }, [openRequestList])

  useEffect(() => {
    if (requestCount > 0) return
    setRequestAttentionActive(false)
    setRequestAttentionPulseActive(false)
    if (requestAttentionTimeoutRef.current) {
      clearTimeout(requestAttentionTimeoutRef.current)
      requestAttentionTimeoutRef.current = null
    }
    if (requestSoundIntervalRef.current) {
      clearInterval(requestSoundIntervalRef.current)
      requestSoundIntervalRef.current = null
    }
  }, [requestCount])

  useEffect(() => {
    const handleLiveUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LiveUpdateEventDetail>).detail
      if (!detail) return
      if (detail.type === 'matches.updated' || detail.type === 'user.refresh')
        void readCurrentUser()
      if (detail.type === 'interests.updated') void readRequests()
    }

    window.addEventListener(
      LIVE_UPDATE_EVENT,
      handleLiveUpdate as EventListener
    )
    return () =>
      window.removeEventListener(
        LIVE_UPDATE_EVENT,
        handleLiveUpdate as EventListener
      )
  }, [])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(async () => {
      setSuccessMsg('')
      setUpdateListing(null)
      await Promise.all([readCurrentUser(), readRequests()])
      router.refresh()
    }, 2000)
    return () => clearTimeout(t)
  }, [successMsg])

  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(''), 4000)
    return () => clearTimeout(t)
  }, [errorMsg])

  if (!hydrated)
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-primary-green">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/TenantSwap Logo Monochrome.svg"
          alt="TenantSwap"
          className="w-20 h-20 animate-pulse"
        />
        <div className="w-10 h-10 rounded-full border-[3px] border-white/25 border-t-white animate-spin" />
      </div>
    )

  const activeListing = currentUser
    ? getActiveListing(currentUser.listings)
    : null

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!currentUser || !activeListing) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto py-12 sm:py-20 px-4 text-center">
          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FilePlus size={32} className="sm:hidden" />
              <FilePlus size={40} className="hidden sm:block" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-poppins-bold mb-4">
              Setup Your Swap Engine
            </h2>
            <p className="text-slate-500 font-poppins-regular mb-8 max-w-md mx-auto text-sm sm:text-base">
              We need to know what you are leaving and what you are looking for
              to run the home matching algorithm.
            </p>
            <Link
              href="/engine?from=dashboard"
              className="inline-block bg-primary-green/90 text-white px-6 sm:px-8 py-3 rounded-xl font-poppins-bold hover:bg-primary-green transition-all text-sm sm:text-base"
            >
              Enter Swap Details
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (updateListing) {
    return (
      <AuthLayout>
        <UpdateEngine
          listing={updateListing}
          setListing={setUpdateListing}
          successMsg={successMsg}
          setSuccessMsg={setSuccessMsg}
        />
      </AuthLayout>
    )
  }

  // ── Toast helper class ─────────────────────────────────────────────────────
  const toastClass =
    'fixed top-4 right-4 left-4 sm:left-auto z-[9999] sm:w-full sm:max-w-md'

  // Collect all approved contacts across all listings for the updates section
  const allApprovedOutgoing = outgoingRequests.filter(
    (r) => r.status === 'CONTACT_APPROVED'
  )
  const allApprovedIncoming = incomingListings.flatMap((il) =>
    il.requests.filter((r) => r.status === 'CONTACT_APPROVED')
  )

  // Free plan: 2 contact unlocks lifetime. Premium: unlimited.
  const FREE_CONTACT_LIMIT = 2
  const isPremium = currentUser.subscriptionStatus === 'ACTIVE'
  const rejectedListings = currentUser.listings.filter(
    (l) => l.listingType === 'SEEKING' && l.verificationStatus === 'REJECTED'
  )
  const pendingListings = currentUser.listings.filter(
    (l) => l.listingType === 'SEEKING' && l.verificationStatus === 'PENDING'
  )
  const hasUpdates =
    allApprovedOutgoing.length > 0 ||
    allApprovedIncoming.length > 0 ||
    rejectedListings.length > 0 ||
    pendingListings.length > 0

  return (
    <AuthLayout>
      {/* Success toast */}
      {successMsg && (
        <div className={toastClass}>
          <Alert
            color="success"
            variant="solid"
            isVisible
            onClose={() => setSuccessMsg('')}
            classNames={{
              base: 'shadow-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500 animate-in fade-in slide-in-from-top-2 duration-300',
            }}
          >
            <span className="text-white font-poppins-bold">{successMsg}</span>
          </Alert>
        </div>
      )}
      {errorMsg && (
        <div className={toastClass}>
          <Alert
            color="danger"
            variant="solid"
            isVisible
            onClose={() => setErrorMsg('')}
            classNames={{
              base: 'shadow-2xl rounded-2xl border border-red-500/20 bg-red-500 animate-in fade-in slide-in-from-top-2 duration-300',
            }}
          >
            <span className="text-white font-poppins-bold">{errorMsg}</span>
          </Alert>
        </div>
      )}

      <MatchModal
        open={!!selectedMatch}
        match={selectedMatch}
        listing={activeListing}
        connecting={connecting}
        onClose={() => setSelectedMatch(null)}
        onConnect={handleConnect}
      />
      <RequestListModal
        open={openRequestList}
        onClose={() => setOpenRequestList(false)}
        outgoingRequests={outgoingRequests}
        outgoingTotalRequests={pendingOutgoingRequests.length}
        incomingListings={pendingIncomingListings}
        incomingOpenRequests={pendingIncomingRequestCount}
        activeTab={requestTab}
        onTabChange={setRequestTab}
        onApprove={handleApproveInterest}
        onDecline={handleDeclineInterest}
        processingInterestId={processingInterestId}
      />
      <VacancyAlertModal
        open={!!vacancyListing}
        listing={vacancyListing}
        saving={vacancySaving}
        onClose={() => {
          if (!vacancySaving) setVacancyListing(null)
        }}
        onSave={handleSaveVacancyAlert}
      />

      {/* Hidden resubmit file input */}
      <input
        ref={resubmitFileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && resubmitListingId)
            void handleResubmitDocument(resubmitListingId, file)
          e.target.value = ''
        }}
      />

      <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-slate-400 font-poppins-medium mb-0.5">
              Welcome back
            </p>
            <h1 className="text-xl font-poppins-bold text-slate-900">
              {currentUser.fullName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRequestAttentionActive(false)
                setRequestAttentionPulseActive(false)
                if (requestAttentionTimeoutRef.current) {
                  clearTimeout(requestAttentionTimeoutRef.current)
                  requestAttentionTimeoutRef.current = null
                }
                setRequestTab(
                  pendingIncomingRequestCount > 0 ? 'incoming' : 'outgoing'
                )
                setOpenRequestList(true)
              }}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-poppins-bold transition-all duration-300 ${
                requestAttentionActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell
                size={15}
                className={
                  requestAttentionActive ? 'text-emerald-600' : 'text-slate-400'
                }
              />
              <span>Requests</span>
              {requestCount > 0 && (
                <span className="relative flex min-w-[18px] items-center justify-center">
                  {requestAttentionPulseActive && (
                    <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                  )}
                  <span
                    className={`relative rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-poppins-bold text-white transition-transform duration-300 ${requestAttentionPulseActive ? 'scale-110' : ''}`}
                  >
                    {requestCount}
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Vacancy banner ──────────────────────────────────────────────── */}
        {recentVacancies.length > 0 &&
          (() => {
            const v = recentVacancies[0]
            const count = recentVacancies.length
            const location = activeListing?.desiredCity || v.city
            return (
              <Link
                href={`/vacancy/${v.id}`}
                className="flex items-center gap-3 w-full mb-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-4 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <span className="absolute h-full w-full rounded-full bg-white/30 animate-ping" />
                  <Megaphone size={16} className="text-white relative z-10" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-poppins-bold text-white/70 uppercase tracking-widest mb-0.5">
                    {count} new vacanc{count === 1 ? 'y' : 'ies'} near{' '}
                    {location}
                  </p>
                  <p className="text-sm font-poppins-bold text-white truncate">
                    {v.apartmentType} available · {v.city}, {v.state}
                  </p>
                </div>
                <ChevronRight size={18} className="text-white/70 shrink-0" />
              </Link>
            )
          })()}

        {/* ── Updates strip ───────────────────────────────────────────────── */}
        {hasUpdates && (
          <div className="mb-8 space-y-2">
            {pendingListings.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <Clock4 size={14} className="text-amber-500 shrink-0" />
                <p className="text-sm font-poppins-medium text-amber-800 flex-1">
                  <span className="font-poppins-bold">
                    Verification pending
                  </span>{' '}
                  — your document is under review.
                </p>
              </div>
            ))}
            {rejectedListings.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-poppins-bold text-red-800">
                    Verification rejected
                  </p>
                  {l.verificationNote && (
                    <p className="text-xs font-poppins-regular text-red-600 mt-0.5">
                      {l.verificationNote}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={resubmitting && resubmitListingId === l.id}
                  onClick={() => {
                    setResubmitListingId(l.id)
                    resubmitFileRef.current?.click()
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-poppins-bold text-red-600 transition-all hover:bg-red-50 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileUp size={11} />
                  {resubmitting && resubmitListingId === l.id
                    ? 'Uploading…'
                    : 'Re-submit'}
                </button>
              </div>
            ))}
            {allApprovedOutgoing.map((req, idx) => {
              // First FREE_CONTACT_LIMIT contacts are always visible.
              // Beyond that, locked for non-premium users.
              const isLocked = !isPremium && idx >= FREE_CONTACT_LIMIT
              if (isLocked) {
                return (
                  <div
                    key={req.interestId}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-slate-400"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 font-poppins-bold uppercase tracking-widest">
                        Contact Locked
                      </p>
                      <p className="text-sm font-poppins-bold text-slate-400">
                        •••••••••
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-amber-500 px-3 py-1.5 text-xs font-poppins-bold text-white whitespace-nowrap">
                      Upgrade
                    </span>
                  </div>
                )
              }
              return (
                <div
                  key={req.interestId}
                  className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"
                >
                  <UserCheck size={14} className="text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-500 font-poppins-bold uppercase tracking-widest">
                      Contact Approved
                    </p>
                    <p className="text-sm font-poppins-bold text-slate-800">
                      {req.owner.fullName}
                    </p>
                    {req.owner.phone && (
                      <p className="text-xs text-slate-500 font-poppins-regular">
                        {req.owner.phone}
                      </p>
                    )}
                  </div>
                  {req.owner.phone && (
                    <a
                      href={`tel:${req.owner.phone}`}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-blue-600 transition-all hover:bg-blue-50 whitespace-nowrap"
                    >
                      <Phone size={11} /> Call
                    </a>
                  )}
                </div>
              )
            })}
            {allApprovedIncoming.map((req) => (
              <div
                key={req.interestId}
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"
              >
                <UserCheck size={14} className="text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-500 font-poppins-bold uppercase tracking-widest">
                    You approved — their contact
                  </p>
                  <p className="text-sm font-poppins-bold text-slate-800">
                    {req.requester.fullName}
                  </p>
                  {req.requester.phone && (
                    <p className="text-xs text-slate-500 font-poppins-regular">
                      {req.requester.phone}
                    </p>
                  )}
                </div>
                {req.requester.phone && (
                  <a
                    href={`tel:${req.requester.phone}`}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-blue-600 transition-all hover:bg-blue-50 whitespace-nowrap"
                  >
                    <Phone size={11} /> Call
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Listings header ──────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between mb-5"
          id="listings-section"
        >
          <p className="text-xs font-poppins-bold text-slate-400 uppercase tracking-widest">
            Your Listings · {listingCount}/{maxFreeListings}
          </p>
          <button
            type="button"
            onClick={handleAddListing}
            disabled={!canCreateListing}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-emerald-700 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
          >
            <Plus size={13} /> Add Listing
          </button>
        </div>

        {/* ── Listings ────────────────────────────────────────────────────── */}
        <div className="space-y-10">
          {currentUser.listings.map((listing, listingIndex) => (
            <div key={listing.id}>
              {/* Compact listing card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-poppins-bold text-slate-800">
                        {listing.listingType === 'SEEKING'
                          ? `Seeking ${listing.desiredType}`
                          : `${listing.currentType} → ${listing.desiredType}`}
                      </h3>
                      <span
                        className={`text-xs font-poppins-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[listing.status]}`}
                      >
                        {listing.status}
                      </span>
                      {listing.listingType === 'SEEKING' && (
                        <span className="text-xs font-poppins-bold px-2 py-0.5 rounded-full shrink-0 bg-purple-100 text-purple-700">
                          Seeker
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-poppins-regular">
                      {listing.desiredCity} · ₦
                      {listing.maxBudget.toLocaleString()} / yr ·{' '}
                      {listing.timeline}
                    </p>
                    {listing.listingType !== 'SEEKING' && (
                      <p
                        className={`text-xs font-poppins-medium mt-1 flex items-center gap-1 ${listing.currentAvailable ? 'text-emerald-600' : 'text-slate-400'}`}
                      >
                        {listing.currentAvailable ? (
                          <>
                            <BadgeCheck size={11} className="shrink-0" />{' '}
                            Available {formatDate(listing.currentAvailableOn)}
                          </>
                        ) : (
                          'Not yet available'
                        )}
                      </p>
                    )}
                    {listing.listingType === 'SEEKING' &&
                      listing.seekerCategory && (
                        <p className="text-xs text-purple-500 font-poppins-medium mt-1">
                          {listing.seekerCategory === 'OTHER'
                            ? 'Future Resident'
                            : 'NYSC Corps Member'}
                        </p>
                      )}
                    {listing.expiresAt && (
                      <p className="text-xs text-amber-500 font-poppins-medium mt-1 flex items-center gap-1">
                        <Clock4 size={10} className="shrink-0" /> Expires{' '}
                        {formatDate(listing.expiresAt)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpdateListing(listing)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-poppins-bold text-slate-500 hover:bg-slate-50 transition-all shrink-0"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>

              {/* Activity signals */}
              {(listing.viewCount > 0 || demandByCity[listing.desiredCity]) && (
                <div className="flex flex-wrap gap-2 mb-3 -mt-2">
                  {listing.viewCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-poppins-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      <Search size={11} className="text-slate-400" />
                      Seen {listing.viewCount}{' '}
                      {listing.viewCount === 1 ? 'time' : 'times'}
                    </span>
                  )}
                  {(demandByCity[listing.desiredCity] ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-poppins-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      <Bell size={11} className="text-emerald-500" />
                      {demandByCity[listing.desiredCity]} active{' '}
                      {demandByCity[listing.desiredCity] === 1
                        ? 'seeker'
                        : 'seekers'}{' '}
                      in {listing.desiredCity}
                    </span>
                  )}
                </div>
              )}

              {/* Vacancy alert prompt — SWAP listings only */}
              {listing.listingType !== 'SEEKING' && (
                <div className="mb-5">
                  {myVacancies.length > 0 ? (
                    <div className="space-y-3">
                      {myVacancies.map((v) => (
                        <div
                          key={v.id}
                          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">
                                Vacancy Alert · Active
                              </p>
                              <p className="text-sm font-poppins-bold text-slate-800">
                                {v.apartmentType} in{' '}
                                {[v.area, v.city, v.state]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                              {v.features.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {v.features.map((f) => (
                                    <span
                                      key={f}
                                      className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md font-poppins-medium"
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = `${window.location.origin}/vacancy/${v.id}`
                                  if (navigator.share) {
                                    try {
                                      await navigator.share({
                                        title: 'Vacancy Alert — TenantSwap',
                                        url,
                                      })
                                    } catch {
                                      /* cancelled */
                                    }
                                  } else {
                                    await navigator.clipboard.writeText(url)
                                    setCopiedVacancyId(v.id)
                                    setTimeout(
                                      () => setCopiedVacancyId(null),
                                      2000
                                    )
                                  }
                                  void Client.post(
                                    `/vacancy/${v.id}/share`,
                                    {},
                                    {
                                      Authorization: `Bearer ${localStorage.getItem('JWT_TOKEN')}`,
                                    }
                                  ).catch(() => undefined)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-emerald-700 transition-all hover:bg-emerald-100 whitespace-nowrap"
                              >
                                {copiedVacancyId === v.id ? (
                                  <>
                                    <Copy size={11} /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Share2 size={11} /> Share
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const token =
                                    localStorage.getItem('JWT_TOKEN')
                                  await Client.delete(
                                    `/vacancy/${v.id}`,
                                    undefined,
                                    { Authorization: `Bearer ${token}` }
                                  )
                                  await readVacancies()
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-red-500 transition-all hover:bg-red-50 whitespace-nowrap"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVacancyListing(listing)}
                      className="w-full flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/40 group"
                    >
                      <div>
                        <p className="text-sm font-poppins-bold text-slate-600 group-hover:text-emerald-700">
                          Know of a vacant apartment nearby?
                        </p>
                        <p className="text-xs font-poppins-regular text-slate-400 mt-0.5">
                          Share a vacancy alert — help others in your area find
                          a home.
                        </p>
                      </div>
                      <Bell
                        size={16}
                        className="text-slate-300 group-hover:text-emerald-500 shrink-0 transition-colors"
                      />
                    </button>
                  )}
                </div>
              )}

              {/* Matches or seeker placeholder */}
              {listing.listingType === 'SEEKING' ? (
                <div className="rounded-2xl border border-dashed border-purple-100 bg-purple-50/30 p-8 text-center">
                  <Search size={28} className="text-purple-200 mx-auto mb-2" />
                  <p className="text-sm font-poppins-bold text-slate-400">
                    {listing.verificationStatus === 'PENDING'
                      ? 'Under review — matches will appear once approved.'
                      : listing.verificationStatus === 'APPROVED'
                        ? "Active — we'll notify you when matches are found."
                        : 'Complete verification to activate your listing.'}
                  </p>
                </div>
              ) : listing.matches.length > 0 ? (
                <>
                  <p className="text-xs font-poppins-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Potential Matches
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-poppins-medium normal-case tracking-normal">
                      {listing.matchCount}
                    </span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listing.matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        relatedRequest={outgoingRequestByListingId.get(
                          match.targetListing.id
                        )}
                        onRequestAgain={handleConnect}
                        setSelectedMatch={setSelectedMatch}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                    <div className="relative w-10 h-10 mx-auto mb-3">
                      <Search
                        size={28}
                        className="text-slate-300 absolute inset-0 m-auto"
                      />
                      <span className="absolute inset-0 rounded-full border-2 border-slate-200 border-t-emerald-400 animate-spin" />
                    </div>
                    <p className="text-sm font-poppins-bold text-slate-400">
                      Still searching…
                    </p>
                    <p className="text-xs text-slate-300 font-poppins-regular mt-1">
                      We'll notify you the moment someone matches.
                    </p>
                  </div>

                  {/* Near-misses */}
                  {listing.nearMisses?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-poppins-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <TrendingUp size={12} className="text-amber-400" />
                        Close — but not quite
                      </p>
                      <div className="space-y-2">
                        {listing.nearMisses.map((nm: NearMiss) => {
                          const missLabel =
                            nm.missReason === 'wrong_type'
                              ? `You want a ${listing.desiredType} — they have a ${nm.currentType}`
                              : nm.missReason === 'over_budget'
                                ? `Their rent (₦${nm.currentRent.toLocaleString()}) is just above your ₦${listing.maxBudget.toLocaleString()} budget`
                                : `Their apartment in ${nm.currentCity} isn't available yet`
                          return (
                            <div
                              key={nm.id}
                              className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3"
                            >
                              <TrendingUp
                                size={14}
                                className="text-amber-400 mt-0.5 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-poppins-bold text-slate-700">
                                  Someone in {nm.currentCity}
                                </p>
                                <p className="text-xs font-poppins-regular text-slate-500 mt-0.5">
                                  {missLabel}
                                </p>
                              </div>
                              <span className="shrink-0 text-[10px] font-poppins-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                {nm.missReason === 'wrong_type'
                                  ? 'Type'
                                  : nm.missReason === 'over_budget'
                                    ? 'Budget'
                                    : 'Timing'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[10px] font-poppins-regular text-slate-300 mt-3 text-center">
                        Update your listing to improve your match rate.
                      </p>
                    </div>
                  )}
                </>
              )}

              {listingIndex < currentUser.listings.length - 1 && (
                <div className="border-b border-slate-100 mt-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}

export default Dashboard
