"use client"

import React, { useState, useEffect } from "react"
import { UserPlus, User, Phone, Lock, Mail, Eye, EyeOff } from "lucide-react"
import GuestLayout from "@/app/GuestLayout"
import { z } from "zod"
import { Alert } from "@heroui/alert"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import Onboarding from "@/components/onboarding"
import { Client } from "@/shared/utils/ApiClient"
import { Check } from "lucide-react"
import { OAuthUser } from "@/shared/types"




/* ========================= ZOD SCHEMA ========================= */
const schema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    phone: z
      .string()
      .regex(/^\+234[789][01]\d{8}$/, "Phone must start with +234 followed by 10 digits (e.g. +2348012345678)"),
    email: z.email("Enter a valid email").optional().or(z.literal("")),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must include at least one special character"),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms and Conditions to continue",
    }),
    gender: z.string("Please select a gender"),
    relationshipStatus: z.string("Please select your relationship status"),
    occupation: z.string().min(2, "Occupation must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type FormData = z.infer<typeof schema>

export type RegisteredUser = FormData & {
  canConnectLandlord: boolean
  hasLandlordContact: boolean
  allowIncomingCalls: boolean
}

/* ========================= COMPONENT ========================= */
const Register: React.FC = () => {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null)
  const [oauthProvider, setOauthProvider] = useState<boolean>(false)
  const [oauthIdToken, setOauthIdToken] = useState<string>("")
    const [oauthUser, setOauthUser] = useState<OAuthUser|null>(null)
  const [form, setForm] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    gender: "",
    relationshipStatus: "",
    occupation: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alertMsg, setAlertMsg] = useState("")

  useEffect(() => {
    if (localStorage.getItem("OAuthUser")) {
      const user: OAuthUser = JSON.parse(localStorage.getItem("OAuthUser") as string)
      const password = `Tenantswap-${user.id}@gmail.com`

      setOauthIdToken(user.token)
      setOauthUser(user)
      setForm({
        fullName: user.fullName,
        phone: "",
        email: user.email,
        password: password,
        confirmPassword: password,
        agreeTerms: false,
        gender: "",
        relationshipStatus: "",
        occupation: "",
      })
      setOauthProvider(true)
    }
  }, [setForm, setOauthProvider])


  useEffect(() => {
    if (!alertMsg) return
    const timer = setTimeout(() => setAlertMsg(""), 4000)
    return () => clearTimeout(timer)
  }, [alertMsg])

  const formatNigerianPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "") // strip non-digits

    if (digits.startsWith("0") && digits.length === 11) {
      return "+234" + digits.slice(1)
    }

    return value // return as-is if it doesn't match the pattern
  }


  const update = (field: keyof FormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

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
    const newUser: RegisteredUser = {
      ...result.data,
      canConnectLandlord: false,
      hasLandlordContact: false,
      allowIncomingCalls: false
    }
    setRegisteredUser(newUser)
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = async (updatedUser: RegisteredUser) => {


    try {


      const response = await Client.post("/auth/register", {
        authType: "oauth",
        oauthProvider: "google",
        oauthIdToken: oauthIdToken,
        oauthId: oauthUser?.id,
        profilePhotoUrl: oauthUser?.avatar,
        fullName:updatedUser.fullName,
        phone: updatedUser.phone,
        email: updatedUser.email,
        gender: updatedUser.gender,
        relationship_status: updatedUser.relationshipStatus,
        occupation: updatedUser.occupation,
        canConnectLandlord: updatedUser.canConnectLandlord,
        hasLandlordContact: updatedUser.hasLandlordContact,
        allowIncomingCalls: updatedUser.allowIncomingCalls,
      })

      const data = response.data

      console.log(response.data)
      if (response.status === 201 || response.status === 200) {
        const token: string = data.data.accessToken

        if (token) {
          console.log({ token })
          localStorage.setItem("JWT_TOKEN", token)
          setAlertMsg("Registration successful. Redirectiog to Dashboard.")
          router.push("/dashboard")
        }

      }
    } catch (error: any) {
      if (error.response) {
        setAlertMsg(error.response.data?.message || "Registration failed.")
      } else {
        setAlertMsg("Network error. Please try again.")
      }
    }
  }

  const inputClass = (field: keyof FormData) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-slate-50/60 outline-none text-sm transition-all duration-200 font-poppins-regular placeholder:text-slate-300 ${errors[field]
      ? "border-red-400 bg-red-50/40 focus:border-red-400"
      : "border-slate-100 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]"
    }`

  if (showOnboarding) {
    return (
      <GuestLayout>
        <Onboarding currentUser={registeredUser} onComplete={handleOnboardingComplete} />
      </GuestLayout>
    )
  }

  return (
    <GuestLayout>
      {/* Toast alert */}
      {alertMsg && (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm">
          <Alert
            color="danger"
            variant="solid"
            isVisible={true}
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

      {/* Page background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex items-center justify-center py-12 px-4">
        {/* Decorative blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.10)] overflow-hidden border border-slate-100/80">

            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-8 pt-10 pb-12 overflow-hidden">
              {/* Geometric accents */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4" />
              <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/40" />
              <div className="absolute top-10 right-10 w-1 h-1 rounded-full bg-white/30" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <UserPlus size={26} className="text-white" />
                </div>
                <div>
                  <p className="text-emerald-200 text-xs font-poppins-medium tracking-widest uppercase mb-0.5">
                    Welcome
                  </p>
                  <h2 className="text-2xl font-poppins-bold text-white leading-tight">
                    Create Account
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
            <div className="px-8 pb-8 -mt-2">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      value={form.fullName}
                      disabled={oauthProvider}
                      onChange={(e) => update("fullName", e.target.value)}
                      className={inputClass("fullName")}
                      placeholder="Adekunle Ciroma"
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs font-poppins-medium">{errors.fullName}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      onBlur={(e) => update("phone", formatNigerianPhone(e.target.value))}
                      className={inputClass("phone")}
                      placeholder="+2348012345678"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs font-poppins-medium">{errors.phone}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                    Email <span className="normal-case text-slate-300 font-poppins-regular">— optional</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      value={form.email}
                      disabled={oauthProvider}
                      onChange={(e) => update("email", e.target.value)}
                      className={inputClass("email")}
                      placeholder="example@gmail.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs font-poppins-medium">{errors.email}</p>}
                </div>

                {/* Password row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        disabled={oauthProvider}
                        value={form.password}
                        placeholder="••••••••"
                        onChange={(e) => update("password", e.target.value)}
                        className={`w-full pl-11 pr-10 py-3 rounded-xl border-2 bg-slate-50/60 outline-none text-sm transition-all duration-200 font-poppins-regular placeholder:text-slate-300 ${errors["password"]
                          ? "border-red-400 bg-red-50/40 focus:border-red-400"
                          : "border-slate-100 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-0 top-0 h-full px-3 flex items-center bg-white rounded-r-xl border-2 border-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs font-poppins-medium">{errors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        disabled={oauthProvider}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        className={`w-full pl-11 pr-10 py-3 rounded-xl border-2 bg-slate-50/60 outline-none text-sm transition-all duration-200 font-poppins-regular placeholder:text-slate-300 ${errors["confirmPassword"]
                          ? "border-red-400 bg-red-50/40 focus:border-red-400"
                          : "border-slate-100 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-0 top-0 h-full px-3 flex items-center bg-white rounded-r-xl border-2 border-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs font-poppins-medium">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Gender & Relationship Status */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={form.gender ?? ""}
                        onChange={(e) => update("gender", e.target.value)}
                        className={`w-full pl-4 pr-8 py-3 rounded-xl border-2 bg-slate-50/60 outline-none text-sm transition-all duration-200 font-poppins-regular appearance-none cursor-pointer ${errors.gender
                          ? "border-red-400 bg-red-50/40 focus:border-red-400"
                          : "border-slate-100 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]"
                          } ${!form.gender ? "text-slate-300" : "text-slate-700"}`}
                      >
                        <option value="" disabled>Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                    {errors.gender && <p className="text-red-500 text-xs font-poppins-medium">{errors.gender}</p>}
                  </div>

                  {/* Relationship Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={form.relationshipStatus ?? ""}
                        onChange={(e) => update("relationshipStatus", e.target.value)}
                        className={`w-full pl-4 pr-8 py-3 rounded-xl border-2 bg-slate-50/60 outline-none text-sm transition-all duration-200 font-poppins-regular appearance-none cursor-pointer ${errors.relationshipStatus
                          ? "border-red-400 bg-red-50/40 focus:border-red-400"
                          : "border-slate-100 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]"
                          } ${!form.relationshipStatus ? "text-slate-300" : "text-slate-700"}`}
                      >
                        <option value="" disabled>Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                    {errors.relationshipStatus && <p className="text-red-500 text-xs font-poppins-medium">{errors.relationshipStatus}</p>}
                  </div>
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-poppins-bold text-slate-500 uppercase tracking-wider">
                    Occupation
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                    <input
                      value={form.occupation}
                      onChange={(e) => update("occupation", e.target.value)}
                      className={inputClass("occupation")}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  {errors.occupation && <p className="text-red-500 text-xs font-poppins-medium">{errors.occupation}</p>}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={form.agreeTerms}
                      onChange={(e) => update("agreeTerms", e.target.checked)}
                      className="sr-only peer"
                    />
                    <label
                      htmlFor="agreeTerms"
                      className="w-5 h-5 flex items-center justify-center rounded-md border-2 border-slate-200 cursor-pointer transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-500"
                    >

                      <Check className="w-4 h-4 text-white " />

                    </label>
                  </div>
                  <span className="text-xs font-poppins-medium text-slate-500 leading-relaxed">
                    I agree to the{" "}
                    <span className="text-emerald-600 cursor-pointer hover:underline">Terms of Service</span>{" "}
                    and{" "}
                    <span className="text-emerald-600 cursor-pointer hover:underline">Privacy Policy</span>
                  </span>
                </div>
                {errors.agreeTerms && (
                  <p className="text-red-500 text-xs font-poppins-medium -mt-2">{errors.agreeTerms}</p>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-3.5 font-poppins-bold text-white text-sm shadow-[0_4px_16px_rgba(5,150,105,0.4)] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(5,150,105,0.5)] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-none mt-2"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <span className="relative flex items-center justify-center gap-2 tracking-wide">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Create My Profile
                  </span>
                </button>


              </form>





            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  )
}

export default Register