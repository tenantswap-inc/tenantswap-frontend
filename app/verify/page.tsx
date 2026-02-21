"use client"

import React, { useState, useRef, useEffect } from "react"
import GuestLayout from "@/app/GuestLayout"
import { ShieldCheck, ArrowRight } from "lucide-react"
import { Alert } from "@heroui/alert"
import { X } from "lucide-react"
import Link from "next/link"

const OTP_LENGTH = 6

const OtpScreen: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [alertMsg, setAlertMsg] = useState("")

  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  /* =========================
     ALERT TIMEOUT
  ========================= */
  useEffect(() => {
    if (!alertMsg) return
    const timer = setTimeout(() => setAlertMsg(""), 4000)
    return () => clearTimeout(timer)
  }, [alertMsg])

  /* =========================
     OTP HANDLERS
  ========================= */

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const code = otp.join("")

    if (code.length !== OTP_LENGTH) {
      setAlertMsg("Please enter the complete verification code.")
      return
    }

    // 👉 Replace with real verification logic
    console.log("OTP Submitted:", code)
  }

  const resendCode = () => {
    setAlertMsg("A new code has been sent to your phone.")
  }

  return (
    <GuestLayout>
      <div className="max-w-md mx-auto my-20 px-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">

          {/* ===== ALERT ===== */}
          {alertMsg && (
            <div className="fixed top-6 right-6 z-[9999] w-full max-w-md">
              <Alert
                color="danger"
                variant="solid"
                isVisible={true}
                onClose={() => setAlertMsg("")}
                classNames={{
                  base: "shadow-2xl rounded-2xl border border-red-500/20 bg-red-500 animate-in fade-in slide-in-from-top-2 duration-300",
                }}
              >
                <div className="flex items-center gap-3">
                  <X size={20} className="rounded-sm text-red-500 bg-white" />
                  <span className="text-white font-poppins-bold">
                    {alertMsg}
                  </span>
                </div>
              </Alert>
            </div>
          )}

          {/* ===== HEADER ===== */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <ShieldCheck size={32} />
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
              Verify Your Number
            </h2>

            <p className="text-slate-500 text-sm">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          {/* ===== OTP FORM ===== */}
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* OTP INPUTS */}
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="
                    w-12 h-14
                    text-center text-xl font-bold
                    rounded-xl
                    border border-slate-200
                    focus:border-emerald-500
                    focus:ring-4 focus:ring-emerald-500/10
                    outline-none
                    transition-all
                  "
                />
              ))}
            </div>

            {/* RESEND */}
            <div className="text-center text-sm">
              <span className="text-slate-500">
                Didn’t receive the code?
              </span>{" "}
              <button
                type="button"
                onClick={resendCode}
                className="text-emerald-600 font-bold hover:underline"
              >
                Resend
              </button>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="
                w-full
                bg-emerald-600
                text-white
                py-4
                rounded-2xl
                font-bold
                text-lg
                hover:bg-emerald-700
                transition-all
                shadow-lg shadow-emerald-600/20
                flex items-center justify-center gap-3
              "
            >
              Verify Code
              <ArrowRight size={20} />
            </button>
          </form>

          {/* BACK LINK */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/register"
              className="text-sm text-emerald-600 font-bold hover:underline"
            >
              Change phone number
            </Link>
          </div>

        </div>
      </div>
    </GuestLayout>
  )
}

export default OtpScreen