'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, User, HandHeart, ChevronRight } from 'lucide-react'
import { Client } from '@/shared/utils/ApiClient'

interface Props {
  listingId: string
  listingLabel: string // e.g. "2BR Flat in Lagos"
  onSuccess: () => void
  onMaybeLater: () => void
  onDontAskAgain: () => void
}

const CaretakerModal: React.FC<Props> = ({
  listingId,
  listingLabel,
  onSuccess,
  onMaybeLater,
  onDontAskAgain,
}) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in both fields.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      const res = await Client.patch(
        `/listings/${listingId}/caretaker`,
        { caretakerName: name.trim(), caretakerPhone: phone.trim() },
        { Authorization: `Bearer ${token}` },
      )
      if (res.status === 200 || res.status === 201) {
        onSuccess()
      } else {
        setError(res.data?.message ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Could not save. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDontAskAgain = async () => {
    setDismissing(true)
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      await Client.post('/users/me/caretaker-prompt/dismiss', {}, { Authorization: `Bearer ${token}` })
    } catch { /* silent */ } finally {
      setDismissing(false)
      onDontAskAgain()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
        onClick={onMaybeLater}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Green top bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />

          <div className="px-6 pt-6 pb-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                  <HandHeart size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-poppins-bold uppercase tracking-widest text-emerald-600">
                    Help Us Help You
                  </p>
                  <h2 className="text-base font-poppins-bold text-slate-900 leading-tight">
                    Share Your Caretaker&apos;s Contact
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onMaybeLater}
                className="mt-0.5 shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Purpose message */}
            <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 text-sm text-emerald-800 font-poppins-regular leading-relaxed">
              <p className="font-poppins-bold text-emerald-700 mb-1">Why are we asking?</p>
              We want to put an end to caution fee, agreement fee, agent fee and inspection fee{' '}
              <span className="font-poppins-bold">permanently</span> for you, our beloved customer.
              {' '}So, we created a proposal that your caretaker or Facility Manager needs to see.
              But, we need your help to reach him/her.
            </div>

            {/* Listing label */}
            <p className="mb-3 text-xs font-poppins-medium text-slate-400">
              For your listing: <span className="text-slate-600 font-poppins-bold">{listingLabel}</span>
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Caretaker / Facility Manager Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm font-poppins-regular text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm font-poppins-regular text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {error && (
                <p className="text-xs font-poppins-medium text-red-500 px-1">{error}</p>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-poppins-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Submit Contact'}
                {!submitting && <ChevronRight size={15} />}
              </motion.button>
            </form>
          </div>

          {/* Bottom actions */}
          <div className="flex divide-x divide-slate-100 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onMaybeLater}
              className="flex-1 py-3.5 text-xs font-poppins-medium text-slate-400 hover:bg-slate-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={handleDontAskAgain}
              disabled={dismissing}
              className="flex-1 py-3.5 text-xs font-poppins-medium text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Don&apos;t Ask Again
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CaretakerModal
