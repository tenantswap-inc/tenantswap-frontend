'use client'
import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Props {
  children: React.ReactNode
}

const App: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation */}
      <Navbar />

      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  )
}

export default App
