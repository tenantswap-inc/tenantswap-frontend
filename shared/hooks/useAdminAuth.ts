'use client'
import { useState, useEffect, useCallback } from 'react'

const TOKEN_KEY = 'ADMIN_JWT_TOKEN'

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true // unparseable token = treat as expired
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  if (isJwtExpired(token)) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  return token
}

export const useAdminAuth = () => {
  const [token, setTokenState] = useState<string | null>(getStoredToken)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored && isJwtExpired(stored)) {
      localStorage.removeItem(TOKEN_KEY)
      setTokenState(null)
    } else {
      setTokenState(stored)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setTokenState(newToken)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenState(null)
    window.location.href = '/admin/login'
  }

  return { 
    token, 
    isLoading, 
    isAuthenticated: !!token,
    login,
    logout,
    checkAuth
  }
}
