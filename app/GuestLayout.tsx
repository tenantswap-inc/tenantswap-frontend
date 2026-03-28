'use client'
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Props {
  children: React.ReactNode
}

const App: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation */}
      <Navbar />

      <main className="flex-grow">{children}</main>

      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-poppins-bold">
            © 2026 TenantSwap Nigeria. Built for Tenants, by Tenants. Zero Agent
            Fees.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
