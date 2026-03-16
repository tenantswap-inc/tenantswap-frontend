import { useEffect, useState } from 'react'

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem('JWT_TOKEN'))
  }, [])

  return token
}

export const unsetToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('JWT_TOKEN')
  }
}