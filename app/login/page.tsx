"use client"

import { useEffect, useState } from "react"
import { Phone, Lock, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import GuestLayout from "@/app/GuestLayout"
import { useRouter } from "next/navigation"
import { Alert } from "@heroui/alert"
import { z } from "zod"
import {  UserState } from "@/shared/types"
import { FormData  as RegisteredUser} from "@/app/register/page"


const loginSchema = z.object({
phone: z
  .string()
  .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"),
password: z.string().min(1, "Password is required"),
})

type FormData = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const router = useRouter()



  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [alertMsg, setAlertMsg] = useState("")

  const [userState, setUserState] = useState<UserState>({
    isLoggedIn: false,
    currentUser: null,
  })

  useEffect(() => {
  if (!alertMsg) return

  const timer = setTimeout(() => {
    setAlertMsg("")
  }, 4000) // ⏱️ 4 seconds (change if needed)

  return () => clearTimeout(timer)
}, [alertMsg])

const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null)

useEffect(() => {
  const raw = localStorage.getItem("registeredUser")
  if (raw) setRegisteredUser(JSON.parse(raw))
}, [])
  const handleLogin = (user: FormData) => {

    const existing =  registeredUser?.phone === user.phone

    if (existing) {
      setUserState({ isLoggedIn: true, currentUser: user })
    localStorage.setItem("authenticatedUser", JSON.stringify(registeredUser))
      router.push("/dashboard")
    } else {
      setUserState({ isLoggedIn: true, currentUser: null })
      setAlertMsg("User not found. Please register first.")
    }
  }

const handleSubmit = (e: React.SubmitEvent) => {
  e.preventDefault()

  const result = loginSchema.safeParse({ phone, password })

  if (!result.success) {
    const fieldErrors: Record<string, string> = {}

    result.error.issues.forEach((err) => {
      const key = err.path[0] as string
      fieldErrors[key] = err.message
    })

    setAlertMsg("Please correct the highlighted fields.")
    return
  }

  setAlertMsg("")

  handleLogin(result.data)
}

  return (
    <GuestLayout>
      {/* 🔴 Floating Alert (same style as Register) */}
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
        <span className="text-white font-poppins-bold">{alertMsg}</span>
      </div>
    </Alert>
  </div>
)}
      {/* 🔹 Login Card */}
      <div className="max-w-md mx-auto my-20 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-poppins-bold text-slate-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-500 font-poppins-medium">
              Sign in to manage your house swap
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PHONE */}
            <div>
              <label className="block text-sm font-poppins-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  // required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-poppins-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  // required
                />
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full hover:-translate-y-1 transition-all duration-500 bg-emerald-600 text-white py-4 rounded-xl flex justify-center gap-4 items-center font-poppins-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
            >
              Sign In
              <ArrowRight size={20} />
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-500 text-sm font-poppins-regular">
              New to TenantSwap?{" "}
              <Link
                href="/register"
                className="text-emerald-600 font-poppins-bold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </GuestLayout>
  )
}

export default Login