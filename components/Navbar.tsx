'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, LogOut, LayoutDashboard, X, Menu } from 'lucide-react'
import { Logo } from './logo'
import { useToken } from '@/shared/hooks/useToken'
import { Client } from '@/shared/utils/ApiClient'
import { LIVE_UPDATE_EVENT, playLiveUpdateSound, type LiveUpdateEventDetail } from '@/shared/utils/liveUpdates'
import ActivityToast, { type ActivityToastData } from './ActivityToast'

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  payload?: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

function buildActivityToast(detail: LiveUpdateEventDetail): ActivityToastData {
  const notificationType = typeof detail.data?.notificationType === 'string' ? detail.data.notificationType : null
  const vacancyId = typeof detail.data?.vacancyAlertId === 'string' ? detail.data.vacancyAlertId : null
  const now = new Date()

  if (notificationType === 'VACANCY_ALERT_SHARED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      kind: 'vacancy',
      title: 'Vacancy Alert Nearby',
      message: 'A tenant near your preferred area just reported a possible vacancy. Tap to view.',
      ctaLabel: 'View Vacancy',
      ctaHref: vacancyId ? `/vacancy/${vacancyId}` : '/dashboard',
      createdAt: now,
    }
  }

  if (notificationType === 'INTEREST_REQUESTED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      kind: 'request',
      title: 'New Connection Request',
      message: 'Someone wants to connect with you. Review their listing on your dashboard.',
      ctaLabel: 'View Request',
      ctaHref: '/dashboard',
      createdAt: now,
    }
  }

  if (notificationType === 'INTEREST_APPROVED' || notificationType === 'CONTACT_APPROVED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      kind: 'approved',
      title: 'Request Approved!',
      message: 'Your connection request was approved. You can now see their contact.',
      ctaLabel: 'Go to Dashboard',
      ctaHref: '/dashboard',
      createdAt: now,
    }
  }

  if (notificationType === 'INTEREST_DECLINED') {
    return {
      id: `${detail.type}-${Date.now()}`,
      kind: 'declined',
      title: 'Request Declined',
      message: 'One of your connection requests was declined.',
      ctaLabel: 'View Dashboard',
      ctaHref: '/dashboard',
      createdAt: now,
    }
  }

  return {
    id: `${detail.type}-${Date.now()}`,
    kind: 'generic',
    title: 'New Notification',
    message: 'You have a new update on your swap activity.',
    ctaLabel: 'View Dashboard',
    ctaHref: '/dashboard',
    createdAt: now,
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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationPulseActive, setNotificationPulseActive] = useState(false)
  const [toastNotification, setToastNotification] = useState<ActivityToastData | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const notificationPanelRef = useRef<HTMLDivElement | null>(null)
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notificationSoundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setNotificationOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

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
    if (!token || unreadCount === 0) return

    setMarkingAllRead(true)

    try {
      const response = await Client.post('/notifications/read-all', {}, {
        Authorization: `Bearer ${token}`,
      })

      if (response.status === 200 || response.status === 201) {
        setNotifications((current) => current.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
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
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
        )))
        setUnreadCount((current) => Math.max(0, current - 1))
      }
    }

    setNotificationOpen(false)
    setNotificationPulseActive(false)
    setMobileMenuOpen(false)

    const vacancyId = typeof notification.payload?.vacancyAlertId === 'string' ? notification.payload.vacancyAlertId : null
    if (notification.type === 'VACANCY_ALERT_SHARED' && vacancyId) {
      router.push(`/vacancy/${vacancyId}`)
    } else {
      router.push('/dashboard')
    }
  }

  const handleLogout = async () => {
    try {
      const response = await Client.post('/auth/logout', {}, {
        Authorization: `Bearer ${token}`,
      })

      if ([200, 201, 401, 403].includes(response.status)) {
        localStorage.removeItem('JWT_TOKEN')
        router.replace('/')
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const readProfilePhoto = async () => {
    if (!token) return
    try {
      const res = await Client.get('/users/me', {}, { Authorization: `Bearer ${token}` })
      if (res.status === 200) {
        setProfilePhotoUrl(res.data?.data?.user?.profilePhotoUrl ?? null)
      }
    } catch { /* non-critical */ }
  }

  useEffect(() => {
    if (!ready) return
    if (!token) {
      setUnreadCount(0)
      setNotifications([])
      setToastNotification(null)
      setProfilePhotoUrl(null)
      return
    }
    void Promise.all([readUnreadCount(), readNotifications(), readProfilePhoto()])
  }, [ready, token])

  useEffect(() => {
    if (!token) return

    const handleLiveUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LiveUpdateEventDetail>).detail
      if (!detail || detail.type !== 'notifications.updated') return

      setToastNotification(buildActivityToast(detail))
      setNotificationPulseActive(true)
      void Promise.all([readUnreadCount(), readNotifications()])

      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
      pulseTimeoutRef.current = setTimeout(() => {
        setNotificationPulseActive(false)
        pulseTimeoutRef.current = null
      }, 2400)

      if (notificationSoundIntervalRef.current) clearInterval(notificationSoundIntervalRef.current)
      notificationSoundIntervalRef.current = setInterval(() => {
        playLiveUpdateSound('notification')
      }, 4000)
    }

    window.addEventListener(LIVE_UPDATE_EVENT, handleLiveUpdate as EventListener)
    return () => {
      window.removeEventListener(LIVE_UPDATE_EVENT, handleLiveUpdate as EventListener)
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current)
        pulseTimeoutRef.current = null
      }
      if (notificationSoundIntervalRef.current) {
        clearInterval(notificationSoundIntervalRef.current)
        notificationSoundIntervalRef.current = null
      }
    }
  }, [token])

  useEffect(() => {
    if (!notificationOpen || !token) return
    void readNotifications()
    if (notificationSoundIntervalRef.current) {
      clearInterval(notificationSoundIntervalRef.current)
      notificationSoundIntervalRef.current = null
    }
  }, [notificationOpen, token])

  useEffect(() => {
    if (!notificationOpen) return

    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null
      if (notificationPanelRef.current && target && !notificationPanelRef.current.contains(target)) {
        setNotificationOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [notificationOpen])


  // ─── Notification Panel (shared between desktop dropdown & mobile sheet) ───
  const NotificationPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? 'flex flex-col h-full' : ''}>
      {/* Header */}
                          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                            <div>
                              <p className="text-sm font-poppins-bold text-slate-800">Notifications</p>
                              <p className="mt-1 text-xs font-poppins-regular text-slate-500">
                                {unreadCount > 0
                                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
                                  : 'You are all caught up for now.'}
                              </p>
        </div>
                            <motion.button
                              type="button"
                              onClick={() => void handleMarkAllAsRead()}
                              disabled={markingAllRead || unreadCount === 0}
                              whileHover={markingAllRead || unreadCount === 0 ? undefined : { y: -1 }}
                              whileTap={markingAllRead || unreadCount === 0 ? undefined : { scale: 0.98 }}
          className="shrink-0 rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-poppins-bold text-emerald-700 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                            >
                              {markingAllRead ? 'Saving...' : 'Mark all read'}
                            </motion.button>
                          </div>

      {/* List */}
      <div className={`overflow-y-auto px-4 py-3 ${isMobile ? 'flex-1' : 'max-h-96'}`}>
                            {loadingNotifications ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center"
                              >
                                <p className="text-sm font-poppins-bold text-slate-600">Loading notifications...</p>
                              </motion.div>
                            ) : visibleNotifications.length > 0 ? (
                              <motion.div layout className="space-y-3">
                                {visibleNotifications.map((notification, index) => (
                                  <motion.button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => void handleOpenNotification(notification)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.2 }}
                                    whileHover={{ y: -2, boxShadow: '0 16px 28px rgba(15, 23, 42, 0.08)' }}
                                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-all ${notification.readAt ? 'border-slate-100 bg-slate-50' : 'border-emerald-200 bg-emerald-50/70'
                                      }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-poppins-bold text-slate-700">{notification.title}</p>
                                        <p className="mt-1 text-xs font-poppins-regular text-slate-500">{notification.message}</p>
                                      </div>
                                      {!notification.readAt && (
                                        <motion.span
                                          initial={{ scale: 0.8 }}
                                          animate={{ scale: 1 }}
                                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
                                        />
                                      )}
                                    </div>
                                    <p className="mt-2 text-[11px] font-poppins-medium text-slate-400">
                                      {formatNotificationDate(notification.createdAt)}
                                    </p>
                                  </motion.button>
                                ))}
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center"
                              >
                                <p className="text-sm font-poppins-bold text-slate-600">No notifications yet</p>
                                <p className="mt-1 text-xs font-poppins-regular text-slate-400">
                                  New alerts will appear here as they arrive.
                                </p>
                              </motion.div>
                            )}
                          </div>
    </div>
  )

  return (
    <>
      {/* ── Bottom-right activity toast ── */}
      <ActivityToast toast={toastNotification} onClose={() => setToastNotification(null)} />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-primary-green shadow-lg shadow-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo />
            </Link>

            {/* ── Desktop actions ── */}
            <div className="hidden sm:flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Notification bell */}
                  <div className="relative" ref={notificationPanelRef}>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setNotificationOpen((c) => !c)
                        setNotificationPulseActive(false)
                      }}
                      whileHover={{ y: -1, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-300 hover:bg-white/15 ${notificationPulseActive ? 'ring-2 ring-white/30 shadow-[0_0_0_10px_rgba(255,255,255,0.08)]' : ''
                        }`}
                      aria-label="Notifications"
                    >
                      <Bell size={18} className={notificationPulseActive ? 'animate-pulse' : ''} />
                      <AnimatePresence>
                        {unreadCount > 0 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-poppins-bold text-emerald-950"
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    {/* Desktop dropdown */}
                    <AnimatePresence>
                      {notificationOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute right-0 top-12 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        >
                          <NotificationPanel />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Avatar → Settings */}
                  <Link href="/settings" className="shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 bg-white/15 flex items-center justify-center cursor-pointer"
                    >
                      {profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="text-white/80" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      )}
                    </motion.div>
                  </Link>

                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/dashboard"
                      className="rounded-lg bg-white px-5 py-2 text-sm font-poppins-bold text-primary-green transition-all duration-300"
                    >
                      Dashboard
                    </Link>
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={handleLogout}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-lg bg-red-500/80 px-5 py-2 text-sm font-poppins-bold text-white transition-all duration-300 hover:bg-red-600"
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/login"
                        className={`rounded-lg bg-white px-5 py-2 text-sm font-poppins-bold text-primary-green shadow-sm transition-all duration-300 ${isHome ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
                          }`}
                    >
                      Login
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/register"
                        className={`rounded-lg bg-white px-5 py-2 text-sm font-poppins-bold text-primary-green shadow-sm transition-all duration-300 ${isHome ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
                          }`}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* ── Mobile right cluster ── */}
            <div className="flex sm:hidden items-center gap-2">
              {isLoggedIn && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(false)
                    setMobileMenuOpen((c) => !c)
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white ${notificationPulseActive ? 'ring-2 ring-white/30' : ''
                    }`}
                  aria-label="Notifications"
                >
                  <Bell size={17} className={notificationPulseActive ? 'animate-pulse' : ''} />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="absolute -right-1 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-emerald-400 px-1 py-0.5 text-[9px] font-poppins-bold text-emerald-950"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Hamburger */}
              <motion.button
                type="button"
                onClick={() => setMobileMenuOpen((c) => !c)}
                whileTap={{ scale: 0.95 }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileMenuOpen ? (
                    <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X size={18} />
                    </motion.span>
                  ) : (
                    <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu size={18} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 z-50 flex h-full w-[min(85vw,360px)] flex-col bg-white shadow-2xl sm:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-primary-green px-4 py-4">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>

              {isLoggedIn ? (
                <>
                  {/* Notification section inside drawer */}
                  <div className="flex-1 overflow-hidden">
                    <NotificationPanel isMobile />
                  </div>

                  {/* Drawer footer actions */}
                  <div className="border-t border-slate-100 p-4 space-y-2">
                    {/* User avatar row */}
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 mb-1 transition-all active:scale-[0.98]"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-200 flex items-center justify-center shrink-0">
                        {profilePhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-poppins-bold text-slate-700">Edit Profile</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary-green px-4 py-3 text-sm font-poppins-bold text-white transition-all active:scale-[0.98]"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); void handleLogout() }}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-500/90 px-4 py-3 text-sm font-poppins-bold text-white transition-all active:scale-[0.98] hover:bg-red-600"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3 p-6">
                  {isHome && (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center w-full rounded-xl border-2 border-primary-green px-4 py-3 text-sm font-poppins-bold text-primary-green transition-all active:scale-[0.98]"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center w-full rounded-xl bg-primary-green px-4 py-3 text-sm font-poppins-bold text-white transition-all active:scale-[0.98]"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar