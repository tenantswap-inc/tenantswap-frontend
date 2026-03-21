'use client'

import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MapPin, BadgeCheck, TrendingUp, ArrowRight, Zap, Loader2 } from 'lucide-react'
import { MatchCandidate, UserSwapListing } from '@/shared/types'

interface Props {
  match: MatchCandidate | null
  listing: UserSwapListing | null
  open: boolean
  connecting?: boolean
  onClose: () => void
  onConnect: (matchId: string) => void
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

export default function MatchModal({
  match,
  listing,
  open,
  connecting = false,
  onClose,
  onConnect,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!match || !listing) {
    return null
  }

  const t = match.targetListing

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
            initial={{ opacity: 0, y: 42, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.985 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-100 bg-white px-5 pb-4 pt-5">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08, duration: 0.24 }}
                  className="flex items-center gap-2"
                >
                  <TrendingUp size={18} className={scoreColor(match.totalScore)} />
                  <span className={`text-sm font-poppins-bold ${scoreColor(match.totalScore)}`}>
                    {match.totalScore}% match
                  </span>
                </motion.div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.06, rotate: 90 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200"
                >
                  <X size={16} className="text-slate-500" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.24 }}
                className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2"
              >
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="mb-3 text-[10px] font-poppins-bold uppercase tracking-widest text-slate-400">Your Place</p>
                  <p className="text-sm font-poppins-bold text-slate-800">{listing.currentType}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />
                    <p className="text-xs font-poppins-regular text-slate-500">
                      {listing.currentArea}, {listing.currentCity}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-poppins-regular text-slate-500">
                    ₦{listing.currentRent.toLocaleString()} / yr
                  </p>
                  {listing.currentAvailable ? (
                    <p className="mt-1 flex items-center gap-1 text-xs font-poppins-medium text-emerald-600">
                      <BadgeCheck size={11} /> {formatDate(listing.currentAvailableOn)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-poppins-regular text-slate-400">Not yet available</p>
                  )}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.16, duration: 0.22 }}
                  className="mt-2 flex items-center justify-center text-emerald-400"
                >
                  <ArrowRight size={18} />
                </motion.div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="mb-3 text-[10px] font-poppins-bold uppercase tracking-widest text-emerald-600">Their Place</p>
                  <p className="text-sm font-poppins-bold text-slate-800">{t.currentType}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <MapPin size={11} className="text-emerald-500" />
                    <p className="text-xs font-poppins-regular text-slate-500">
                      {t.currentArea}, {t.currentCity}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-poppins-regular text-slate-500">
                    ₦{t.currentRent.toLocaleString()} / yr
                  </p>
                  {t.currentAvailable ? (
                    <p className="mt-1 flex items-center gap-1 text-xs font-poppins-medium text-emerald-600">
                      <BadgeCheck size={11} /> {formatDate(t.currentAvailableOn)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-poppins-regular text-slate-400">Not yet available</p>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.24 }}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm"
              >
                <p className="mb-3 text-[10px] font-poppins-bold uppercase tracking-widest text-slate-400">
                  They're Looking For
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { label: 'Type', value: t.desiredType },
                    { label: 'Location', value: `${t.desiredArea}, ${t.desiredCity}` },
                    { label: 'Budget', value: `₦${t.maxBudget.toLocaleString()} / yr` },
                    { label: 'Timeline', value: t.timeline },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-poppins-medium uppercase text-slate-400">{label}</p>
                      <p className="mt-0.5 text-sm font-poppins-bold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {t.features.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.24 }}
                >
                  <p className="mb-2 text-[10px] font-poppins-bold uppercase tracking-widest text-slate-400">
                    Their Features
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {t.features.map((f) => (
                      <span
                        key={f}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-poppins-medium text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {t.expiresAt && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.22, duration: 0.24 }}
                  className="text-center text-xs font-poppins-medium text-amber-500"
                >
                  This listing expires {formatDate(t.expiresAt)}
                </motion.p>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-slate-100 bg-white px-5 pb-6 pt-2">
              <motion.button
                type="button"
                onClick={() => onConnect(match.targetListing.id)}
                disabled={connecting}
                whileHover={connecting ? undefined : { y: -2, boxShadow: '0 22px 32px rgba(5,150,105,0.24)' }}
                whileTap={connecting ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-poppins-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Connect with This Tenant
                  </>
                )}
              </motion.button>
              <p className="mt-2 text-center text-xs font-poppins-regular text-slate-400">
                They'll be notified of your interest
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
