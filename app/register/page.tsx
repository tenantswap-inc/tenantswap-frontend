"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { UserPlus, User, Phone, Lock, Mail } from "lucide-react"
import GuestLayout from "@/app/GuestLayout"
import { z } from "zod"
import { Alert } from "@heroui/alert"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import Onboarding from "@/components/onboarding" // adjust path as needed
import { Client } from "@/shared/utils/ApiClient"

/* =========================
   ZOD SCHEMA
========================= */

const schema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    phone: z
      .string()
      .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"),
    email: z
      .string()
      .email("Enter a valid email")
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms and Conditions to continue",
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type FormData = z.infer<typeof schema>

// Shape we persist to localStorage after registration
export type RegisteredUser = FormData & {
  canConnectLandlord: boolean
  hasLandlordContact: boolean
  onboardingComplete: boolean
}

/* =========================
   HELPERS
========================= */


/* =========================
   COMPONENT
========================= */

const Register: React.FC = () => {
  const router = useRouter()

  // After a successful registration we flip this to `true` to render Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)

  // The registered user we'll hand off to Onboarding
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null)

  const [form, setForm] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alertMsg, setAlertMsg] = useState("")

  useEffect(() => {
    if (!alertMsg) return
    const timer = setTimeout(() => setAlertMsg(""), 4000)
    return () => clearTimeout(timer)
  }, [alertMsg])

  const update = (field: keyof FormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // FIX: correct event type (React.SubmitEvent does not exist)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = schema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string
        fieldErrors[key] = err.message
      })
      setErrors(fieldErrors)
      setAlertMsg("Please correct the highlighted fields.")
      return
    }

    setErrors({})
    setAlertMsg("")

    // Build the initial user record (onboarding fields default to false)
    const newUser: RegisteredUser = {
      ...result.data,
      canConnectLandlord: false,
      hasLandlordContact: false,
      onboardingComplete: false,
    }

    // Hand off to Onboarding instead of navigating away
    setRegisteredUser(newUser)
    setShowOnboarding(true)




  }

  // Called by <Onboarding> when the user answers both questions
const handleOnboardingComplete = async (updatedUser: RegisteredUser) => {
    try {
      console.log(updatedUser)

      const client = await Client.post("/auth/login", {
        email: updatedUser.email,
        password: updatedUser.password,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
      }, {
        "Content-Type": "application/json",
      })

      console.log(client)
      // Onboarding itself calls router.push('/engine'), but we also
      // handle it here as a fallback in case that changes.
      // router.push("/engine")
    } catch (error) {
      console.error("Registration failed:", error)
      setAlertMsg("Registration failed. Please try again.")
    }
  }



  const inputClass = (field: keyof FormData) =>
    `w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all ${errors[field]
      ? "border-red-500 focus:ring-red-500/20"
      : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10"
    }`

  // ── Render onboarding step after successful registration ──────────────────
  if (showOnboarding) {
    return (
      <GuestLayout>
        <Onboarding
          currentUser={registeredUser}
          onComplete={handleOnboardingComplete}
        />
      </GuestLayout>
    )
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <GuestLayout>
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
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
                <div className="flex justify-start items-center gap-3">
                  <X size={20} className="rounded-sm text-red-500 bg-white" />
                  <span className="text-white font-poppins-bold">{alertMsg}</span>
                </div>
              </Alert>
            </div>
          )}

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <UserPlus size={32} />
            </div>
            <h2 className="text-3xl font-poppins-bold text-slate-900 mb-2">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FULL NAME */}
            <div>
              <label className="label font-poppins-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className={inputClass("fullName")}
                  placeholder="Adekunle Ciroma"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            {/* PHONE */}
            <div>
              <label className="label font-poppins-medium">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass("phone")}
                  placeholder="08000000000"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* EMAIL */}
            <div>
              <label className="label font-poppins-medium">
                Email <span className="text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClass("email")}
                  placeholder="example@gmail.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* PASSWORDS */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label font-poppins-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={form.password}
                    placeholder="••••••••"
                    onChange={(e) => update("password", e.target.value)}
                    className={inputClass("password")}
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="label font-poppins-medium">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    className={inputClass("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* TERMS */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.agreeTerms}
                onChange={(e) => update("agreeTerms", e.target.checked)}
              />
              <span className="text-xs font-poppins-medium">I agree to Terms & Privacy</span>
            </div>
            {errors.agreeTerms && (
              <p className="text-red-500 text-xs">{errors.agreeTerms}</p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-poppins-bold"
            >
              Create My Profile
            </button>
          </form>

          <p className="text-center mt-6 font-poppins-regular text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-poppins-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </GuestLayout>
  )
}

export default Register