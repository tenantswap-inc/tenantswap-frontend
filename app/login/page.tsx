"use client"

import { useEffect, useState, useRef } from "react"
import { Phone, Lock, ArrowRight, X, Eye, EyeOff, Loader2, MailWarning } from "lucide-react"
import Link from "next/link"
import GuestLayout from "@/app/GuestLayout"
import { useRouter } from "next/navigation"
import { Alert } from "@heroui/alert"
import { z } from "zod"
import { Client } from "@/shared/utils/ApiClient"
import GoogleSignInButton from "@/components/GoogleSignInButton"

const loginSchema = z.object({
  phone: z
    .string()
    .regex(
      /^\+234[789][01]\d{8}$/,
      "Phone must start with +234 followed by 10 digits (e.g. +2348012345678)"
    ),
  password: z.string().min(1, "Password is required"),
})

type FormData = z.infer<typeof loginSchema>

const REVERIFY_COUNTDOWN = 5

const Login: React.FC = () => {
  const router = useRouter()

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [alertMsg, setAlertMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // ── reverification banner ──────────────────────────────────────────────────
  const [showReverify, setShowReverify] = useState(false)
  const [reverifyMsg, setReverifyMsg] = useState("")
  const [reverifyCountdown, setReverifyCountdown] = useState(REVERIFY_COUNTDOWN)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start countdown when reverify banner appears
  useEffect(() => {
    if (!showReverify) return

    setReverifyCountdown(REVERIFY_COUNTDOWN)

    countdownRef.current = setInterval(() => {
      setReverifyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          router.push("/resend-verification")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [showReverify])

  const cancelReverify = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowReverify(false)
    setReverifyMsg("")
  }

  const goNow = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    router.push("/resend-verification")
  }

  // ── auto-dismiss error alert ───────────────────────────────────────────────
  useEffect(() => {
    if (!alertMsg) return
    const timer = setTimeout(() => setAlertMsg(""), 4000)
    return () => clearTimeout(timer)
  }, [alertMsg])

  // ── api call ───────────────────────────────────────────────────────────────
  const handleLogin = async (user: FormData) => {
    setLoading(true)

    try {
      const response = await Client.post("/auth/login", user)

      if (response.status === 200 || response.status === 201) {
        const token: string =
          response.data?.data?.accessToken ?? response.data?.accessToken

        if (!token) {
          setAlertMsg("Login failed: no token received. Please try again.")
          return
        }

        localStorage.setItem("JWT_TOKEN", token)
        router.push("/dashboard")
        return
      }

      if (response.status === 401) {
        // Show reverification banner with countdown instead of instant redirect

        const message = response.data?.message as string

        const error = message.toLowerCase()

        if (error === "invalid credentials") {
          setAlertMsg(message)
             return;
        }


        setReverifyMsg(
          response.data?.message ?? "Your email is not verified."
        )
        setShowReverify(true)
        return
      }

      if (response.status === 403) {
        setAlertMsg("Your account has been suspended. Please contact support.")
        return
      }

      if (response.status === 404) {
        setAlertMsg("No account found with that phone number.")
        return
      }

      if (response.status === 422) {
        setAlertMsg("Please check your details and try again.")
        return
      }

      if (response.status === 429) {
        setAlertMsg("Too many login attempts. Please wait a few minutes.")
        return
      }

      setAlertMsg("Something went wrong. Please try again.")

    } catch (e) {
      console.error("Login error:", e)
      setAlertMsg("Unable to reach the server. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  // ── form submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = loginSchema.safeParse({ phone, password })

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

  const formatNigerianPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "")
    if (digits.startsWith("0") && digits.length === 11) {
      return "+234" + digits.slice(1)
    }
    return value
  }

  const inputClass = (field: string) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-slate-50/60 outline-none text-sm transition-all duration-200 font-poppins-regular placeholder:text-slate-300 ${errors[field]
      ? "border-red-400 bg-red-50/40 focus:border-red-400"
      : "border-slate-100 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]"
    }`

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <GuestLayout>

      {/* ── Error toast ──────────────────────────────────────────────────── */}
      {alertMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm">
          <Alert
            color="danger"
            variant="solid"
            isVisible
            onClose={() => setAlertMsg("")}
            classNames={{
              base: "shadow-2xl rounded-2xl border border-red-400/20 bg-red-500 animate-in fade-in slide-in-from-top-2 duration-300",
            }}
          >
            <div className="flex items-center gap-3">
              <X size={16} className="rounded-sm text-red-500 bg-white shrink-0" />
              <span className="text-white font-poppins-bold text-sm">{alertMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      {/* ── Reverification countdown banner ──────────────────────────────── */}
      {showReverify && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-amber-500 rounded-2xl shadow-2xl border border-amber-400/30 overflow-hidden">

            {/* Progress bar */}
            <div className="h-1 bg-amber-300/40 w-full">
              <div
                className="h-1 bg-white/70 transition-all duration-1000 ease-linear"
                style={{ width: `${(reverifyCountdown / REVERIFY_COUNTDOWN) * 100}%` }}
              />
            </div>

            <div className="p-4">
              <div className="flex items-start gap-3">
                <MailWarning size={18} className="text-white shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-poppins-bold text-sm leading-snug">
                    {reverifyMsg}
                  </p>
                  <p className="text-amber-100 text-xs font-poppins-regular mt-1">
                    Redirecting to verification in{" "}
                    <span className="font-poppins-bold text-white">{reverifyCountdown}s</span>
                  </p>
                </div>
                <button
                  onClick={cancelReverify}
                  className="text-white/70 hover:text-white transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={goNow}
                  className="flex-1 bg-white text-amber-600 text-xs font-poppins-bold py-2 rounded-xl hover:bg-amber-50 transition-colors"
                >
                  Verify Now
                </button>
                <button
                  onClick={cancelReverify}
                  className="flex-1 bg-amber-400/40 text-white text-xs font-poppins-bold py-2 rounded-xl hover:bg-amber-400/60 transition-colors"
                >
                  Stay Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex items-center justify-center py-12 px-4">

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.10)] overflow-hidden border border-slate-100/80">

            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-8 pt-10 pb-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4" />
              <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/40" />
              <div className="absolute top-10 right-10 w-1 h-1 rounded-full bg-white/30" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Lock size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-emerald-200 text-xs font-poppins-black tracking-widest uppercase mb-0.5">
                    TenantSwap
                  </p>
                  <h2 className="text-2xl font-poppins-bold text-white leading-tight">
                    Welcome Back
                  </h2>
                </div>
              </div>
            </div>

            {/* Wave divider */}
            <div className="-mt-6 relative z-10">
              <svg viewBox="0 0 400 24" className="w-full fill-white" preserveAspectRatio="none" height="24">
                <path d="M0,24 L0,12 Q100,0 200,12 Q300,24 400,12 L400,24 Z" />
              </svg>
            </div>

            {/* Form body */}
            <div className="px-8 pb-8 mt-2">
              <p className="text-slate-400 font-poppins-medium text-sm mb-6">
                Sign in to manage your house swap
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }))
                      }}
                      onBlur={(e) => setPhone(formatNigerianPhone(e.target.value))}
                      placeholder="+2348012345678"
                      disabled={loading}
                      className={inputClass("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs font-poppins-medium">{errors.phone}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-emerald-600 font-poppins-medium hover:text-emerald-700 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs font-poppins-medium">{errors.password}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-3.5 font-poppins-bold text-white text-sm shadow-[0_4px_16px_rgba(5,150,105,0.4)] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(5,150,105,0.5)] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-none mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <span className="relative flex items-center justify-center gap-2 tracking-wide">
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs font-poppins-medium text-slate-300 px-1">or continue with</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

              </form>

              <GoogleSignInButton login={true} />

              <p className="text-center mt-5 text-xs font-poppins-regular text-slate-400">
                New to TenantSwap?{" "}
                <Link href="/register" className="text-emerald-600 font-poppins-bold hover:text-emerald-700 transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  )
}

export default Login