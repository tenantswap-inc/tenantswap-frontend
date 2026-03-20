"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "./logo"
import { useToken } from "@/shared/hooks/useToken"
import { Client } from "@/shared/utils/ApiClient"

const Navbar: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/"
  const { token } = useToken()

  const isLoggedIn = token !== null



  console.log("Is Logged In: ", isLoggedIn)
  const handleLogout = async () => {
    console.log("token: ", token)
 try {
     const response = await Client.post("/auth/logout", {}, {
      "Authorization": `Bearer ${token}`
     })

    if (response.status === 200 || response.status === 201) {
      console.log(response.data)
      localStorage.removeItem("JWT_TOKEN")
      router.replace("/")
      return
    }

    if (response.status === 401) {
      console.log(response.data)

      localStorage.removeItem("JWT_TOKEN")
      router.replace("/")
      return
    }

    if (response.status === 403) {
      console.log(response.data)

      localStorage.removeItem("JWT_TOKEN")
      router.replace("/")
      return
    }

 } catch (error) {
   // Handle error
   console.error("Error logging out:", error);


 }

  }

  return (
    <nav className="bg-primary-green shadow-lg shadow-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Logged-in actions */}
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-white text-primary-green px-5 py-2 rounded-lg font-poppins-bold transition-all duration-300 hover:-translate-y-0.5 text-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/80 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-poppins-bold transition-all duration-300 hover:-translate-y-0.5 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login — visible only on home, fades out elsewhere */}
                <Link
                  href="/login"
                  className={`bg-white font-poppins-bold text-primary-green px-5 py-2 rounded-lg text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5
                    ${isHome
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-1 pointer-events-none"
                    }`}
                >
                  Login
                </Link>

                {/* Get Started — visible only on home */}
                <Link
                  href="/register"
                  className={`bg-white font-poppins-bold text-primary-green px-5 py-2 rounded-lg text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5
                    ${isHome
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-1 pointer-events-none"
                    }`}
                >
                  Get Started
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar