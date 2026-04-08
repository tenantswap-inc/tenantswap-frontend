'use client'
import React from 'react'
import { BadgeCheck, Clock4, Home, Lock, MapPin, Phone, User } from 'lucide-react'
import { IncomingInterestListing, ListingInterestStatus } from '@/shared/types'

const FREE_CONTACT_LIMIT = 2

const STATUS_CONFIG: Record<ListingInterestStatus, { label: string; bg: string; text: string; dot: string }> = {
  REQUESTED: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  CONTACT_APPROVED: { label: 'Approved', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  DECLINED: { label: 'Declined', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
  RELEASED: { label: 'Released', bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-400' },
  EXPIRED: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  CONFIRMED_RENTER: { label: 'Renter Confirmed', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' })
}

function timeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return 'No deadline'
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / 1000 / 60 / 60)
  if (hours < 24) return `${hours}h remaining`
  const days = Math.floor(hours / 24)
  return `${days}d remaining`
}

interface IncomingRequestListProps {
  listings: IncomingInterestListing[]
  processingInterestId: string | null
  onApprove: (interestId: string) => void
  onDecline: (interestId: string) => void
  isPremium: boolean
  approvedContactsOffset: number
}

export default function IncomingRequestList({
  listings,
  processingInterestId,
  onApprove,
  onDecline,
  isPremium,
  approvedContactsOffset,
}: IncomingRequestListProps) {
  // Show both pending and approved — approved show phone/lock
  const visibleListings = listings
    .map((listing) => ({
      ...listing,
      requests: listing.requests.filter(
        (r) => r.status === 'REQUESTED' || r.status === 'CONTACT_APPROVED'
      ),
    }))
    .filter((listing) => listing.requests.length > 0)

  if (!visibleListings.length) {
    return (
      <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Home size={20} className="text-slate-300" />
        </div>
        <p className="font-poppins-bold text-slate-400 text-sm">No incoming requests yet</p>
        <p className="text-slate-300 font-poppins-regular text-xs mt-1">
          When someone requests to connect with your listing, it will appear here.
        </p>
      </div>
    )
  }

  let approvedSeen = approvedContactsOffset

  return (
    <div className="flex flex-col gap-4">
      {visibleListings.map((listing) => (
        <div key={listing.listingId} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-poppins-bold uppercase tracking-widest text-emerald-600">Your listing</p>
              <p className="mt-1 text-sm font-poppins-bold text-slate-800">
                {listing.currentType} · {[listing.currentArea, listing.currentCity].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs font-poppins-regular text-slate-400">₦{listing.currentRent.toLocaleString()} / yr</p>
            </div>
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-poppins-bold text-emerald-700">
              <BadgeCheck size={11} /> {listing.requests.filter((r) => r.status === 'REQUESTED').length} pending
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {listing.requests.map((request) => {
              const status = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.REQUESTED
              const isPending = request.status === 'REQUESTED'
              const isApproved = request.status === 'CONTACT_APPROVED'
              const isProcessing = processingInterestId === request.interestId

              let isLocked = false
              if (isApproved) {
                isLocked = !isPremium && approvedSeen >= FREE_CONTACT_LIMIT
                approvedSeen++
              }

              return (
                <div key={request.interestId} className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${isApproved ? 'border-emerald-100' : 'border-white'}`}>
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          <User size={16} />
                        </div>
                        <p className="text-sm font-poppins-bold text-slate-800">{request.requester.fullName}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-poppins-bold ${status.bg} ${status.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} className="text-emerald-500" /> Request sent {formatDate(request.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock4 size={11} /> {timeRemaining(request.expiresAt)}
                        </span>
                      </div>

                      {isApproved && (
                        <div className="mt-2">
                          {isLocked ? (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                              <Lock size={13} className="text-amber-500 shrink-0" />
                              <span className="text-xs font-poppins-bold text-amber-700">Contact locked · </span>
                              <span className="text-xs font-poppins-bold text-amber-600">Upgrade to unlock</span>
                            </div>
                          ) : request.requester.phone ? (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                              <BadgeCheck size={13} className="text-emerald-600 shrink-0" />
                              <a
                                href={`tel:${request.requester.phone}`}
                                className="text-xs font-poppins-bold text-emerald-700 hover:underline"
                              >
                                {request.requester.phone}
                              </a>
                              <a
                                href={`tel:${request.requester.phone}`}
                                className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-poppins-bold text-white"
                              >
                                <Phone size={10} /> Call
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs font-poppins-regular text-slate-400 italic">No phone number on file</span>
                          )}
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onDecline(request.interestId)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-poppins-bold text-slate-500 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessing ? 'Working...' : 'Decline'}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onApprove(request.interestId)}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-poppins-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessing ? 'Working...' : 'Approve'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
