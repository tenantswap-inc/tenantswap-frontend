'use client'
import { useState, useEffect } from 'react'

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true // unparseable token = treat as expired
  }
}

// Read token synchronously on first render, evict if expired
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('JWT_TOKEN')
  if (!token) return null
  if (isJwtExpired(token)) {
    localStorage.removeItem('JWT_TOKEN')
    return null
  }
  return token
}

export const useToken = () => {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [ready, setReady] = useState(typeof window !== 'undefined')

  useEffect(() => {
    // Sync in case token changed since first render
    const stored = localStorage.getItem('JWT_TOKEN')
    if (stored && isJwtExpired(stored)) {
      localStorage.removeItem('JWT_TOKEN')
      setToken(null)
    } else {
      setToken(stored)
    }
    setReady(true)
  }, [])

  return { token, ready }
}

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('JWT_TOKEN', token)
  }
}

export const unsetToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('JWT_TOKEN')
  }
}