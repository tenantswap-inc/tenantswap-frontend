// components/MatchModal.tsx
'use client'
import React, { useEffect } from 'react'
import { X, MapPin, BadgeCheck, CalendarClock, TrendingUp, ArrowRight, Zap, Loader2 } from 'lucide-react'
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

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200'
  if (score >= 50) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export default function MatchModal({
  match,
  listing,
  open,
  connecting = false,
  onClose,
  onConnect,
}: Props) {

  // lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open || !match || !listing) return null

  const t = match.targetListing

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl
                      max-h-[92dvh] overflow-y-auto flex flex-col
                      animate-in fade-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className={scoreColor(match.totalScore)} />
            <span className={`text-sm font-poppins-bold ${scoreColor(match.totalScore)}`}>
              {match.totalScore}% match
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-all"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">


          {/* Side by side */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">

            {/* Your listing */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-3">Your Place</p>
              <p className="font-poppins-bold text-slate-800 text-sm">{listing.currentType}</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-slate-400" />
                <p className="text-xs text-slate-500 font-poppins-regular">
                  {listing.currentArea}, {listing.currentCity}
                </p>
              </div>
              <p className="text-xs text-slate-500 font-poppins-regular mt-1">
                ₦{listing.currentRent.toLocaleString()} / yr
              </p>
              {listing.currentAvailable ? (
                <p className="text-xs text-emerald-600 font-poppins-medium mt-1 flex items-center gap-1">
                  <BadgeCheck size={11} /> {formatDate(listing.currentAvailableOn)}
                </p>
              ) : (
                <p className="text-xs text-slate-400 font-poppins-regular mt-1">Not yet available</p>
              )}
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center text-emerald-400 mt-2">
              <ArrowRight size={18} />
            </div>

            {/* Their listing */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-[10px] font-poppins-bold text-emerald-600 uppercase tracking-widest mb-3">Their Place</p>
              <p className="font-poppins-bold text-slate-800 text-sm">{t.currentType}</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-emerald-500" />
                <p className="text-xs text-slate-500 font-poppins-regular">
                  {t.currentArea}, {t.currentCity}
                </p>
              </div>
              <p className="text-xs text-slate-500 font-poppins-regular mt-1">
                ₦{t.currentRent.toLocaleString()} / yr
              </p>
              {t.currentAvailable ? (
                <p className="text-xs text-emerald-600 font-poppins-medium mt-1 flex items-center gap-1">
                  <BadgeCheck size={11} /> {formatDate(t.currentAvailableOn)}
                </p>
              ) : (
                <p className="text-xs text-slate-400 font-poppins-regular mt-1">Not yet available</p>
              )}
            </div>
          </div>

          {/* What they want */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <p className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-3">
              They're Looking For
            </p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[
                { label: 'Type',     value: t.desiredType },
                { label: 'Location', value: `${t.desiredArea}, ${t.desiredCity}` },
                { label: 'Budget',   value: `₦${t.maxBudget.toLocaleString()} / yr` },
                { label: 'Timeline', value: t.timeline },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 font-poppins-medium uppercase">{label}</p>
                  <p className="text-sm font-poppins-bold text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Their features */}
          {t.features.length > 0 && (
            <div>
              <p className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-2">
                Their Features
              </p>
              <div className="flex flex-wrap gap-2">
                {t.features.map((f) => (
                  <span
                    key={f}
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-poppins-medium"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expiry note */}
          {t.expiresAt && (
            <p className="text-xs text-amber-500 font-poppins-medium text-center">
              This listing expires {formatDate(t.expiresAt)}
            </p>
          )}

        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-6 pt-2 sticky bottom-0 bg-white border-t border-slate-100">
          <button
            onClick={() => onConnect(match.targetListing.id)}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                       text-white font-poppins-bold py-3.5 rounded-2xl transition-all
                       shadow-lg shadow-emerald-600/20 active:scale-[0.99]
                       disabled:opacity-60 disabled:cursor-not-allowed"
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
          </button>
          <p className="text-center text-xs text-slate-400 font-poppins-regular mt-2">
            They'll be notified of your interest
          </p>
        </div>

      </div>
    </div>
  )
}