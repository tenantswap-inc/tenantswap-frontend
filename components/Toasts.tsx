// components/Toasts.tsx
'use client'
import React from 'react'
import { Alert } from '@heroui/alert'
import { X, Check } from 'lucide-react'

interface ToastsProps {
  alertMsg?: string
  successMsg?: string
  onCloseAlert?: () => void
  onCloseSuccess?: () => void
}

const Toasts: React.FC<ToastsProps> = ({
  alertMsg = '',
  successMsg = '',
  onCloseAlert,
  onCloseSuccess,
}: ToastsProps) =>  {
  return (
    <>
      {alertMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm">
          <Alert
            color="danger"
            variant="solid"
                        isVisible={true}

            onClose={onCloseAlert}
            classNames={{
              base: 'shadow-2xl rounded-2xl border border-red-400/20 bg-red-500 animate-in fade-in slide-in-from-top-2 duration-300',
            }}
          >
            <div className="flex items-center gap-3">
              <X size={16} className="rounded-sm text-red-500 bg-white shrink-0" />
              <span className="text-white font-poppins-bold text-sm">{alertMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm">
          <Alert
            color="success"
            variant="solid"
            isVisible={true}
            onClose={onCloseSuccess}
            classNames={{
              base: 'shadow-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500 animate-in fade-in slide-in-from-top-2 duration-300',
            }}
          >
            <div className="flex items-center gap-3">
              <Check size={16} className="rounded-sm text-emerald-500 bg-white shrink-0" />
              <span className="text-white font-poppins-bold text-sm">{successMsg}</span>
            </div>
          </Alert>
        </div>
      )}
    </>
  )
}

export default Toasts