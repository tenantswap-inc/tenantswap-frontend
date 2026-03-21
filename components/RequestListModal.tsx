'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
            className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.985 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-100 bg-white px-5 pb-4 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-poppins-bold text-slate-700">Connection Requests</span>
                  <p className="mt-0.5 text-xs font-poppins-regular text-slate-400">
                    Review incoming interest and track your outgoing requests.
                  </p>
                </div>
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

            <div className="sticky top-[76px] z-10 border-b border-slate-100 bg-white px-5 pt-4">
              <div className="flex flex-wrap gap-2 pb-4">
                <motion.button
                  type="button"
                  onClick={() => onTabChange('incoming')}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-poppins-bold transition-all duration-300 ${
                    activeTab === 'incoming'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'border border-slate-200 text-slate-500 hover:bg-slate-50 hover:shadow-sm'
                  }`}
                >
                  <ArrowDownToLine size={14} /> Incoming
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === 'incoming' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    {incomingOpenRequests}
                  </span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => onTabChange('outgoing')}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-poppins-bold transition-all duration-300 ${
                    activeTab === 'outgoing'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'border border-slate-200 text-slate-500 hover:bg-slate-50 hover:shadow-sm'
                  }`}
                >
                  <ArrowUpFromLine size={14} /> Outgoing
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === 'outgoing' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {outgoingTotalRequests}
                  </span>
                </motion.button>
              </div>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-1 overflow-y-auto px-5 py-4"
            >
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
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default RequestListModal
