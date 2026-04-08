'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, MapPin, Home, BadgeCheck, Clock4, Banknote,
  Search, Wrench, Phone, User
} from 'lucide-react'
import { UserSwapListing } from '@/shared/types'

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' })
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs font-poppins-bold text-slate-400 uppercase tracking-wide shrink-0 w-32">{label}</span>
      <span className="text-xs font-poppins-medium text-slate-700 text-right">{value ?? '—'}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-poppins-bold uppercase tracking-widest text-emerald-600 mb-2">{title}</p>
      <div className="bg-slate-50 rounded-xl px-3 py-1">
        {children}
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  MATCHED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-amber-100 text-amber-700',
}

interface Props {
  listing: UserSwapListing | null
  onClose: () => void
  onEdit: () => void
}

export default function ListingPreviewModal({ listing, onClose, onEdit }: Props) {
  return (
    <AnimatePresence>
      {listing ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl sm:mb-4"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-100 bg-white px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-poppins-bold text-slate-800">
                      {listing.listingType === 'SEEKING'
                        ? `Seeking ${listing.desiredType}`
                        : `${listing.currentType} → ${listing.desiredType}`}
                    </span>
                    <span className={`text-[10px] font-poppins-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[listing.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {listing.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-poppins-regular text-slate-400">
                    {listing.listingType === 'SEEKING' ? 'Seeker listing' : 'Swap listing'} · Created {fmt(listing.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* Current apartment */}
              {listing.listingType !== 'SEEKING' && (
                <Section title="Current Apartment">
                  <Row label="Type" value={listing.currentType} />
                  <Row label="City" value={listing.currentCity} />
                  <Row label="Area" value={listing.currentArea} />
                  <Row label="State" value={listing.currentState} />
                  <Row label="Rent / yr" value={`₦${listing.currentRent.toLocaleString()}`} />
                  <Row
                    label="Available"
                    value={
                      listing.currentAvailable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <BadgeCheck size={11} /> {listing.currentAvailableOn ? fmt(listing.currentAvailableOn) : 'Yes'}
                        </span>
                      ) : 'Not yet'
                    }
                  />
                </Section>
              )}

              {/* Looking for */}
              <Section title="Looking For">
                <Row label="Type" value={listing.desiredType} />
                <Row label="City" value={listing.desiredCity} />
                <Row label="Area" value={listing.desiredArea} />
                <Row label="State" value={listing.desiredState} />
                <Row label="Max budget" value={`₦${listing.maxBudget.toLocaleString()} / yr`} />
                <Row label="Timeline" value={listing.timeline} />
              </Section>

              {/* Features */}
              {listing.features && listing.features.length > 0 && (
                <Section title="Home Features">
                  <div className="flex flex-wrap gap-2 py-2.5">
                    {listing.features.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-poppins-bold px-2.5 py-1 rounded-full">
                        <Wrench size={10} /> {f}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Caretaker */}
              {(listing.caretakerName || listing.caretakerPhone) && (
                <Section title="Caretaker">
                  {listing.caretakerName && <Row label="Name" value={<span className="inline-flex items-center gap-1"><User size={11} />{listing.caretakerName}</span>} />}
                  {listing.caretakerPhone && (
                    <Row
                      label="Phone"
                      value={
                        <a href={`tel:${listing.caretakerPhone}`} className="inline-flex items-center gap-1 text-emerald-600 font-poppins-bold">
                          <Phone size={11} /> {listing.caretakerPhone}
                        </a>
                      }
                    />
                  )}
                </Section>
              )}

              {/* Expiry */}
              <Section title="Listing Info">
                <Row label="Expires" value={listing.expiresAt ? <span className="inline-flex items-center gap-1 text-amber-600"><Clock4 size={11} />{fmt(listing.expiresAt)}</span> : 'No expiry'} />
                <Row label="Viewed" value={`${listing.viewCount} time${listing.viewCount !== 1 ? 's' : ''}`} />
                {listing.matchedAt && <Row label="Matched on" value={fmt(listing.matchedAt)} />}
              </Section>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => { onClose(); onEdit() }}
                className="w-full rounded-xl bg-primary-green px-4 py-3 text-sm font-poppins-bold text-white transition-all active:scale-[0.98] hover:bg-primary-green/90"
              >
                Edit This Listing
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
