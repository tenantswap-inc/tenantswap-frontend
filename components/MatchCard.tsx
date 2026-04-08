import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MatchCandidate, UserSwapRequest } from '@/shared/types'
import { TrendingUp, ArrowRight, MapPin, BadgeCheck, Phone, UserRound, RotateCcw } from 'lucide-react'
import posthog from 'posthog-js'
import { Client } from '@/shared/utils/ApiClient'

interface Props {
  match: MatchCandidate
  relatedRequest?: UserSwapRequest
  onRequestAgain: (targetListingId: string) => void
  setSelectedMatch: (match: MatchCandidate | null) => void
  variant?: 'default' | 'close'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' })
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-400'
}

const REQUEST_STATUS_STYLES: Record<UserSwapRequest['status'], { label: string; className: string }> = {
  REQUESTED: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  CONTACT_APPROVED: {
    label: 'Approved',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  DECLINED: {
    label: 'Declined',
    className: 'border-red-200 bg-red-50 text-red-600',
  },
  RELEASED: {
    label: 'Released',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'border-slate-200 bg-slate-50 text-slate-500',
  },
  CONFIRMED_RENTER: {
    label: 'Confirmed',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
}

const MatchCard: React.FC<Props> = ({ match, relatedRequest, onRequestAgain, setSelectedMatch, variant = 'default' }) => {
  const { targetListing: t, totalScore } = match
  const [showContact, setShowContact] = useState(false)

  if (t.status !== 'ACTIVE') {
    return null
  }
  const requestStatus = relatedRequest ? REQUEST_STATUS_STYLES[relatedRequest.status] : null
  const canViewContact = relatedRequest?.status === 'CONTACT_APPROVED' && !!relatedRequest.owner.phone
  const canRequestAgain = relatedRequest?.status === 'DECLINED'

  // ── Compact "close but not quite" row ──────────────────────────────────────
  if (variant === 'close') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
      >
        <span className="text-xs font-poppins-bold text-slate-400 tabular-nums w-8 shrink-0">
          {totalScore}%
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-poppins-bold text-slate-600 truncate">
            {t.currentType} in {t.currentCity}
          </p>
          <p className="text-xs text-slate-400 font-poppins-regular truncate">
            ₦{t.currentRent.toLocaleString()} / yr · Wants {t.desiredType} in {t.desiredCity}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const token = localStorage.getItem('JWT_TOKEN')
            if (token) void Client.post(`/listings/${t.id}/view`, {}, { Authorization: `Bearer ${token}` }).catch(() => undefined)
            setSelectedMatch(match)
          }}
          className="shrink-0 text-xs font-poppins-bold text-slate-400 hover:text-emerald-600 transition-colors"
        >
          View
        </button>
      </motion.div>
    )
  }

  // ── Full potential match card ───────────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      whileHover={{ y: -6, boxShadow: '0 24px 38px rgba(15, 23, 42, 0.08)' }}
      className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:border-emerald-200"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 shadow-sm transition-all duration-300 group-hover:bg-amber-100"
        >
          <TrendingUp size={14} className={scoreColor(totalScore)} />
          <span className={`text-sm font-poppins-bold ${scoreColor(totalScore)}`}>
            {totalScore}% match
          </span>
        </motion.div>

        {requestStatus ? (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-poppins-bold ${requestStatus.className}`}
          >
            {requestStatus.label}
          </motion.span>
        ) : (
          <motion.button
            type="button"
            onClick={() => {
              posthog.capture("match_explored", {
                match_score: totalScore,
                target_city: t.currentCity,
                target_type: t.currentType,
                target_rent: t.currentRent,
              })
              const token = localStorage.getItem('JWT_TOKEN')
              if (token) void Client.post(`/listings/${t.id}/view`, {}, { Authorization: `Bearer ${token}` }).catch(() => undefined)
              setSelectedMatch(match)
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-emerald-700 shadow-sm hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200"
          >
            Explore <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </motion.button>
        )}
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-poppins-bold text-slate-800">
          <MapPin size={13} className="shrink-0 text-emerald-500" />
          <span>{t.currentType} in {t.currentCity}</span>
        </p>
        <p className="text-xs font-poppins-regular text-slate-500">
          Rent: ₦{t.currentRent.toLocaleString()} / yr
        </p>
        {t.currentAvailable && t.currentAvailableOn && (
          <p className="flex items-center gap-1 text-xs font-poppins-medium text-emerald-600">
            <BadgeCheck size={11} className="shrink-0" /> Available {formatDate(t.currentAvailableOn)}
          </p>
        )}
        <p className="flex items-center gap-1 text-xs font-poppins-medium text-slate-400 pt-1 border-t border-slate-100">
          <ArrowRight size={11} className="shrink-0" />
          Wants: {t.desiredType} in {t.desiredCity}
        </p>
      </div>

      {canViewContact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 shadow-sm"
        >
          <motion.button
            type="button"
            onClick={() => setShowContact((prev) => !prev)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-poppins-bold text-white transition-all hover:bg-emerald-700"
          >
            <Phone size={12} /> {showContact ? 'Hide Contact' : 'View Contact'}
          </motion.button>

          {showContact && relatedRequest && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              className="mt-3 space-y-2 overflow-hidden text-xs text-slate-600"
            >
              <p className="flex items-center gap-2 font-poppins-medium">
                <UserRound size={13} className="text-emerald-600" /> {relatedRequest.owner.fullName}
              </p>
              <p className="flex items-center gap-2 font-poppins-medium">
                <Phone size={13} className="text-emerald-600" /> {relatedRequest.owner.phone}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {canRequestAgain && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 p-3 shadow-sm"
        >
          <motion.button
            type="button"
            onClick={() => {
              posthog.capture("swap_request_retried", {
                target_listing_id: t.id,
                match_score: totalScore,
              })
              onRequestAgain(t.id)
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-2 text-xs font-poppins-bold text-white transition-all hover:bg-red-600"
          >
            <RotateCcw size={12} /> Request Again
          </motion.button>
        </motion.div>
      )}

      {t.features.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-[10px] font-poppins-bold uppercase tracking-widest text-slate-400">
            Features
          </p>
          <div className="flex flex-wrap gap-1.5">
            {t.features.map((feature) => (
              <motion.span
                key={feature}
                whileHover={{ y: -1 }}
                className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-poppins-medium text-emerald-600 shadow-sm transition-all duration-300"
              >
                {feature}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default MatchCard
