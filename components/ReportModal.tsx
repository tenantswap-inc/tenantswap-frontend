import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Client } from '@/shared/utils/ApiClient'

interface Props {
  reportedUserId: string
  reportedName?: string
  onClose: () => void
}

const REASONS: { value: string; label: string; description: string }[] = [
  { value: 'AGENT_SUSPECTED', label: 'Suspected Agent', description: 'This person appears to be a real estate agent misusing the platform' },
  { value: 'FAKE_LISTING', label: 'Fake Listing', description: 'The listing details look fabricated or misleading' },
  { value: 'SCAM', label: 'Scam / Fraud', description: 'This person attempted to scam or defraud me' },
  { value: 'HARASSMENT', label: 'Harassment', description: 'This person harassed or threatened me' },
  { value: 'OTHER', label: 'Other', description: 'Something else not listed above' },
]

const ReportModal: React.FC<Props> = ({ reportedUserId, reportedName, onClose }) => {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!reason) return
    setStatus('loading')
    try {
      const token = localStorage.getItem('JWT_TOKEN')
      const res = await Client.post(
        `/users/${reportedUserId}/report`,
        { reason, details: details.trim() || undefined },
        { Authorization: `Bearer ${token}` },
      )
      if (res.status === 200 || res.status === 201) {
        setStatus('success')
      } else {
        setErrorMsg(res.data?.message ?? 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not submit report. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            <h2 className="text-sm font-poppins-bold text-slate-800">
              Report {reportedName ? reportedName.split(' ')[0] : 'User'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          {status === 'success' ? (
            <div className="py-6 text-center">
              <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
              <p className="text-sm font-poppins-bold text-slate-800">Report submitted</p>
              <p className="text-xs font-poppins-regular text-slate-500 mt-1">
                Our team will review this. Thank you for keeping TenantSwap safe.
              </p>
              <button
                onClick={onClose}
                className="mt-5 rounded-xl bg-slate-100 px-5 py-2 text-xs font-poppins-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-poppins-regular text-red-600">{errorMsg}</p>
                </div>
              )}

              <p className="text-xs font-poppins-regular text-slate-500 mb-4">
                Select the reason that best describes the issue. Reports are anonymous.
              </p>

              {/* Reason options */}
              <div className="space-y-2 mb-4">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-all ${
                      reason === r.value
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 accent-red-500"
                    />
                    <div>
                      <p className="text-xs font-poppins-bold text-slate-700">{r.label}</p>
                      <p className="text-[11px] font-poppins-regular text-slate-400">{r.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Details */}
              <div className="mb-5">
                <label className="block text-xs font-poppins-bold text-slate-500 mb-1.5">
                  Additional details <span className="font-poppins-regular text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Tell us what happened..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-poppins-regular text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none"
                />
                <p className="text-right text-[10px] text-slate-300 mt-0.5">{details.length}/500</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-poppins-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason || status === 'loading'}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-xs font-poppins-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Flag size={13} />}
                  Submit Report
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ReportModal
