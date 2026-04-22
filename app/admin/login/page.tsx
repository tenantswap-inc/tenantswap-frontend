"use client"

import { useEffect, useState } from "react"
import { Phone, Lock, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import GuestLayout from "@/app/GuestLayout"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Client } from "@/shared/utils/ApiClient"
import { useAdminAuth } from "@/shared/hooks/useAdminAuth"
import Toasts from "@/components/Toasts"
import posthog from "posthog-js"

const adminLoginSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Please enter a valid phone number (e.g. +234...)"),
  password: z.string().min(1, "Password is required"),
})

type FormData = z.infer<typeof adminLoginSchema>

interface ApiErrorResponse {
  message?: string | string[];
}

const AdminLogin: React.FC = () => {
  const router = useRouter()
  const { login: setAuth, isAuthenticated } = useAdminAuth()

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  const formatNigerianPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "") // strip non-digits

    if (digits.startsWith("0") && digits.length === 11) {
      return "+234" + digits.slice(1)
    }

    return value // return as-is if it doesn't match the pattern
  }
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/admin/dashboard')
      return
    }

    setAuthChecked(true)
  }, [isAuthenticated, router])

  // ── auto-dismiss error alert ───────────────────────────────────────────────
  useEffect(() => {
    if (!alertMsg) return
    const timer = setTimeout(() => setAlertMsg(""), 4000)
    return () => clearTimeout(timer)
  }, [alertMsg])

  // ── api call ───────────────────────────────────────────────────────────────
  const handleLogin = async (data: FormData) => {
    setLoading(true)

    try {
      const response = await Client.post("/auth/login", data)

      if (response.status === 200 || response.status === 201) {
        const token: string =
          response.data?.data?.accessToken ?? response.data?.accessToken

        if (!token) {
          setAlertMsg("Login failed: no token received. Please try again.")
          return
        }

        setSuccessMsg("Login successful")
        setAuth(token)

        posthog.identify(`admin_${data.phone}`)
        posthog.capture("admin_logged_in")

        router.replace("/admin/dashboard")
        return
      }

      if (response.status === 401) {
        const message = response.data?.message as string
        posthog.capture("admin_login_failed", { reason: "invalid_credentials", status: 401 })
        setAlertMsg(message || "Invalid phone or password.")
        return
      }

      posthog.capture("admin_login_failed", { reason: "unknown", status: response.status })
      setAlertMsg("Something went wrong. Please try again.")

    } catch (e: any) {
      console.error("Login error:", e)
      posthog.captureException(e)
      
      const errorData: ApiErrorResponse = e.response?.data || {}
      let errorMsg = "Unable to reach the server. Please check your connection."
      
      if (errorData.message) {
        if (Array.isArray(errorData.message)) {
          errorMsg = errorData.message[0]
        } else {
          errorMsg = errorData.message
        }
      }
      
      setAlertMsg(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // ── form submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = adminLoginSchema.safeParse({ phone, password })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      setAlertMsg("Please correct the highlighted fields.")
      return
    }

    setErrors({})
    setAlertMsg("")
    await handleLogin(result.data)
  }

  const inputClass = (field: string) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-slate-800/50 outline-none text-sm transition-all duration-200 font-poppins-regular text-white placeholder:text-slate-400 ${errors[field]
      ? "border-red-400/50 bg-red-900/20 focus:border-red-400"
      : "border-slate-700 focus:border-emerald-500 focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
    }`

  if (!authChecked) return null

  return (
    <GuestLayout>
      <Toasts
        alertMsg={alertMsg}
        successMsg={successMsg}
        onCloseAlert={() => setAlertMsg("")}
        onCloseSuccess={() => setSuccessMsg("")}
      />

      {/* Page background */}
      <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        
        {/* Glow effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-[20%] w-96 h-96 rounded-full bg-emerald-600/10 blur-[100px]" />
          <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md z-10">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800/60">

            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-8 pt-10 pb-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 blur-xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-black/20 translate-y-1/2 -translate-x-1/4 blur-lg" />
              
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                  <Lock size={24} className="text-emerald-100" />
                </div>
                <div>
                  <p className="text-emerald-200 text-xs font-poppins-black tracking-widest uppercase mb-0.5">
                    TenantSwap Admin
                  </p>
                  <h2 className="text-2xl font-poppins-bold text-white leading-tight">
                    Portal Access
                  </h2>
                </div>
              </div>
            </div>

            {/* Wave divider */}
            <div className="-mt-6 relative z-10">
              <svg viewBox="0 0 400 24" className="w-full fill-slate-900/80 backdrop-blur-xl" preserveAspectRatio="none" height="24">
                <path d="M0,24 L0,12 Q100,0 200,12 Q300,24 400,12 L400,24 Z" />
              </svg>
            </div>

            {/* Form body */}
            <div className="px-8 pb-8 mt-2">
              <p className="text-slate-400 font-poppins-medium text-sm mb-6">
                Sign in to the administrative dashboard
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }))
                      }}
                      onBlur={(e) => setPhone(formatNigerianPhone(e.target.value))}
                      placeholder="+2348000000000"
                      disabled={loading}
                      className={inputClass("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-xs font-poppins-medium">{errors.phone}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors((prev) => ({ ...prev, password: "" }))
                      }}
                      placeholder="••••••••"
                      disabled={loading}
                      className={`${inputClass("password")} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs font-poppins-medium">{errors.password}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-emerald-600 px-6 py-3.5 font-poppins-bold text-white text-sm shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-[0.98] mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <span className="relative flex items-center justify-center gap-2 tracking-wide">
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Authenticating…
                      </>
                    ) : (
                      <>
                        Authorize Access
                        <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
                
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-4 text-center">
                <p className="text-xs font-poppins-regular text-slate-500">
                  Didn&apos;t receive verification email?{" "}
                  <Link href="/admin/resend-verification" className="text-emerald-400 font-poppins-semibold hover:text-emerald-300 hover:underline transition-all">
                    Resend here
                  </Link>
                </p>
                <p className="text-slate-500 text-xs font-poppins-regular">
                  Are you a new administrator?{" "}
                  <Link href="/admin/register" className="text-emerald-400 font-poppins-semibold hover:text-emerald-300 hover:underline transition-all">
                    Request an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  )
}

export default AdminLogin
