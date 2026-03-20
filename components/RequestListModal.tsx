'use client'
import React from 'react'
import { IncomingInterestListing, UserSwapRequest } from '@/shared/types'
import RequestsList from '@/components/RequestList'
import IncomingRequestList from '@/components/IncomingRequestList'
import { ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react'

interface RequestListModalProps {
  open: boolean
  onClose: () => void
  outgoingRequests: UserSwapRequest[]
  outgoingTotalRequests: number
  incomingListings: IncomingInterestListing[]
  incomingOpenRequests: number
  activeTab: 'incoming' | 'outgoing'
  onTabChange: (tab: 'incoming' | 'outgoing') => void
  onApprove: (interestId: string) => void
  onDecline: (interestId: string) => void
  processingInterestId: string | null
}

const RequestListModal: React.FC<RequestListModalProps> = ({
  open,
  onClose,
  outgoingRequests,
  outgoingTotalRequests,
  incomingListings,
  incomingOpenRequests,
  activeTab,
  onTabChange,
  onApprove,
  onDecline,
  processingInterestId,
}) => {
  if (!open) return null

  return (
    <div className="inset-0 fixed z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] overflow-y-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl">
          <div>
            <span className="text-sm font-poppins-bold text-slate-700">Connection Requests</span>
            <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">Review incoming interest and track your outgoing requests.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-all"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 pt-4 border-b border-slate-100 bg-white sticky top-[76px] z-10">
          <div className="flex flex-wrap gap-2 pb-4">
            <button
              type="button"
              onClick={() => onTabChange('incoming')}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-poppins-bold transition-all ${
                activeTab === 'incoming'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ArrowDownToLine size={14} /> Incoming
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === 'incoming' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                {incomingOpenRequests}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('outgoing')}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-poppins-bold transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                  : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ArrowUpFromLine size={14} /> Outgoing
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === 'outgoing' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {outgoingTotalRequests}
              </span>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 flex-1 overflow-y-auto">
          {activeTab === 'incoming' ? (
            <IncomingRequestList
              listings={incomingListings}
              processingInterestId={processingInterestId}
              onApprove={onApprove}
              onDecline={onDecline}
            />
          ) : (
            <RequestsList requests={outgoingRequests} totalRequests={outgoingTotalRequests} />
          )}
        </div>
      </div>
    </div>
  )
}

export default RequestListModal
