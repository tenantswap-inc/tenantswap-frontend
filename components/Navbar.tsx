'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Alert } from '@heroui/alert'
import { Logo } from './logo'
import { useToken } from '@/shared/hooks/useToken'
import { Client } from '@/shared/utils/ApiClient'
import { LIVE_UPDATE_EVENT, type LiveUpdateEventDetail } from '@/shared/utils/liveUpdates'

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  payload?: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

type NotificationToast = {
  id: string
  title: string
  message: string
}

function buildNotificationToast(detail: LiveUpdateEventDetail): NotificationToast {
  const notificationType = typeof detail.data?.notificationType === 'string' ? detail.data.notificationType : null

  if (notificationType === 'VACANCY_ALERT_SHARED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      title: 'Vacancy alert',
      message: 'A possible vacancy near your preferred area was just shared.',
    }
  }

  if (notificationType === 'INTEREST_REQUESTED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      title: 'Connection request',
      message: 'You just received a new connection request.',
    }
  }

  if (notificationType === 'INTEREST_APPROVED' || notificationType === 'CONTACT_APPROVED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      title: 'Request approved',
      message: 'One of your connection requests has been approved.',
    }
  }

  if (notificationType === 'INTEREST_DECLINED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      title: 'Request declined',
      message: 'One of your connection requests was declined.',
    }
  }

  return {
    id: `${detail.type}-${Date.now()}`,
    title: 'New notification',
    message: 'You have a new update on your swap activity.',
  }
}

function formatNotificationDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const Navbar: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/'
  const { token, ready } = useToken()

  const isLoggedIn = token !== null
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationPulseActive, setNotificationPulseActive] = useState(false)
  const [toastNotification, setToastNotification] = useState<NotificationToast | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const notificationPanelRef = useRef<HTMLDivElement | null>(null)
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications])

  const readUnreadCount = async () => {
    if (!token) {
      setUnreadCount(0)
      return
    }

    try {
      const response = await Client.get('/notifications/unread-count', {}, {
        Authorization: `Bearer ${token}`,
      })

      if (response.status === 200) {
        setUnreadCount(Number(response.data?.unreadCount ?? response.data?.data?.unreadCount ?? 0))
        return
      }

      if (response.status === 401 || response.status === 403) {
        setUnreadCount(0)
      }
    } catch {
      setUnreadCount(0)
    }
  }

  const readNotifications = async () => {
    if (!token) {
      setNotifications([])
      return
    }

    setLoadingNotifications(true)

    try {
      const response = await Client.get('/notifications', { limit: 20 }, {
        Authorization: `Bearer ${token}`,
      })

      if (response.status === 200) {
        setNotifications(response.data?.notifications ?? response.data?.data?.notifications ?? [])
        return
      }

      if (response.status === 401 || response.status === 403) {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) {
      return
    }

    setMarkingAllRead(true)

    try {
      const response = await Client.post('/notifications/read-all', {}, {
        Authorization: `Bearer ${token}`,
      })

      if (response.status === 200 || response.status === 201) {
        setNotifications((current) => current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        })))
        setUnreadCount(0)
      }
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (token && !notification.readAt) {
      const response = await Client.post(`/notifications/${notification.id}/read`, {}, {
        Authorization: `Bearer ${token}`,
      })

      if (response.status === 200 || response.status === 201) {
        setNotifications((current) => current.map((item) => (
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item
        )))
        setUnreadCount((current) => Math.max(0, current - 1))
      }
    }

    setNotificationOpen(false)
    setNotificationPulseActive(false)

    if (notification.type.startsWith('INTEREST_') || notification.type === 'RENTER_CONFIRMED') {
      router.push('/dashboard')
      return
    }

    if (notification.type === 'VACANCY_ALERT_SHARED') {
      router.push('/dashboard')
      return
    }

    router.push('/dashboard')
  }

  const handleLogout = async () => {
    try {
      const response = await Client.post('/auth/logout', {}, {
        Authorization: `Bearer ${token}`,
      })

      if (response.status === 200 || response.status === 201 || response.status === 401 || response.status === 403) {
        localStorage.removeItem('JWT_TOKEN')
        router.replace('/')
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  useEffect(() => {
    if (!ready) {
      return
    }

    if (!token) {
      setUnreadCount(0)
      setNotifications([])
      setToastNotification(null)
      return
    }

    void Promise.all([readUnreadCount(), readNotifications()])
  }, [ready, token])

  useEffect(() => {
    if (!token) {
      return
    }

    const handleLiveUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LiveUpdateEventDetail>).detail

      if (!detail || detail.type !== 'notifications.updated') {
        return
      }

      setToastNotification(buildNotificationToast(detail))
      setNotificationPulseActive(true)
      void Promise.all([readUnreadCount(), readNotifications()])

      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current)
      }

      pulseTimeoutRef.current = setTimeout(() => {
        setNotificationPulseActive(false)
        pulseTimeoutRef.current = null
      }, 2400)
    }

    window.addEventListener(LIVE_UPDATE_EVENT, handleLiveUpdate as EventListener)

    return () => {
      window.removeEventListener(LIVE_UPDATE_EVENT, handleLiveUpdate as EventListener)
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current)
        pulseTimeoutRef.current = null
      }
    }
  }, [token])

  useEffect(() => {
    if (!notificationOpen || !token) {
      return
    }

    void readNotifications()
  }, [notificationOpen, token])

  useEffect(() => {
    if (!notificationOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null

      if (notificationPanelRef.current && target && !notificationPanelRef.current.contains(target)) {
        setNotificationOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [notificationOpen])

  useEffect(() => {
    if (!toastNotification) {
      return
    }

    const timeout = setTimeout(() => setToastNotification(null), 4000)
    return () => clearTimeout(timeout)
  }, [toastNotification])

  return (
    <>
      {toastNotification && (
        <div className="fixed right-4 top-20 z-[100] w-full max-w-sm">
          <Alert
            color="success"
            variant="solid"
            isVisible
            onClose={() => setToastNotification(null)}
            classNames={{
              base: 'shadow-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500 animate-in fade-in slide-in-from-top-2 duration-300',
            }}
          >
            <div className="space-y-1">
              <p className="text-sm font-poppins-bold text-white">{toastNotification.title}</p>
              <p className="text-xs font-poppins-medium text-white/90">{toastNotification.message}</p>
            </div>
          </Alert>
        </div>
      )}

      <nav className="bg-primary-green shadow-lg shadow-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <div className="relative" ref={notificationPanelRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationOpen((current) => !current)
                        setNotificationPulseActive(false)
                      }}
                      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 ${notificationPulseActive ? 'shadow-[0_0_0_10px_rgba(255,255,255,0.08)] ring-2 ring-white/30' : ''}`}
                      aria-label="Notifications"
                    >
                      <Bell size={18} className={notificationPulseActive ? 'animate-pulse' : ''} />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-poppins-bold text-emerald-950">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationOpen && (
                      <div className="absolute right-0 top-12 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                          <div>
                            <p className="text-sm font-poppins-bold text-slate-800">Notifications</p>
                            <p className="mt-1 text-xs font-poppins-regular text-slate-500">
                              {unreadCount > 0
                                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
                                : 'You are all caught up for now.'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleMarkAllAsRead()}
                            disabled={markingAllRead || unreadCount === 0}
                            className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-poppins-bold text-emerald-700 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                          >
                            {markingAllRead ? 'Saving...' : 'Mark all read'}
                          </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto px-4 py-3">
                          {loadingNotifications ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                              <p className="text-sm font-poppins-bold text-slate-600">Loading notifications...</p>
                            </div>
                          ) : visibleNotifications.length > 0 ? (
                            <div className="space-y-3">
                              {visibleNotifications.map((notification) => (
                                <button
                                  key={notification.id}
                                  type="button"
                                  onClick={() => void handleOpenNotification(notification)}
                                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${notification.readAt ? 'border-slate-100 bg-slate-50' : 'border-emerald-200 bg-emerald-50/70'}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-poppins-bold text-slate-700">{notification.title}</p>
                                      <p className="mt-1 text-xs font-poppins-regular text-slate-500">{notification.message}</p>
                                    </div>
                                    {!notification.readAt && (
                                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                                    )}
                                  </div>
                                  <p className="mt-2 text-[11px] font-poppins-medium text-slate-400">
                                    {formatNotificationDate(notification.createdAt)}
                                  </p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                              <p className="text-sm font-poppins-bold text-slate-600">No notifications yet</p>
                              <p className="mt-1 text-xs font-poppins-regular text-slate-400">
                                New alerts will appear here as they arrive.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/dashboard"
                    className="bg-white text-primary-green px-5 py-2 rounded-lg font-poppins-bold transition-all duration-300 hover:-translate-y-0.5 text-sm"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-red-500/80 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-poppins-bold transition-all duration-300 hover:-translate-y-0.5 text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`bg-white font-poppins-bold text-primary-green px-5 py-2 rounded-lg text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${isHome ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className={`bg-white font-poppins-bold text-primary-green px-5 py-2 rounded-lg text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${isHome ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar
