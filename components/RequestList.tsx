'use client'
import React from 'react'
import { MapPin, Clock4, Home, User, BadgeCheck, Phone, Lock } from 'lucide-react'
import { ListingInterestStatus, UserSwapRequest } from '@/shared/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' })
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / 1000 / 60 / 60)
  if (hours < 24) return `${hours}h remaining`
  const days = Math.floor(hours / 24)
  return `${days}d remaining`
}

const STATUS_CONFIG: Record<ListingInterestStatus, { label: string; bg: string; text: string; dot: string }> = {
  REQUESTED: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  CONTACT_APPROVED: { label: 'Approved', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  DECLINED: { label: 'Declined', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
  RELEASED: { label: 'Released', bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-400' },
  EXPIRED: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  CONFIRMED_RENTER: { label: 'Renter Confirmed', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
}

function RequestCard({ request, isLocked }: { request: UserSwapRequest; isLocked?: boolean }) {
  const status = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.REQUESTED
  const isApproved = request.status === 'CONTACT_APPROVED'
  const isExpiringSoon =
    new Date(request.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 &&
    request.status === 'REQUESTED'

  return (
    <div className={`flex items-start gap-4 bg-white border rounded-2xl px-4 py-3.5 hover:shadow-sm transition-all duration-200 ${
      isExpiringSoon ? 'border-red-100 bg-red-50/30' : isApproved ? 'border-emerald-100' : 'border-slate-100'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isApproved ? 'bg-emerald-100' : 'bg-slate-100'}`}>
        <User size={18} className={isApproved ? 'text-emerald-600' : 'text-slate-400'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-poppins-bold text-slate-800 truncate">{request.owner.fullName}</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-poppins-bold px-2 py-0.5 rounded-full shrink-0 ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {isExpiringSoon && (
            <span className="text-[10px] font-poppins-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
              Expiring soon
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 font-poppins-medium">{request.listing.currentType}</span>
          <span className="text-slate-200">·</span>
          <div className="flex items-center gap-1">
            <MapPin size={10} className="text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-400 font-poppins-regular">
              {[request.listing.currentArea, request.listing.currentCity].filter(Boolean).join(', ')}
            </span>
          </div>
          <span className="text-slate-200">·</span>
          <span className="text-xs text-slate-400 font-poppins-regular">
            ₦{request.listing.currentRent.toLocaleString()} / yr
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
            ) : request.owner.phone ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <BadgeCheck size={13} className="text-emerald-600 shrink-0" />
                <a
                  href={`tel:${request.owner.phone}`}
                  className="text-xs font-poppins-bold text-emerald-700 hover:underline"
                >
                  {request.owner.phone}
                </a>
                <a
                  href={`tel:${request.owner.phone}`}
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

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className={`flex items-center gap-1 text-[10px] font-poppins-bold ${isExpiringSoon ? 'text-red-500' : 'text-slate-400'}`}>
          <Clock4 size={11} />
          {timeRemaining(request.expiresAt)}
        </div>
        <span className="text-[10px] text-slate-300 font-poppins-regular">{formatDate(request.createdAt)}</span>
      </div>
    </div>
  )
}

const FREE_CONTACT_LIMIT = 2

interface RequestsListProps {
  requests: UserSwapRequest[]
  totalRequests: number
  isPremium: boolean
  approvedContactsOffset: number
}

export default function RequestsList({ requests, isPremium, approvedContactsOffset }: RequestsListProps) {
  if (!requests.length) {
    return (
      <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Home size={20} className="text-slate-300" />
        </div>
        <p className="font-poppins-bold text-slate-400 text-sm">No outgoing requests yet</p>
        <p className="text-slate-300 font-poppins-regular text-xs mt-1">
          Requests you send to matching listings will appear here.
        </p>
      </div>
    )
  }

  let approvedSeen = approvedContactsOffset

  return (
    <div className="flex flex-col gap-2">
      {requests.map((request) => {
        let isLocked = false
        if (request.status === 'CONTACT_APPROVED') {
          isLocked = !isPremium && approvedSeen >= FREE_CONTACT_LIMIT
          approvedSeen++
        }
        return <RequestCard key={request.interestId} request={request} isLocked={isLocked} />
      })}
    </div>
  )
}
