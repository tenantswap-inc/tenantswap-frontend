'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, MapPin, UserCheck, X, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export type ActivityToastData = {
  id: string
  kind: 'vacancy' | 'request' | 'approved' | 'declined' | 'generic'
  title: string
  message: string
  ctaLabel?: string
  ctaHref?: string
  createdAt: Date
}

interface Props {
  toast: ActivityToastData | null
  onClose: () => void
}

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

const KIND_CONFIG = {
  vacancy: {
    icon: MapPin,
    iconBg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    ctaClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    dotColor: 'bg-amber-400',
  },
  request: {
    icon: Zap,
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    ctaClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dotColor: 'bg-emerald-400',
  },
  approved: {
    icon: UserCheck,
    iconBg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    ctaClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    dotColor: 'bg-blue-400',
  },
  declined: {
    icon: Bell,
    iconBg: 'bg-slate-50 border-slate-200',
    iconColor: 'text-slate-500',
    ctaClass: 'bg-slate-700 hover:bg-slate-800 text-white',
    dotColor: 'bg-slate-400',
  },
  generic: {
    icon: Bell,
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    ctaClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dotColor: 'bg-emerald-400',
  },
}

export default function ActivityToast({ toast, onClose }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 7000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  const handleCta = () => {
    if (toast?.ctaHref) {
      router.push(toast.ctaHref)
    }
    onClose()
  }

  const config = toast ? KIND_CONFIG[toast.kind] : null
  const Icon = config?.icon ?? Bell

  return (
    <AnimatePresence>
      {toast && config && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-4 z-[200] w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            {/* Live pulse bar at top */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className={`shrink-0 rounded-xl border p-2.5 ${config.iconBg}`}>
                <Icon size={18} className={config.iconColor} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-poppins-bold text-slate-800 leading-snug">{toast.title}</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-full p-1 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-0.5 text-xs font-poppins-regular text-slate-500 leading-relaxed">
                  {toast.message}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-poppins-medium text-slate-400">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotColor} animate-pulse`} />
                    {timeAgo(toast.createdAt)}
                  </span>
                  {toast.ctaLabel && (
                    <button
                      type="button"
                      onClick={handleCta}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-poppins-bold transition-colors ${config.ctaClass}`}
                    >
                      {toast.ctaLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
