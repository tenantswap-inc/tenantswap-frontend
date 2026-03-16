"use client"
import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from 'next/image';
import { OAuthUser } from "@/shared/types";


export default function SSOComplete() {
  const params = useSearchParams()
  const router = useRouter()
  const state = params.get("state")

  useEffect(() => {
    if (state === "signin") {
      const authToken = params.get("token")
      if (authToken) {

        // last token removal if exists
        const formerToken = localStorage.getItem("JWT_TOKEN")
        if (formerToken) {

          console.log("former token:", formerToken)

          localStorage.removeItem("JWT_TOKEN")

          console.log("former token removed")
        }

        console.log("authToken", authToken)
        localStorage.setItem("JWT_TOKEN", authToken)
        console.log("newToken added")
        router.push("/dashboard")
      }
    }

    if (state === "signup") {
      const user: OAuthUser = {
        id: params.get("id") ?? "",
        fullName: params.get("fullName") ?? "",
        email: params.get("email") ?? "",
        avatar: params.get("avatar") ?? "",
        token: params.get("token") ?? "",
      }
      localStorage.setItem("OAuthUser", JSON.stringify(user))
      const timer = setTimeout(() => router.push("/register/oauth"), 1000)
      return () => clearTimeout(timer)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const message =
    state === "signin"
      ? "Redirecting to Dashboard…"
      : state === "signup"
        ? "Redirecting to complete registration…"
        : "Something went wrong. Please try again."

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex-col space-y-10 justify-center items-center">
        <div className="flex justify-center items-center animate-pulse">
          <Image
            src="/assets/TenantSwap Logo.svg"
            alt="TenantSwap"
            width={150}
            height={150}
            preload={true}
            quality={100}
          />
        </div>
        <p className="text-slate-500 text-center font-poppins-bold text-xl ">
          {message}
        </p>
      </div>
    </div>
  )
}