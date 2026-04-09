'use client'

import React, { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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

      <Footer />
    </div>
  )
}

export default App
