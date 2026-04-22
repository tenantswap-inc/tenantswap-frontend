"use client"

import React, { useEffect, useState } from "react"
import GuestLayout from "@/app/GuestLayout"
import { Mail, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { Client } from "@/shared/utils/ApiClient"
import Link from "next/link"
import { useRouter } from "next/navigation"

type PageState = "idle" | "loading" | "success" | "error"

interface ApiErrorResponse {
  message?: string | string[];
}

const AdminResendVerification: React.FC = () => {
  const router = useRouter()
  const [email, setEmail]     = useState("")
  const [state, setState]     = useState<PageState>("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Check if user is already logged in as admin? 
    // Usually admin tokens are stored as ADMIN_JWT_TOKEN
    const token = localStorage.getItem('ADMIN_JWT_TOKEN')
    if (token) {
      router.replace('/admin/dashboard')
      return
    }

    const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const presetEmail = search?.get('email')?.trim() ?? ''
    
    if (presetEmail) {
      setEmail(presetEmail)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setState("error")
      setMessage("Please enter your company email address.")
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

      if (response.status === 200 || response.status === 201) {
        setState("success")
        setMessage(response.data.message || "A fresh verification link has been sent to your email.")
        return
      }

      // Backend generic message handled as success too as per auth service logic
      setState("success")
      setMessage(response.data.message)
      
    } catch (error: any) {
      setState("error")
      
      const errorData: ApiErrorResponse = error.response?.data || {}
      let errorMsg = "Unable to reach the server. Please check your connection."
      
      if (errorData.message) {
        if (Array.isArray(errorData.message)) {
          errorMsg = errorData.message[0]
        } else {
          errorMsg = errorData.message
        }
      }
      
      setMessage(errorMsg)
    }
  }

  if (state === "success") {
    return (
      <GuestLayout>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-[20%] w-96 h-96 rounded-full bg-emerald-600/10 blur-[100px]" />
            <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[120px]" />
          </div>

          <div className="relative w-full max-w-md z-10 text-center">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-slate-800/60">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <CheckCircle2 size={40} />
              </div>

              <h2 className="text-2xl font-poppins-bold text-white mb-4">
                Check Your Inbox
              </h2>

              <p className="text-slate-400 font-poppins-regular text-sm leading-relaxed mb-8">
                {message}
              </p>

              <div className="space-y-4">
                <Link
                  href="/admin/login"
                  className="block w-full bg-emerald-600 text-white py-4 rounded-2xl font-poppins-bold hover:bg-emerald-500 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] text-sm"
                >
                  Return to Login
                </Link>
                <button
                  onClick={() => {
                    setState("idle")
                    setEmail("")
                  }}
                  className="w-full text-slate-500 hover:text-white transition-colors text-xs font-poppins-medium"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          </div>
        </div>
      </GuestLayout>
    )
  }

  return (
    <GuestLayout>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        
        {/* Glow effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-[20%] w-96 h-96 rounded-full bg-emerald-600/10 blur-[100px]" />
          <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md z-10">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800/60">

            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-8 pt-10 pb-12 overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 blur-xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-black/20 translate-y-1/2 -translate-x-1/4 blur-lg" />
              
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg mx-auto mb-4">
                <Mail size={28} className="text-emerald-100" />
              </div>
              <h2 className="text-2xl font-poppins-bold text-white leading-tight">
                Resend Verification
              </h2>
              <p className="text-emerald-200/60 text-sm font-poppins-medium mt-2">
                We'll send you a fresh link to your inbox
              </p>
            </div>

            {/* Form body */}
            <div className="px-8 pb-10 pt-8">
              {state === "error" && (
                <div className="mb-6 bg-red-900/20 border border-red-500/20 text-red-400 text-xs font-poppins-medium px-4 py-3 rounded-xl flex items-start gap-3">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest ml-1">
                    Company Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (state === "error") setState("idle")
                      }}
                      placeholder="admin@tenantswap.ng"
                      disabled={state === "loading"}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-800/60 bg-slate-800/40 outline-none text-sm transition-all duration-200 font-poppins-regular text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-slate-800/60 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.05)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={state === "loading" || !email.trim()}
                  className="group relative w-full overflow-hidden rounded-2xl bg-emerald-600 px-6 py-4 font-poppins-bold text-white text-sm shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    {state === "loading" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending Link…
                      </>
                    ) : (
                      <>
                        Send Verification Email
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-10 pt-6 border-t border-slate-800/60 text-center">
                <Link href="/admin/login" className="text-slate-500 hover:text-emerald-400 transition-colors text-sm font-poppins-medium">
                  ← Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  )
}

export default AdminResendVerification
