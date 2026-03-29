'use client'

import React, { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useToken } from '@/shared/hooks/useToken'
import { connectLiveUpdates } from '@/shared/utils/liveUpdates'
import { registerPushNotifications } from '@/shared/utils/pushNotifications'

interface Props {
  children: React.ReactNode
}

const App: React.FC<Props> = ({ children }) => {
  const { token, ready } = useToken()

  useEffect(() => {
    if (!ready || !token) {
      return
    }

    void registerPushNotifications(token)

    return connectLiveUpdates(token, {
      refreshUser: async () => undefined,
      refreshInterests: async () => undefined,
      refreshUnreadCount: async () => undefined,
    })
  }, [ready, token])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow">{children}</main>

      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-poppins-bold">
            © 2026 TenantSwap Nigeria. Built for Tenants, by Tenants. Zero Agent
            Fees.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
