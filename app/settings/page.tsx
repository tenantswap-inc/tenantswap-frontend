// app/settings/page.tsx
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
      User, Mail, Phone, Lock, Eye, EyeOff,
      Briefcase, Save, Loader2, ChevronLeft,
      ShieldCheck, Bell, UserCircle, Camera,
} from 'lucide-react'
import AuthLayout from '@/app/AuthLayout'
import Toasts from '@/components/Toasts'
import { Client } from '@/shared/utils/ApiClient'
import { z } from 'zod'

// ─── schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
      fullName: z.string().min(3, 'Full name must be at least 3 characters'),
      email: z.string().email('Enter a valid email').optional().or(z.literal('')),
      phone: z.string().regex(/^\+234[789][01]\d{8}$/, 'Enter a valid Nigerian phone number'),
      occupation: z.string().min(2, 'Occupation must be at least 2 characters'),
      gender: z.string().min(1, 'Please select a gender'),
      allowIncomingCalls: z.boolean(),
})

const passwordSchema = z
      .object({
            currentPassword: z.string().min(1, 'Current password is required'),
            newPassword: z
                  .string()
                  .min(8, 'Password must be at least 8 characters')
                  .regex(/[A-Z]/, 'Must include an uppercase letter')
                  .regex(/[a-z]/, 'Must include a lowercase letter')
                  .regex(/[0-9]/, 'Must include a number')
                  .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
            confirmPassword: z.string(),
      })
      .refine((d) => d.newPassword === d.confirmPassword, {
            message: 'Passwords do not match',
            path: ['confirmPassword'],
      })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type Tab = 'profile' | 'security' | 'notifications'

// ─── helpers ─────────────────────────────────────────────────────────────────

const inputBase =
      'w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-slate-50/60 outline-none text-sm transition-all duration-200 ease-in-out font-poppins-regular placeholder:text-slate-300'

function fieldClass(error?: string) {
      return `${inputBase} ${error
            ? 'border-red-400 bg-red-50/40 focus:border-red-400'
            : 'border-slate-100 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(52,211,153,0.1)] hover:border-slate-200'
            }`
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionCard({
      title,
      description,
      children,
}: {
      title: string
      description?: string
      children: React.ReactNode
}) {
      return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
                  <div className="px-6 py-5 border-b border-slate-100">
                        <h3 className="font-poppins-bold text-slate-800 text-base">{title}</h3>
                        {description && (
                              <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">{description}</p>
                        )}
                  </div>
                  <div className="px-6 py-6 space-y-5">{children}</div>
            </div>
      )
}

function FieldWrapper({
      label,
      error,
      children,
}: {
      label: string
      error?: string
      children: React.ReactNode
}) {
      return (
            <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                        {label}
                  </label>
                  {children}
                  {error && <p className="text-red-500 text-xs font-poppins-medium">{error}</p>}
            </div>
      )
}

function TabPanel({ children, tabKey, activeTab }: {
      children: React.ReactNode
      tabKey: string
      activeTab: string
}) {
      const isActive = tabKey === activeTab
      return (
            <div className={`transition-all duration-300 ease-in-out ${isActive
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-2 pointer-events-none hidden'
                  }`}>
                  {children}
            </div>
      )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
      const router = useRouter()

      // ── token — read client-side only ──────────────────────────────────────
      const [token, setToken] = useState<string | null>(null)
      const [activeTab, setActiveTab] = useState<Tab>('profile')
      const [hydrated, setHydrated] = useState(false)
      const [alertMsg, setAlertMsg] = useState('')
      const [successMsg, setSuccessMsg] = useState('')
      const [savingProfile, setSavingProfile] = useState(false)
      const [savingPassword, setSavingPassword] = useState(false)

      // ── profile photo ────────────────────────────────────────────────────────
      const [photoUrl, setPhotoUrl] = useState<string | null>(null)
      const [photoUploading, setPhotoUploading] = useState(false)
      const photoInputRef = useRef<HTMLInputElement>(null)

      // ── profile form ────────────────────────────────────────────────────────
      const [profile, setProfile] = useState<ProfileForm>({
            fullName: '',
            email: '',
            phone: '',
            occupation: '',
            gender: '',
            allowIncomingCalls: true,
      })
      const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})

      // ── password form ───────────────────────────────────────────────────────
      const [passwords, setPasswords] = useState<PasswordForm>({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
      })
      const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({})
      const [showCurrent, setShowCurrent] = useState(false)
      const [showNew, setShowNew] = useState(false)
      const [showConfirm, setShowConfirm] = useState(false)

      // ── notification prefs ──────────────────────────────────────────────────
      const [notifPrefs, setNotifPrefs] = useState({
            emailMatches: true,
            emailRequests: true,
            emailExpiry: true,
            pushMatches: false,
            pushRequests: true,
      })

      // ── read token from localStorage (client only) ──────────────────────────
      useEffect(() => {
            setToken(localStorage.getItem('JWT_TOKEN'))
      }, [])

      // ── auto dismiss toasts ─────────────────────────────────────────────────
      useEffect(() => {
            if (!alertMsg) return
            const t = setTimeout(() => setAlertMsg(''), 4000)
            return () => clearTimeout(t)
      }, [alertMsg])

      useEffect(() => {
            if (!successMsg) return
            const t = setTimeout(() => setSuccessMsg(''), 4000)
            return () => clearTimeout(t)
      }, [successMsg])

      // ── load user — waits for token state ───────────────────────────────────
      useEffect(() => {
            if (token === null) return   // still waiting for localStorage read

            const load = async () => {
                  if (!token) { router.replace('/login'); return }
                  try {
                        const res = await Client.get('/users/me', {}, { Authorization: `Bearer ${token}` })
                        if (res.status === 200) {
                              const u = res.data.data.user
                              setProfile({
                                    fullName: u.fullName ?? '',
                                    email: u.email ?? '',
                                    phone: u.phone ?? '',
                                    occupation: u.occupation ?? '',
                                    gender: u.gender?.toLowerCase() ?? '',
                                    allowIncomingCalls: u.allowIncomingCalls ?? true,
                              })
                              setPhotoUrl(u.profilePhotoUrl ?? null)
                        }
                  } finally {
                        setHydrated(true)
                  }
            }
            load()
      }, [token, router])

      // ── compress image with canvas ──────────────────────────────────────────
      const compressImage = (file: File): Promise<Blob> =>
            new Promise((resolve, reject) => {
                  const img = new Image()
                  const url = URL.createObjectURL(file)
                  img.onload = () => {
                        URL.revokeObjectURL(url)
                        const size = 800
                        const canvas = document.createElement('canvas')
                        canvas.width = size
                        canvas.height = size
                        const ctx = canvas.getContext('2d')!
                        const aspect = img.width / img.height
                        let sx = 0, sy = 0, sw = img.width, sh = img.height
                        if (aspect > 1) { sx = (img.width - img.height) / 2; sw = img.height }
                        else if (aspect < 1) { sy = (img.height - img.width) / 2; sh = img.width }
                        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size)
                        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', 0.82)
                  }
                  img.onerror = () => reject(new Error('Image load failed'))
                  img.src = url
            })

      // ── upload photo ────────────────────────────────────────────────────────
      const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                  setAlertMsg('Only JPEG, PNG, or WebP images are allowed.')
                  return
            }
            if (file.size > 10 * 1024 * 1024) {
                  setAlertMsg('Image must be smaller than 10 MB.')
                  return
            }
            setPhotoUploading(true)
            try {
                  const compressed = await compressImage(file)
                  const form = new FormData()
                  form.append('photo', compressed, 'photo.jpg')
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/profile-photo`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: form,
                  })
                  const json = await res.json() as { profilePhotoUrl?: string; message?: string }
                  if (res.ok && json.profilePhotoUrl) {
                        setPhotoUrl(json.profilePhotoUrl)
                        setSuccessMsg('Profile photo updated.')
                  } else {
                        setAlertMsg(json.message ?? 'Upload failed. Please try again.')
                  }
            } catch {
                  setAlertMsg('Network error. Please try again.')
            } finally {
                  setPhotoUploading(false)
                  if (photoInputRef.current) photoInputRef.current.value = ''
            }
      }

      // ── submit profile ──────────────────────────────────────────────────────
      const handleSaveProfile = async () => {
            const result = profileSchema.safeParse(profile)
            if (!result.success) {
                  const errs: typeof profileErrors = {}
                  result.error.issues.forEach((i) => { errs[i.path[0] as keyof ProfileForm] = i.message })
                  setProfileErrors(errs)
                  setAlertMsg('Please fix the highlighted fields.')
                  return
            }
            setProfileErrors({})
            setSavingProfile(true)
            try {
                  const res = await Client.patch('/users/me', result.data, { Authorization: `Bearer ${token}` })
                  if (res.status === 200 || res.status === 204) {
                        setSuccessMsg('Profile updated successfully.')
                        return
                  }
                  if (res.status === 401) { localStorage.removeItem('JWT_TOKEN'); router.push('/login'); return }
                  setAlertMsg(res.data?.message ?? 'Something went wrong.')
            } catch {
                  setAlertMsg('Network error. Please try again.')
            } finally {
                  setSavingProfile(false)
            }
      }

      // ── submit password ─────────────────────────────────────────────────────
      const handleSavePassword = async () => {
            const result = passwordSchema.safeParse(passwords)
            if (!result.success) {
                  const errs: typeof passwordErrors = {}
                  result.error.issues.forEach((i) => { errs[i.path[0] as keyof PasswordForm] = i.message })
                  setPasswordErrors(errs)
                  setAlertMsg('Please fix the highlighted fields.')
                  return
            }
            setPasswordErrors({})
            setSavingPassword(true)
            try {
                  const res = await Client.patch(
                        '/auth/change-password',
                        { currentPassword: result.data.currentPassword, newPassword: result.data.newPassword },
                        { Authorization: `Bearer ${token}` }
                  )
                  if (res.status === 200 || res.status === 204) {
                        setSuccessMsg('Password changed successfully.')
                        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
                        return
                  }
                  if (res.status === 401) { setAlertMsg('Current password is incorrect.'); return }
                  setAlertMsg(res.data?.message ?? 'Something went wrong.')
            } catch {
                  setAlertMsg('Network error. Please try again.')
            } finally {
                  setSavingPassword(false)
            }
      }

      // ─── tabs (defined before early return) ───────────────────────────────────
      const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
            { key: 'profile', label: 'Profile', icon: <UserCircle size={16} /> },
            { key: 'security', label: 'Security', icon: <ShieldCheck size={16} /> },
            { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
      ]

      if (!hydrated) return null

      return (
            <AuthLayout>
                  <Toasts
                        alertMsg={alertMsg}
                        successMsg={successMsg}
                        onCloseAlert={() => setAlertMsg('')}
                        onCloseSuccess={() => setSuccessMsg('')}
                  />

                  <div className="max-w-2xl mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* Page header */}
                        <div className="flex items-center gap-3 mb-8">
                              <button
                                    onClick={() => router.back()}
                                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                              >
                                    <ChevronLeft size={18} className="text-slate-500" />
                              </button>
                              <div>
                                    <h1 className="text-2xl font-poppins-bold text-slate-900">Settings</h1>
                                    <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">
                                          Manage your account preferences
                                    </p>
                              </div>
                        </div>

                        {/* Tab bar */}
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-8">
                              {tabs.map((tab) => (
                                    <button
                                          key={tab.key}
                                          onClick={() => setActiveTab(tab.key)}
                                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-poppins-bold
                          transition-all duration-200 ease-in-out ${activeTab === tab.key
                                                      ? 'bg-white text-emerald-600 shadow-sm scale-[1.02]'
                                                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                                }`}
                                    >
                                          <span className={`transition-transform duration-200 ${activeTab === tab.key ? 'scale-110' : 'scale-100'}`}>
                                                {tab.icon}
                                          </span>
                                          {tab.label}
                                    </button>
                              ))}
                        </div>

                        {/* Tab panels */}
                        <div className="relative">

                              {/* ── Profile tab ─────────────────────────────────────────────── */}
                              <TabPanel tabKey="profile" activeTab={activeTab}>
                                    <div className="space-y-6">

                                          {/* ── Avatar upload ──────────────────────────────────────── */}
                                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-6">
                                                <h3 className="font-poppins-bold text-slate-800 text-base mb-1">Profile Photo</h3>
                                                <p className="text-xs text-slate-400 font-poppins-regular mb-5">
                                                      Helps other tenants recognise and trust you
                                                </p>
                                                <div className="flex items-center gap-5">
                                                      {/* Avatar circle */}
                                                      <div className="relative shrink-0">
                                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                                                                  {photoUrl ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                                                  ) : (
                                                                        <UserCircle size={44} className="text-slate-300" />
                                                                  )}
                                                            </div>
                                                            {photoUploading && (
                                                                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                                                        <Loader2 size={20} className="text-white animate-spin" />
                                                                  </div>
                                                            )}
                                                      </div>

                                                      {/* Upload button */}
                                                      <div>
                                                            <input
                                                                  ref={photoInputRef}
                                                                  type="file"
                                                                  accept="image/jpeg,image/png,image/webp"
                                                                  className="hidden"
                                                                  onChange={handlePhotoChange}
                                                            />
                                                            <button
                                                                  type="button"
                                                                  disabled={photoUploading}
                                                                  onClick={() => photoInputRef.current?.click()}
                                                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-poppins-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                  <Camera size={15} />
                                                                  {photoUploading ? 'Uploading…' : photoUrl ? 'Change Photo' : 'Upload Photo'}
                                                            </button>
                                                            <p className="mt-1.5 text-[11px] font-poppins-regular text-slate-400">
                                                                  JPEG, PNG or WebP · Max 10 MB
                                                            </p>
                                                      </div>
                                                </div>
                                          </div>

                                          <SectionCard title="Personal Information" description="Update your basic profile details">

                                                <FieldWrapper label="Full Name" error={profileErrors.fullName}>
                                                      <div className="relative">
                                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                            <input
                                                                  value={profile.fullName}
                                                                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                                                                  placeholder="Adekunle Ciroma"
                                                                  className={fieldClass(profileErrors.fullName)}
                                                            />
                                                      </div>
                                                </FieldWrapper>

                                                <FieldWrapper label="Email Address" error={profileErrors.email}>
                                                      <div className="relative">
                                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                            <input
                                                                  type="email"
                                                                  value={profile.email}
                                                                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                                                                  placeholder="example@gmail.com"
                                                                  className={fieldClass(profileErrors.email)}
                                                            />
                                                      </div>
                                                </FieldWrapper>

                                                <FieldWrapper label="Phone Number" error={profileErrors.phone}>
                                                      <div className="relative">
                                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                            <input
                                                                  value={profile.phone}
                                                                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                                                                  placeholder="+2348012345678"
                                                                  className={fieldClass(profileErrors.phone)}
                                                            />
                                                      </div>
                                                </FieldWrapper>

                                                <div className="grid grid-cols-2 gap-4">
                                                      <FieldWrapper label="Gender" error={profileErrors.gender}>
                                                            <div className="relative">
                                                                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                                  <select
                                                                        value={profile.gender}
                                                                        onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                                                                        className={`${fieldClass(profileErrors.gender)} appearance-none cursor-pointer ${!profile.gender ? 'text-slate-300' : 'text-slate-700'
                                                                              }`}
                                                                  >
                                                                        <option value="" disabled>Select</option>
                                                                        <option value="male">Male</option>
                                                                        <option value="female">Female</option>
                                                                  </select>
                                                                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                        <path d="M6 9l6 6 6-6" />
                                                                  </svg>
                                                            </div>
                                                      </FieldWrapper>

                                                      <FieldWrapper label="Occupation" error={profileErrors.occupation}>
                                                            <div className="relative">
                                                                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                                  <input
                                                                        value={profile.occupation}
                                                                        onChange={(e) => setProfile((p) => ({ ...p, occupation: e.target.value }))}
                                                                        placeholder="e.g. Engineer"
                                                                        className={fieldClass(profileErrors.occupation)}
                                                                  />
                                                            </div>
                                                      </FieldWrapper>
                                                </div>

                                          </SectionCard>

                                          <SectionCard title="Preferences" description="Control how others can interact with you">
                                                <div className="flex items-center justify-between py-1">
                                                      <div>
                                                            <p className="text-sm font-poppins-bold text-slate-700">Allow Incoming Calls</p>
                                                            <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">
                                                                  Let matched tenants call you directly
                                                            </p>
                                                      </div>
                                                      <button
                                                            type="button"
                                                            onClick={() => setProfile((p) => ({ ...p, allowIncomingCalls: !p.allowIncomingCalls }))}
                                                            className={`relative inline-flex items-center w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${profile.allowIncomingCalls ? 'bg-emerald-500' : 'bg-slate-200'
                                                                  }`}
                                                      >
                                                            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${profile.allowIncomingCalls ? 'translate-x-6' : 'translate-x-1'
                                                                  }`} />
                                                      </button>
                                                </div>
                                          </SectionCard>

                                          <button
                                                onClick={handleSaveProfile}
                                                disabled={savingProfile}
                                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                           text-white font-poppins-bold py-3.5 rounded-2xl
                           transition-all duration-200 ease-in-out
                           hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5
                           active:scale-[0.99] active:translate-y-0
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                          >
                                                {savingProfile ? (
                                                      <><Loader2 size={18} className="animate-spin" /> Saving…</>
                                                ) : (
                                                      <><Save size={18} /> Save Profile</>
                                                )}
                                          </button>
                                    </div>
                              </TabPanel>

                              {/* ── Security tab ────────────────────────────────────────────── */}
                              <TabPanel tabKey="security" activeTab={activeTab}>
                                    <div className="space-y-6">
                                          <SectionCard title="Change Password" description="Use a strong password you don't use elsewhere">

                                                {[
                                                      { field: 'currentPassword' as const, label: 'Current Password', show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
                                                      { field: 'newPassword' as const, label: 'New Password', show: showNew, toggle: () => setShowNew((v) => !v) },
                                                      { field: 'confirmPassword' as const, label: 'Confirm Password', show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
                                                ].map(({ field, label, show, toggle }) => (
                                                      <FieldWrapper key={field} label={label} error={passwordErrors[field]}>
                                                            <div className="relative">
                                                                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                                  <input
                                                                        type={show ? 'text' : 'password'}
                                                                        value={passwords[field]}
                                                                        placeholder="••••••••"
                                                                        onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
                                                                        className={`${fieldClass(passwordErrors[field])} pr-12`}
                                                                  />
                                                                  <button
                                                                        type="button"
                                                                        onClick={toggle}
                                                                        className="absolute right-0 top-0 h-full px-3 flex items-center bg-white rounded-r-xl border-2 border-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
                                                                  >
                                                                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                                                                  </button>
                                                            </div>
                                                      </FieldWrapper>
                                                ))}

                                                {/* Password rules */}
                                                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                                                      <p className="text-xs font-poppins-bold text-slate-500 mb-2">Password requirements</p>
                                                      {[
                                                            { rule: 'At least 8 characters', met: passwords.newPassword.length >= 8 },
                                                            { rule: 'One uppercase letter', met: /[A-Z]/.test(passwords.newPassword) },
                                                            { rule: 'One lowercase letter', met: /[a-z]/.test(passwords.newPassword) },
                                                            { rule: 'One number', met: /[0-9]/.test(passwords.newPassword) },
                                                            { rule: 'One special character', met: /[^A-Za-z0-9]/.test(passwords.newPassword) },
                                                      ].map(({ rule, met }) => (
                                                            <div key={rule} className="flex items-center gap-2">
                                                                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors duration-200 ${met ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                                                        {met && (
                                                                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                                                    <path d="M20 6L9 17l-5-5" />
                                                                              </svg>
                                                                        )}
                                                                  </div>
                                                                  <span className={`text-xs font-poppins-medium transition-colors duration-200 ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                        {rule}
                                                                  </span>
                                                            </div>
                                                      ))}
                                                </div>

                                          </SectionCard>

                                          <button
                                                onClick={handleSavePassword}
                                                disabled={savingPassword}
                                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                           text-white font-poppins-bold py-3.5 rounded-2xl
                           transition-all duration-200 ease-in-out
                           hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5
                           active:scale-[0.99] active:translate-y-0
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                          >
                                                {savingPassword ? (
                                                      <><Loader2 size={18} className="animate-spin" /> Updating…</>
                                                ) : (
                                                      <><ShieldCheck size={18} /> Update Password</>
                                                )}
                                          </button>
                                    </div>
                              </TabPanel>

                              {/* ── Notifications tab ───────────────────────────────────────── */}
                              <TabPanel tabKey="notifications" activeTab={activeTab}>
                                    <div className="space-y-6">

                                          <SectionCard title="Email Notifications" description="Choose what we send to your inbox">
                                                {[
                                                      { key: 'emailMatches', label: 'New Matches', desc: 'When the algorithm finds a new swap match' },
                                                      { key: 'emailRequests', label: 'Connection Requests', desc: 'When someone wants to connect with you' },
                                                      { key: 'emailExpiry', label: 'Listing Expiry Alerts', desc: '3 days before your listing expires' },
                                                ].map(({ key, label, desc }) => {
                                                      const isOn = notifPrefs[key as keyof typeof notifPrefs]
                                                      return (
                                                            <div key={key} className="flex items-center justify-between py-1">
                                                                  <div>
                                                                        <p className="text-sm font-poppins-bold text-slate-700">{label}</p>
                                                                        <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">{desc}</p>
                                                                  </div>
                                                                  <button
                                                                        type="button"
                                                                        onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                                                                        className={`relative inline-flex items-center w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${isOn ? 'bg-emerald-500' : 'bg-slate-200'
                                                                              }`}
                                                                  >
                                                                        <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${isOn ? 'translate-x-6' : 'translate-x-1'
                                                                              }`} />
                                                                  </button>
                                                            </div>
                                                      )
                                                })}
                                          </SectionCard>

                                          <SectionCard title="Push Notifications" description="In-app and browser push notifications">
                                                {[
                                                      { key: 'pushMatches', label: 'New Matches', desc: 'Real-time alerts for new swap matches' },
                                                      { key: 'pushRequests', label: 'Connection Requests', desc: 'Instant alerts when someone connects' },
                                                ].map(({ key, label, desc }) => {
                                                      const isOn = notifPrefs[key as keyof typeof notifPrefs]
                                                      return (
                                                            <div key={key} className="flex items-center justify-between py-1">
                                                                  <div>
                                                                        <p className="text-sm font-poppins-bold text-slate-700">{label}</p>
                                                                        <p className="text-xs text-slate-400 font-poppins-regular mt-0.5">{desc}</p>
                                                                  </div>
                                                                  <button
                                                                        type="button"
                                                                        onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                                                                        className={`relative inline-flex items-center w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${isOn ? 'bg-emerald-500' : 'bg-slate-200'
                                                                              }`}
                                                                  >
                                                                        <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${isOn ? 'translate-x-6' : 'translate-x-1'
                                                                              }`} />
                                                                  </button>
                                                            </div>
                                                      )
                                                })}
                                          </SectionCard>

                                          <button
                                                onClick={() => setSuccessMsg('Notification preferences saved.')}
                                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                           text-white font-poppins-bold py-3.5 rounded-2xl
                           transition-all duration-200 ease-in-out
                           hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5
                           active:scale-[0.99] active:translate-y-0"
                                          >
                                                <Save size={18} /> Save Preferences
                                          </button>

                                    </div>
                              </TabPanel>

                        </div>
                  </div>
            </AuthLayout>
      )
}