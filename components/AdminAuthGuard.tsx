'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/shared/hooks/useAdminAuth'
import { Loader2 } from 'lucide-react'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glow effects matches the login page style */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-[20%] w-96 h-96 rounded-full bg-emerald-600/10 blur-[100px]" />
          <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[120px]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
          <p className="text-slate-400 font-poppins-medium text-sm animate-pulse">
            Verifying Access...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return children as React.ReactElement
}
