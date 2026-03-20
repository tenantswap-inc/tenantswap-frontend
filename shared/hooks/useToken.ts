'use client'
import { useState, useEffect } from 'react'

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setToken(localStorage.getItem('JWT_TOKEN'))
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