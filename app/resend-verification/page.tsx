"use client"

import React, { useEffect, useState } from "react"
import GuestLayout from "@/app/GuestLayout"
import { Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Client } from "@/shared/utils/ApiClient"
import Link from "next/link"
import { useRouter } from "next/navigation"

type PageState = "idle" | "loading" | "success" | "error"

const ResendVerification: React.FC = () => {
  const router = useRouter()
  const [email, setEmail]     = useState("")
  const [state, setState]     = useState<PageState>("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = localStorage.getItem('JWT_TOKEN')
    if (token) {
      router.replace('/dashboard')
      return
    }

    const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const presetEmail = search?.get('email')?.trim() ?? ''
    const sent = search?.get('sent') === '1'

    if (presetEmail) {
      setEmail(presetEmail)
    }

    if (presetEmail && sent) {
      setState('success')
      setMessage('Registration successful. Check your email for the verification link we just sent.')
    }
  }, [router])

  // ── submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setState("error")
      setMessage("Please enter your email address.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error")
      setMessage("Please enter a valid email address.")
      return
    }

    setState("loading")
    setMessage("")

    try {
      const response = await Client.post("/auth/resend-verification", { email })

      console.log(response.data)

      if (response.status === 200 || response.status === 201) {
        setState("success")
        setMessage(response.data.message)
        return
      }

      if (response.status === 404) {
        setState("success")
        setMessage("No account found with that email address.")
        return
      }

      if (response.status === 409) {
        setState("error")
        setMessage("This email is already verified. You can log in directly.")
        return
      }

      if (response.status === 429) {
        setState("error")
        setMessage("Too many requests. Please wait a few minutes before trying again.")
        return
      }

      setState("error")
      setMessage("Something went wrong. Please try again.")
    } catch {
      setState("error")
      setMessage("Unable to reach the server. Please check your connection.")
    }
  }

  // ── success screen ─────────────────────────────────────────────────────────

  if (state === "success") {
    return (
      <GuestLayout>
        <div className="max-w-md mx-auto my-20 px-4">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center">

            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-poppins-bold text-slate-900 mb-3">
              Check Your Inbox
            </h2>

            <p className="text-slate-500 font-poppins-regular text-sm leading-relaxed mb-2">
              {message}
            </p>

            <p className="text-slate-400 font-poppins-regular text-xs mb-8">
              Sent to{" "}
              <span className="text-slate-600 font-poppins-bold">{email}</span>
            </p>

            {/* Divider */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <button
                onClick={() => {
                  setState("idle")
                  setEmail("")
                  setMessage("")
                }}
                className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-poppins-bold hover:bg-slate-200 transition-all text-sm"
              >
                Use a different email
              </button>
              <Link
                href="/login"
                className="block w-full bg-emerald-600 text-white py-3 rounded-2xl font-poppins-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 text-sm"
              >
                Back to Login
              </Link>
            </div>

          </div>
        </div>
      </GuestLayout>
    )
  }

  // ── main form ──────────────────────────────────────────────────────────────

  return (
    <GuestLayout>
      <div className="max-w-md mx-auto my-20 px-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Mail size={30} />
            </div>
            <h2 className="text-2xl font-poppins-bold text-slate-900 mb-2">
              Resend Verification
            </h2>
            <p className="text-slate-500 font-poppins-regular text-sm leading-relaxed">
              Enter the email address you registered with and we'll send you a fresh verification link.
            </p>
          </div>

          {/* Error banner */}
          {state === "error" && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm font-poppins-medium px-4 py-3 rounded-2xl flex items-start gap-3">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-poppins-bold text-slate-500 uppercase tracking-widest"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === "error") { setState("idle"); setMessage("") }
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={state === "loading"}
                  className="
                    w-full pl-11 pr-4 py-4
                    rounded-2xl border border-slate-200
                    text-slate-800 font-poppins-regular text-sm
                    placeholder:text-slate-300
                    focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                  "
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={state === "loading" || !email.trim()}
              className="
                w-full bg-emerald-600 text-white
                py-4 rounded-2xl
                font-poppins-bold text-sm
                hover:bg-emerald-700 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all shadow-lg shadow-emerald-600/20
                flex items-center justify-center gap-3
              "
            >
              {state === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send Verification Link
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3 text-sm">
            <Link
              href="/login"
              className="text-emerald-600 font-poppins-bold hover:underline"
            >
              Back to Login
            </Link>
            <p className="text-slate-400 font-poppins-regular text-xs text-center">
              Don't have an account?{" "}
              <Link href="/register" className="text-emerald-600 font-poppins-bold hover:underline">
                Register
              </Link>
            </p>
          </div>

        </div>
      </div>
    </GuestLayout>
  )
}

export default ResendVerification