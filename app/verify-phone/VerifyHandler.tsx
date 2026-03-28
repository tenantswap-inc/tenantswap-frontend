"use client"

import React, { useEffect, useState } from "react"
import GuestLayout from "@/app/GuestLayout"
import { ShieldCheck, Loader2, XCircle, CheckCircle2 } from "lucide-react"
import { Client } from "@/shared/utils/ApiClient"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

type VerifyState = "loading" | "success" | "error" | "missing"

const PhoneVerifyRedirect: React.FC = () => {
  const [state, setState] = useState<VerifyState>("loading")
  const [message, setMessage] = useState("")
  const [countdown, setCountdown] = useState(5)

  const params = useSearchParams()
  const router = useRouter()

  // ── verify on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const existingToken = localStorage.getItem("JWT_TOKEN")
    if (existingToken) {
      router.replace("/dashboard")
      return
    }

    const token = params.get("token")

    if (!token) {
      setState("missing")
      setMessage("No verification token found in the link.")
      return
    }

    verifyToken(token)
  }, [params, router])

  // ── auto-redirect countdown when successful ────────────────────────────────
  useEffect(() => {
    if (state !== "success") return

    if (countdown === 0) {
      router.push("/dashboard")
      return
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [state, countdown])

  // ── api call ───────────────────────────────────────────────────────────────
  const verifyToken = async (token: string) => {
    try {
      const response = await Client.post("/auth/verify-email", { token })

      if (response.status === 200 || response.status === 201) {

        localStorage.setItem("JWT_TOKEN", response.data.data.accessToken)
        setState("success")
        setMessage("Your email has been verified successfully.")
        return
      }

      if (response.status === 410) {
        setState("error")
        setMessage("This verification link has expired. Please request a new one.")
        return
      }

      if (response.status === 400) {
        setState("error")
        setMessage("This link is invalid or has already been used.")
        return
      }

      setState("error")
      setMessage("Something went wrong. Please try again.")
    } catch {
      setState("error")
      setMessage("Unable to reach the server. Please check your connection.")
    }
  }

  // ── ui map ─────────────────────────────────────────────────────────────────
  const UI: Record<VerifyState, {
    icon: React.ReactNode
    iconBg: string
    title: string
    color: string
  }> = {
    loading: {
      icon: <Loader2 size={36} className="animate-spin" />,
      iconBg: "bg-slate-100 text-slate-500",
      title: "Verifying your email…",
      color: "text-slate-700",
    },
    success: {
      icon: <CheckCircle2 size={36} />,
      iconBg: "bg-emerald-100 text-emerald-600",
      title: "Email Verified!",
      color: "text-emerald-700",
    },
    error: {
      icon: <XCircle size={36} />,
      iconBg: "bg-red-100 text-red-500",
      title: "Verification Failed",
      color: "text-red-600",
    },
    missing: {
      icon: <ShieldCheck size={36} />,
      iconBg: "bg-amber-100 text-amber-500",
      title: "Invalid Link",
      color: "text-amber-600",
    },
  }

  const current = UI[state]

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <GuestLayout>
      <div className="max-w-md mx-auto my-20 px-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center">

          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${current.iconBg}`}>
            {current.icon}
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-poppins-bold mb-3 ${current.color}`}>
            {current.title}
          </h2>

          {/* Message */}
          <p className="text-slate-500 font-poppins-regular text-sm leading-relaxed mb-8">
            {message}
          </p>

          {/* Success — countdown + redirect */}
          {state === "success" && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 font-poppins-regular">
                Redirecting to dashboard in{" "}
                <span className="text-emerald-600 font-poppins-bold">{countdown}s</span>…
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-poppins-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Go to Dashboard Now
              </button>
            </div>
          )}

          {/* Error — retry or resend options */}
          {(state === "error" || state === "missing") && (
            <div className="space-y-3">
              <Link
                href="/resend-verification"
                className="block w-full bg-emerald-600 text-white py-3 rounded-2xl font-poppins-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Resend Verification Email
              </Link>
              <Link
                href="/login"
                className="block w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-poppins-bold hover:bg-slate-200 transition-all"
              >
                Back to Login
              </Link>
            </div>
          )}

          {/* Loading skeleton hint */}
          {state === "loading" && (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-slate-100 rounded-full w-3/4 mx-auto" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2 mx-auto" />
            </div>
          )}

        </div>
      </div>
    </GuestLayout>
  )
}

export default PhoneVerifyRedirect