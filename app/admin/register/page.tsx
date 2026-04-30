"use client"

import { useEffect, useState } from "react"
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import Link from "next/link"
import GuestLayout from "@/app/GuestLayout"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Client } from "@/shared/utils/ApiClient"
import Toasts from "@/components/Toasts"
import posthog from "posthog-js"

const adminRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("Please enter a valid email address"),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Please enter a valid phone number (e.g. +234...)"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, "Password must include uppercase, lowercase, number, and special character"),
  role: z.enum(["USER", "ADMIN"]),
})


type FormData = z.infer<typeof adminRegisterSchema>

interface ApiErrorResponse {
  message?: string | string[];
}

const AdminRegister: React.FC = () => {
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "ADMIN",
  })
  
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const formatNigerianPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "") // strip non-digits

    if (digits.startsWith("0") && digits.length === 11) {
      return "+234" + digits.slice(1)
    }

    return value // return as-is if it doesn't match the pattern
  }

  // ── auto-dismiss error alert ───────────────────────────────────────────────
  useEffect(() => {
    if (!alertMsg) return
    const timer = setTimeout(() => setAlertMsg(""), 4000)
    return () => clearTimeout(timer)
  }, [alertMsg])

  const handleRegister = async (data: FormData) => {
    setLoading(true)

    try {
      const response = await Client.post("/auth/register", data)

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg("Registration request sent successfully.")
        
        posthog.capture("admin_registered")

        // Redirect to login after brief delay
        setTimeout(() => {
           router.push("/admin/login")
        }, 2000)
        return
      }

      setAlertMsg("Registration failed. Please check details and try again.")
    } catch (error: any) {
      console.error("Register error:", error)
      posthog.captureException(error)
      
      const errorData: ApiErrorResponse = error.response?.data || {}
      let errorMsg = "Unable to reach the server."
      
      if (errorData.message) {
        if (Array.isArray(errorData.message)) {
          // If it's an array, it's likely validation errors
          const fieldErrors: Record<string, string> = {}
          errorData.message.forEach((msg: string) => {
            const lowerMsg = msg.toLowerCase()
            if (lowerMsg.includes("full name") || lowerMsg.includes("fullname")) fieldErrors.fullName = msg
            else if (lowerMsg.includes("email")) fieldErrors.email = msg
            else if (lowerMsg.includes("phone")) fieldErrors.phone = msg
            else if (lowerMsg.includes("password")) fieldErrors.password = msg
          })
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...fieldErrors }))
            errorMsg = "Please correct the highlighted fields."
          } else {
            errorMsg = errorData.message[0]
          }
        } else {
          errorMsg = errorData.message
        }
      }
      
      setAlertMsg(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = adminRegisterSchema.safeParse(formData)

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
    await handleRegister(result.data)
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
  }

  const inputClass = (field: string) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-slate-800/50 outline-none text-sm transition-all duration-200 font-poppins-regular text-white placeholder:text-slate-400 ${errors[field]
      ? "border-red-400/50 bg-red-900/20 focus:border-red-400"
      : "border-slate-700 focus:border-emerald-500 focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
    }`

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
            <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-8 pt-10 pb-12 overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 blur-xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-black/20 translate-y-1/2 -translate-x-1/4 blur-lg" />
              
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg mx-auto mb-4">
                <ShieldCheck size={28} className="text-emerald-100" />
              </div>
              <h2 className="text-2xl font-poppins-bold text-white leading-tight">
                Admin Registration
              </h2>
              <p className="text-emerald-200/60 text-sm font-poppins-medium mt-2">
                Request access to the control panel
              </p>
            </div>

            {/* Form body */}
            <div className="px-8 pb-8 pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Jane Doe"
                      disabled={loading}
                      className={inputClass("fullName")}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-400 text-xs font-poppins-medium">{errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={(e) => handleChange('phone', formatNigerianPhone(e.target.value))}
                      placeholder="+234..."
                      disabled={loading}
                      className={inputClass("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-xs font-poppins-medium">{errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">
                    Company Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="admin@tenantswap.ng"
                      disabled={loading}
                      className={inputClass("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs font-poppins-medium">{errors.email}</p>
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
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
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
                  className="group relative w-full overflow-hidden rounded-xl bg-emerald-600 px-6 py-3.5 font-poppins-bold text-white text-sm shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-[0.98] mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-white" />
                        Submitting Request…
                      </>
                    ) : (
                      <>
                        Register Account
                        <ArrowRight size={18} className="text-emerald-100 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
                
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-center text-xs font-poppins-regular text-slate-500">
                  Already have access?{" "}
                  <Link href="/admin/login" className="text-emerald-400 font-poppins-semibold hover:text-emerald-300 hover:underline transition-all">
                    Sign in to portal
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

export default AdminRegister
