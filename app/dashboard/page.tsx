'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IncomingInterestListing,
  MatchCandidate,
  User,
  UserSwapListing,
  UserSwapRequest,
  VacancyAlert,
} from '@/shared/types';
import {
  FilePlus, Edit2, Link2Off, ArrowRight,
  ShieldCheck, FileText, Home, CalendarClock,
  BadgeCheck, Clock4,
  Bell,
  Plus,
  Settings,
  ChevronDown,
  Phone,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  FileUp,
  Search,
  Share2,
  Copy,
} from 'lucide-react';
import { Client } from '@/shared/utils/ApiClient';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/app/AuthLayout';
import UpdateEngine from '@/components/UpdateListing';
import { Alert } from '@heroui/alert';
import MatchModal from '@/components/MatchingModal';
import MatchCard from '@/components/MatchCard';
import { Button, ButtonGroup } from '@heroui/react';
import RequestListModal from '@/components/RequestListModal';
import VacancyAlertModal from '@/components/VacancyAlertModal';
import {
  LIVE_UPDATE_CUE_EVENT,
  LIVE_UPDATE_EVENT,
  LiveUpdateCueKind,
  suppressNextInterestSound,
  playLiveUpdateSound,
  type LiveUpdateEventDetail,
} from '@/shared/utils/liveUpdates';
import posthog from 'posthog-js';

function getActiveListing(listings: UserSwapListing[]): UserSwapListing | null {
  if (!listings?.length) return null;
  return (
    listings.find((l) => l.status === 'ACTIVE') ??
    listings.find((l) => l.listingType === 'SEEKING' && l.verificationStatus === 'PENDING') ??
    listings.find((l) => l.listingType === 'SEEKING' && l.verificationStatus === 'REJECTED') ??
    [...listings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
  );
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

const STATUS_COLORS: Record<UserSwapListing['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  MATCHED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-amber-100 text-amber-700',
};

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [updateListing, setUpdateListing] = useState<UserSwapListing | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchCandidate | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [outgoingRequests, setOutgoingRequests] = useState<UserSwapRequest[]>([]);
  const [incomingListings, setIncomingListings] = useState<IncomingInterestListing[]>([]);
  const [openRequestList, setOpenRequestList] = useState(false);
  const [requestTab, setRequestTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [processingInterestId, setProcessingInterestId] = useState<string | null>(null);
  const [requestAttentionActive, setRequestAttentionActive] = useState(false);
  const [requestAttentionPulseActive, setRequestAttentionPulseActive] = useState(false);
  const [vacancyListing, setVacancyListing] = useState<UserSwapListing | null>(null);
  const [vacancySaving, setVacancySaving] = useState(false);
  const [myVacancies, setMyVacancies] = useState<VacancyAlert[]>([]);
  const [copiedVacancyId, setCopiedVacancyId] = useState<string | null>(null);
  const [resubmitListingId, setResubmitListingId] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const resubmitFileRef = useRef<HTMLInputElement | null>(null);
  const previousIncomingOpenRequests = useRef(0);
  const requestAttentionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSoundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const pendingIncomingListings = useMemo(
    () =>
      incomingListings
        .map((listing) => ({
          ...listing,
          requests: listing.requests.filter((request) => request.status === 'REQUESTED'),
        }))
        .filter((listing) => listing.requests.length > 0),
    [incomingListings],
  );

  const outgoingRequestByListingId = useMemo(
    () => new Map(outgoingRequests.map((request) => [request.listing.id, request])),
    [outgoingRequests],
  );

  const pendingOutgoingRequests = useMemo(
    () => outgoingRequests.filter((request) => request.status === 'REQUESTED'),
    [outgoingRequests],
  );

  const pendingIncomingRequestCount = useMemo(
    () => pendingIncomingListings.reduce((total, listing) => total + listing.requests.length, 0),
    [pendingIncomingListings],
  );

  const listingCount = currentUser?.listings.length ?? 0;
  const maxFreeListings = 2;
  const canCreateListing = listingCount < maxFreeListings;
  const requestCount = pendingIncomingRequestCount + pendingOutgoingRequests.length;

  const readCurrentUser = async () => {
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      if (!token) { router.replace('/login'); return; }

      const response = await Client.get('/users/me', {}, { Authorization: `Bearer ${token}` });

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

  const readOutgoingRequests = async () => {
    const token = localStorage.getItem('JWT_TOKEN');
    if (!token) return;
    const response = await Client.get('/matching/interests/outgoing', {}, { Authorization: `Bearer ${token}` });
    if (response.status === 200) setOutgoingRequests(response.data.data.requests ?? []);
  };

  const readIncomingRequests = async () => {
    const token = localStorage.getItem('JWT_TOKEN');
    if (!token) return;
    const response = await Client.get('/matching/interests/incoming', {}, { Authorization: `Bearer ${token}` });
    if (response.status === 200) setIncomingListings(response.data.data.listings ?? []);
  };

  const readRequests = async () => {
    await Promise.all([readIncomingRequests(), readOutgoingRequests()]);
  };

  const readVacancies = async () => {
    const token = localStorage.getItem('JWT_TOKEN');
    if (!token) return;
    const response = await Client.get('/vacancy/me/all', {}, { Authorization: `Bearer ${token}` });
    if (response.status === 200) setMyVacancies(response.data.data ?? []);
  };

  const handleConnect = async (targetListingId: string) => {
    setConnecting(true);
    suppressNextInterestSound();
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      const response = await Client.post(
        `/matching/interests/${targetListingId}/request`,
        {},
        { Authorization: `Bearer ${token}` },
      );

      if (response.status === 200 || response.status === 201) {
        posthog.capture('swap_request_sent', { target_listing_id: targetListingId });
        setSelectedMatch(null);
        setSuccessMsg('Connection request sent!');
        await readRequests();
        return;
      }

      if (response.status === 403) { setErrorMsg('You do not have permission to connect with this listing.'); return; }
      if (response.status === 429) { setErrorMsg('Too many requests. Please wait a moment and try again.'); return; }
      setErrorMsg('Something went wrong. Please try again.');
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleApproveInterest = async (interestId: string) => {
    setProcessingInterestId(interestId);
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      const response = await Client.post(`/matching/interests/${interestId}/approve`, {}, { Authorization: `Bearer ${token}` });
      if (response.status === 200 || response.status === 201) {
        posthog.capture('swap_request_approved', { interest_id: interestId });
        setSuccessMsg('Connection request approved.'); await readRequests(); return;
      }
      setErrorMsg(response.data?.message ?? 'Unable to approve this request right now.');
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.');
    } finally {
      setProcessingInterestId(null);
    }
  };

  const handleDeclineInterest = async (interestId: string) => {
    setProcessingInterestId(interestId);
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      const response = await Client.post(`/matching/interests/${interestId}/decline`, {}, { Authorization: `Bearer ${token}` });
      if (response.status === 200 || response.status === 201) {
        posthog.capture('swap_request_declined', { interest_id: interestId });
        setSuccessMsg('Connection request declined.'); await readRequests(); return;
      }
      setErrorMsg(response.data?.message ?? 'Unable to decline this request right now.');
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.');
    } finally {
      setProcessingInterestId(null);
    }
  };

  const handleOpenListings = () => {
    document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddListing = () => {
    if (!canCreateListing) {
      setErrorMsg('Free plan includes up to 2 listings. Upgrade to Premium for more.');
      return;
    }
    router.push('/engine?from=dashboard');
  };

  const handleSaveVacancyAlert = async (_listingId: string, vacancyPayload: {
    apartmentType: string;
    state: string;
    city: string;
    area: string | null;
    features: string[];
  } | null) => {
    setVacancySaving(true);
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      if (!vacancyPayload) {
        // Delete all existing vacancies (or just the first one if multiple)
        if (myVacancies.length > 0) {
          await Client.delete(`/vacancy/${myVacancies[0].id}`, undefined, { Authorization: `Bearer ${token}` });
        }
        posthog.capture('vacancy_alert_removed');
        setVacancyListing(null);
        setSuccessMsg('Vacancy alert removed.');
        await readVacancies();
        return;
      }
      const response = await Client.post('/vacancy', vacancyPayload, { Authorization: `Bearer ${token}` });
      if (response.status === 200 || response.status === 201) {
        posthog.capture('vacancy_alert_created', {
          apartment_type: vacancyPayload.apartmentType,
          state: vacancyPayload.state,
          city: vacancyPayload.city,
          has_area: !!vacancyPayload.area,
          feature_count: vacancyPayload.features.length,
        });
        setVacancyListing(null);
        setSuccessMsg('Vacancy alert created.');
        await readVacancies();
        return;
      }
      setErrorMsg(response.data?.message ?? 'Unable to save this vacancy alert right now.');
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.');
    } finally {
      setVacancySaving(false);
    }
  };

  const handleResubmitDocument = async (listingId: string, file: File) => {
    setResubmitting(true);
    try {
      const token = localStorage.getItem('JWT_TOKEN');
      const formData = new FormData();
      formData.append('document', file);
      const response = await Client.postFormData(
        `/listings/${listingId}/verification-document`,
        formData,
        { Authorization: `Bearer ${token}` },
      );
      if (response.status === 200 || response.status === 201) {
        setSuccessMsg('Document re-submitted. We will review it shortly.');
        await readCurrentUser();
      } else {
        setErrorMsg(response.data?.message ?? 'Unable to upload document. Please try again.');
      }
    } catch {
      setErrorMsg('Unable to reach the server. Please try again.');
    } finally {
      setResubmitting(false);
      setResubmitListingId(null);
    }
  };

  useEffect(() => {
    readCurrentUser().then(() => Promise.all([readRequests(), readVacancies()])).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!openRequestList) return;
    void readRequests();
  }, [openRequestList]);

  useEffect(() => {
    if (openRequestList && pendingIncomingRequestCount > previousIncomingOpenRequests.current && pendingIncomingListings.length > 0) {
      setRequestTab('incoming');
    }
    previousIncomingOpenRequests.current = pendingIncomingRequestCount;
  }, [pendingIncomingRequestCount, openRequestList, pendingIncomingListings.length]);

  useEffect(() => {
    const handleLiveCue = (event: Event) => {
      const customEvent = event as CustomEvent<{ kind?: LiveUpdateCueKind }>;
      if (customEvent.detail?.kind !== 'request') return;

      setRequestAttentionActive(true);
      setRequestAttentionPulseActive(true);

      if (requestAttentionTimeoutRef.current) clearTimeout(requestAttentionTimeoutRef.current);
      requestAttentionTimeoutRef.current = setTimeout(() => {
        setRequestAttentionPulseActive(false);
        requestAttentionTimeoutRef.current = null;
      }, 2400);

      if (requestSoundIntervalRef.current) clearInterval(requestSoundIntervalRef.current);
      requestSoundIntervalRef.current = setInterval(() => {
        playLiveUpdateSound('request');
      }, 4000);
    };

    window.addEventListener(LIVE_UPDATE_CUE_EVENT, handleLiveCue as EventListener);
    return () => {
      window.removeEventListener(LIVE_UPDATE_CUE_EVENT, handleLiveCue as EventListener);
      if (requestAttentionTimeoutRef.current) clearTimeout(requestAttentionTimeoutRef.current);
      if (requestSoundIntervalRef.current) clearInterval(requestSoundIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (openRequestList && requestSoundIntervalRef.current) {
      clearInterval(requestSoundIntervalRef.current);
      requestSoundIntervalRef.current = null;
    }
  }, [openRequestList]);

  useEffect(() => {
    if (requestCount > 0) return;
    setRequestAttentionActive(false);
    setRequestAttentionPulseActive(false);
    if (requestAttentionTimeoutRef.current) {
      clearTimeout(requestAttentionTimeoutRef.current);
      requestAttentionTimeoutRef.current = null;
    }
    if (requestSoundIntervalRef.current) {
      clearInterval(requestSoundIntervalRef.current);
      requestSoundIntervalRef.current = null;
    }
  }, [requestCount]);

  useEffect(() => {
    const handleLiveUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LiveUpdateEventDetail>).detail;
      if (!detail) return;
      if (detail.type === 'matches.updated' || detail.type === 'user.refresh') void readCurrentUser();
      if (detail.type === 'interests.updated') void readRequests();
    };

    window.addEventListener(LIVE_UPDATE_EVENT, handleLiveUpdate as EventListener);
    return () => window.removeEventListener(LIVE_UPDATE_EVENT, handleLiveUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(async () => {
      setSuccessMsg('');
      setUpdateListing(null);
      await Promise.all([readCurrentUser(), readRequests()]);
      router.refresh();
    }, 2000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(''), 4000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  if (!hydrated) return null;

  const activeListing = currentUser ? getActiveListing(currentUser.listings) : null;

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
            <h2 className="text-2xl sm:text-3xl font-poppins-bold mb-4">Setup Your Swap Engine</h2>
            <p className="text-slate-500 font-poppins-regular mb-8 max-w-md mx-auto text-sm sm:text-base">
              We need to know what you are leaving and what you are looking for to run the home matching algorithm.
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
    );
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
    );
  }

  // ── Toast helper class ─────────────────────────────────────────────────────
  const toastClass = 'fixed top-4 right-4 left-4 sm:left-auto z-[9999] sm:w-full sm:max-w-md';

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
            classNames={{ base: 'shadow-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500 animate-in fade-in slide-in-from-top-2 duration-300' }}
          >
            <span className="text-white font-poppins-bold">{successMsg}</span>
          </Alert>
        </div>
      )}

      {/* Error toast */}
      {errorMsg && (
        <div className={toastClass}>
          <Alert
            color="danger"
            variant="solid"
            isVisible
            onClose={() => setErrorMsg('')}
            classNames={{ base: 'shadow-2xl rounded-2xl border border-red-500/20 bg-red-500 animate-in fade-in slide-in-from-top-2 duration-300' }}
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
        onClose={() => { if (!vacancySaving) setVacancyListing(null); }}
        onSave={handleSaveVacancyAlert}
      />

      <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
          {/* Title row */}
          <div>
            <p className="text-sm text-slate-500 font-poppins-medium mb-1">
              Welcome back,{' '}
              <span className="text-slate-700 font-poppins-bold">{currentUser.fullName}</span>
            </p>
            <h2 className="text-2xl sm:text-4xl font-poppins-bold text-slate-900 tracking-tight">
              Your Swap Dashboard
            </h2>
          </div>

          {/* Action buttons — scrollable on xs, normal on sm+ */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-shrink-0">
            <div className="inline-flex min-w-max sm:min-w-0">
              <ButtonGroup variant="bordered" radius="lg">
                <Button
                  onPress={() => {
                    setRequestAttentionActive(false);
                    setRequestAttentionPulseActive(false);
                    if (requestAttentionTimeoutRef.current) {
                      clearTimeout(requestAttentionTimeoutRef.current);
                      requestAttentionTimeoutRef.current = null;
                    }
                    setRequestTab(pendingIncomingRequestCount > 0 ? 'incoming' : 'outgoing');
                    setOpenRequestList(true);
                  }}
                  className={`relative overflow-visible font-poppins-bold text-sm text-slate-600 border-slate-200 transition-all duration-500 hover:bg-slate-50 data-[hover=true]:bg-slate-50 ${requestAttentionActive ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]' : ''} ${requestAttentionPulseActive ? 'shadow-[0_0_0_8px_rgba(16,185,129,0.18)]' : ''}`}
                  startContent={<Bell size={15} className={requestAttentionActive ? 'text-emerald-600' : 'text-slate-400'} />}
                  endContent={
                    requestCount > 0 && (
                      <span className="relative flex min-w-[18px] items-center justify-center">
                        {requestAttentionPulseActive && (
                          <>
                            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                            <span className="absolute -inset-1 rounded-full border border-emerald-300/80 animate-ping [animation-delay:220ms]" />
                          </>
                        )}
                        <span className={`relative rounded-full bg-emerald-500 px-1.5 py-0.5 text-center text-[10px] font-poppins-bold text-white transition-transform duration-500 ${requestAttentionPulseActive ? 'scale-110' : ''}`}>
                          {requestCount}
                        </span>
                      </span>
                    )
                  }
                >
                  Requests
                </Button>
                <Button
                  onPress={handleOpenListings}
                  className="font-poppins-bold text-sm text-slate-600 border-slate-200 hover:bg-slate-50 data-[hover=true]:bg-slate-50"
                  startContent={<Home size={15} className="text-slate-400" />}
                  endContent={
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-poppins-bold text-slate-500">
                      {listingCount}
                    </span>
                  }
                >
                  Listings
                </Button>
                <Link href="/settings">
                  <Button
                    className="font-poppins-bold text-sm text-slate-600 border-slate-200 hover:bg-slate-50 data-[hover=true]:bg-slate-50"
                    startContent={<Settings size={15} className="text-slate-400" />}
                  >
                    Settings
                  </Button>
                </Link>
              </ButtonGroup>
            </div>
          </div>
        </div>

        {/* ── Listings header ──────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" id="listings-section">
          <div>
            <h3 className="text-xl font-poppins-bold text-slate-800">Your Listings</h3>
            <p className="mt-1 text-sm font-poppins-regular text-slate-500">
              {listingCount}/{maxFreeListings} free listings used. Add up to two listings on the free plan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddListing}
            disabled={!canCreateListing}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-poppins-bold text-emerald-700 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
          >
            <Plus size={15} /> Add Listing
          </button>
        </div>

        {!canCreateListing && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-poppins-bold">Free plan includes up to 2 listings.</span>{' '}
            Upgrade to Premium for more.
          </div>
        )}

        {/* ── Listings list ────────────────────────────────────────────────── */}
        <div className="space-y-12">
          {currentUser.listings.map((listing, listingIndex) => (
            <div key={listing.id}>

              {/* Listing header */}
              <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Title + status */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-poppins-bold text-slate-700">
                    {listing.listingType === 'SEEKING'
                      ? <>Seeking: {listing.desiredType}</>
                      : <>{listing.currentType} → {listing.desiredType}</>}
                  </h3>
                  <span className={`text-xs font-poppins-bold px-2 py-1 rounded-full ${STATUS_COLORS[listing.status]}`}>
                    {listing.status}
                  </span>
                  {listing.listingType === 'SEEKING' && (
                    <span className="text-xs font-poppins-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                      Seeker
                    </span>
                  )}
                  {listing.expiresAt && (
                    <span className="text-xs text-amber-500 font-poppins-medium flex items-center gap-1">
                      <Clock4 size={11} /> Expires {formatDate(listing.expiresAt)}
                    </span>
                  )}
                </div>

                {/* Action buttons — wrap on mobile */}
                <div className="flex flex-wrap items-center gap-2">
                  {listing.listingType !== 'SEEKING' && (
                    <button
                      onClick={() => setVacancyListing(listing)}
                      className="flex items-center gap-1.5 text-xs border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 font-poppins-medium transition-all whitespace-nowrap"
                    >
                      <Bell size={13} />
                      Vacancy Alert
                    </button>
                  )}
                  <button
                    onClick={() => setUpdateListing(listing)}
                    className="flex items-center gap-1.5 text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-50 font-poppins-medium transition-all whitespace-nowrap"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </div>
              </div>

              {/* Verification banners */}
              {listing.listingType === 'SEEKING' && listing.verificationStatus === 'PENDING' && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-poppins-bold text-amber-800">Verification Under Review</p>
                    <p className="text-xs font-poppins-regular text-amber-700 mt-0.5">
                      Your document has been submitted and is being reviewed by our team. We will notify you once approved.
                    </p>
                  </div>
                </div>
              )}
              {listing.listingType === 'SEEKING' && listing.verificationStatus === 'REJECTED' && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-poppins-bold text-red-800">Verification Rejected</p>
                      {listing.verificationNote && (
                        <p className="text-xs font-poppins-regular text-red-700 mt-0.5">{listing.verificationNote}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={resubmitting && resubmitListingId === listing.id}
                      onClick={() => {
                        setResubmitListingId(listing.id);
                        resubmitFileRef.current?.click();
                      }}
                      className="self-start inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-poppins-bold text-red-600 transition-all hover:bg-red-50 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileUp size={11} />
                      {resubmitting && resubmitListingId === listing.id ? 'Uploading…' : 'Re-submit'}
                    </button>
                  </div>
                  <input
                    ref={resubmitListingId === listing.id ? resubmitFileRef : undefined}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleResubmitDocument(listing.id, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              )}

              {/* Listing summary card */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 mb-6">
                {listing.listingType !== 'SEEKING' && (
                  <>
                    <div className="flex-1">
                      <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">Leaving</p>
                      <p className="font-poppins-bold text-slate-800 text-sm">{listing.currentType} · {listing.currentCity}</p>
                      <p className="text-xs text-slate-500 font-poppins-regular mt-0.5">₦{listing.currentRent.toLocaleString()} / yr</p>
                      {listing.currentAvailable ? (
                        <p className="text-xs text-emerald-600 font-poppins-medium mt-0.5 flex items-center gap-1">
                          <BadgeCheck size={11} className="shrink-0" /> Available {formatDate(listing.currentAvailableOn)}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">Not yet available</p>
                      )}
                    </div>

                    {/* Arrow: horizontal on sm+, hidden on xs (vertical flow is implicit) */}
                    <div className="hidden sm:flex items-center text-emerald-400">
                      <ArrowRight size={18} />
                    </div>
                    <div className="flex sm:hidden items-center text-emerald-300">
                      <ChevronDown size={16} />
                    </div>
                  </>
                )}

                <div className="flex-1">
                  <p className="text-[10px] text-emerald-600 font-poppins-bold uppercase tracking-widest mb-1">
                    {listing.listingType === 'SEEKING' ? 'Looking For' : 'Looking For'}
                  </p>
                  <p className="font-poppins-bold text-slate-800 text-sm">{listing.desiredType} · {listing.desiredCity}</p>
                  <p className="text-xs text-slate-500 font-poppins-regular mt-0.5">Budget: ₦{listing.maxBudget.toLocaleString()} / yr</p>
                  <p className="text-xs text-slate-500 font-poppins-regular mt-0.5 flex items-center gap-1">
                    <CalendarClock size={11} className="shrink-0" /> {listing.timeline}
                  </p>
                  {listing.listingType === 'SEEKING' && listing.seekerCategory && (
                    <p className="text-xs text-purple-600 font-poppins-medium mt-0.5 capitalize">
                      {listing.seekerCategory.replace('_', ' ').toLowerCase()}
                    </p>
                  )}
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

              {/* Vacancy alert cards */}
              {listingIndex === 0 && myVacancies.length > 0 && (
                <div className="mb-6 space-y-3">
                  {myVacancies.map((v) => (
                    <div key={v.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] text-amber-600 font-poppins-bold uppercase tracking-widest mb-1">Vacancy Alert</p>
                          <p className="text-sm font-poppins-bold text-slate-800">
                            {v.apartmentType} in{' '}
                            {[v.area, v.city, v.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start">
                          <button
                            type="button"
                            onClick={async () => {
                              const url = `${window.location.origin}/vacancy/${v.id}`;
                              if (navigator.share) {
                                try { await navigator.share({ title: 'Vacancy Alert — TenantSwap', url }); } catch { /* cancelled */ }
                              } else {
                                await navigator.clipboard.writeText(url);
                                setCopiedVacancyId(v.id);
                                setTimeout(() => setCopiedVacancyId(null), 2000);
                              }
                              void Client.post(`/vacancy/${v.id}/share`, {}, { Authorization: `Bearer ${localStorage.getItem('JWT_TOKEN')}` }).catch(() => undefined);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-amber-700 transition-all hover:bg-amber-50 whitespace-nowrap"
                          >
                            {copiedVacancyId === v.id ? <><Copy size={12} /> Copied!</> : <><Share2 size={12} /> Share</>}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const token = localStorage.getItem('JWT_TOKEN');
                              await Client.delete(`/vacancy/${v.id}`, undefined, { Authorization: `Bearer ${token}` });
                              await readVacancies();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-red-600 transition-all hover:bg-red-50 whitespace-nowrap"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {v.features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {v.features.map((feature) => (
                            <span key={feature} className="text-[10px] bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md font-poppins-medium">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Approved contact cards */}
              {(() => {
                const approvedOutgoing = outgoingRequests.filter(
                  (r) => r.requesterListingId === listing.id && r.status === 'CONTACT_APPROVED',
                );
                const approvedIncoming =
                  incomingListings
                    .find((il) => il.listingId === listing.id)
                    ?.requests.filter((r) => r.status === 'CONTACT_APPROVED') ?? [];

                if (approvedOutgoing.length === 0 && approvedIncoming.length === 0) return null;

                return (
                  <div className="mb-6 space-y-3">
                    {approvedOutgoing.map((req) => (
                      <div key={req.interestId} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                              <UserCheck size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-600 font-poppins-bold uppercase tracking-widest mb-0.5">Contact Approved</p>
                              <p className="text-sm font-poppins-bold text-slate-800">{req.owner.fullName}</p>
                              {req.owner.phone && (
                                <p className="text-xs font-poppins-medium text-slate-500 mt-0.5">{req.owner.phone}</p>
                              )}
                            </div>
                          </div>
                          {req.owner.phone && (
                            <a
                              href={`tel:${req.owner.phone}`}
                              className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-blue-600 transition-all hover:bg-blue-50 whitespace-nowrap"
                            >
                              <Phone size={11} /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {approvedIncoming.map((req) => (
                      <div key={req.interestId} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                              <UserCheck size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-600 font-poppins-bold uppercase tracking-widest mb-0.5">You Approved — Their Contact</p>
                              <p className="text-sm font-poppins-bold text-slate-800">{req.requester.fullName}</p>
                              {req.requester.phone && (
                                <p className="text-xs font-poppins-medium text-slate-500 mt-0.5">{req.requester.phone}</p>
                              )}
                            </div>
                          </div>
                          {req.requester.phone && (
                            <a
                              href={`tel:${req.requester.phone}`}
                              className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-blue-600 transition-all hover:bg-blue-50 whitespace-nowrap"
                            >
                              <Phone size={11} /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Matches — only for SWAP listings */}
              {listing.listingType === 'SEEKING' ? (
                <div className="bg-white p-8 sm:p-10 rounded-2xl border border-dashed border-purple-100 text-center">
                  <div className="text-purple-200 flex justify-center mb-3">
                    <Search size={36} />
                  </div>
                  <p className="text-slate-400 font-poppins-bold text-sm">Seeker Listing</p>
                  <p className="text-slate-300 font-poppins-regular text-xs mt-1">
                    {listing.verificationStatus === 'PENDING'
                      ? 'Your application is under review. Matches will be surfaced once approved.'
                      : listing.verificationStatus === 'APPROVED'
                        ? 'Your listing is active. We will notify you when matches are found.'
                        : 'Complete verification to activate your listing.'}
                  </p>
                </div>
              ) : (
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
                        <MatchCard
                          key={match.id}
                          match={match}
                          relatedRequest={outgoingRequestByListingId.get(match.targetListing.id)}
                          onRequestAgain={handleConnect}
                          setSelectedMatch={setSelectedMatch}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 sm:p-10 rounded-2xl border border-dashed border-slate-200 text-center">
                      <div className="text-slate-200 flex justify-center mb-3">
                        <Link2Off size={36} />
                      </div>
                      <p className="text-slate-400 font-poppins-bold text-sm">No matches yet</p>
                      <p className="text-slate-300 font-poppins-regular text-xs mt-1">
                        We will notify you when someone matches this listing.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {listingIndex < currentUser.listings.length - 1 && (
                <div className="border-b border-slate-100 mt-12" />
              )}
            </div>
          ))}
        </div>

        {/* ── Swap Protocol banner ─────────────────────────────────────────── */}
        <div className="mt-16 sm:mt-20 bg-slate-900 text-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-poppins-bold mb-4">The Swap Protocol</h3>
            <p className="text-slate-400 font-poppins-regular leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
              TenantSwap only facilitates the connection. Once you connect with others in your home match,
              you should collectively contact your respective landlords or property managers to handle the paperwork.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <div className="bg-emerald-600/20 text-emerald-400 p-3 sm:p-4 rounded-2xl border border-emerald-600/30">
                <ShieldCheck size={20} className="mb-2 sm:hidden" />
                <ShieldCheck size={24} className="hidden sm:block mb-2" />
                <p className="text-[10px] sm:text-xs font-poppins-bold uppercase">Safe Swapping</p>
              </div>
              <div className="bg-slate-800 text-slate-400 p-3 sm:p-4 rounded-2xl border border-slate-700">
                <FileText size={20} className="mb-2 sm:hidden" />
                <FileText size={24} className="hidden sm:block mb-2" />
                <p className="text-[10px] sm:text-xs font-poppins-bold uppercase">Legal Advice</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 opacity-10 pointer-events-none">
            <Home size={220} className="sm:hidden" />
            <Home size={320} className="hidden sm:block" />
          </div>
        </div>

      </div>
    </AuthLayout>
  );
};

export default Dashboard;