'use client'
import { useState, useEffect } from 'react'

// Read token synchronously on first render (avoids the extra render cycle)
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('JWT_TOKEN')
}

export const useToken = () => {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [ready, setReady] = useState(typeof window !== 'undefined')

  useEffect(() => {
    // Sync in case token changed since first render
    const stored = localStorage.getItem('JWT_TOKEN')
    setToken(stored)
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