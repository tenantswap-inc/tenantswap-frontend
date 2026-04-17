'use client'
import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { HeroUIProvider } from '@heroui/react'

interface Props {
  children: React.ReactNode
}

const App: React.FC<Props> = ({ children }) => {
  return (
    <HeroUIProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </HeroUIProvider>
  )
}

export default App
