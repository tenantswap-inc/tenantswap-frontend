"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SwapRequest, UserState } from '@/shared/types';
import Navbar from '@/components/Navbar';

interface Props {
  children: React.ReactNode;
}


const App: React.FC<Props> = ({children}) => {
  const [userState, setUserState] = useState<UserState>({
    isLoggedIn: false,
    currentUser: null,
  });

  const location = usePathname();





  const handleLogout = () => {
    setUserState({ isLoggedIn: false, currentUser: null });
  };




  return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Navigation */}
        <Navbar location={location} handleLogout={handleLogout} userState={userState}/>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-black text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-poppins-bold">© 2024 HomeSwap Nigeria. Built for Tenants, by Tenants. Zero Agent Fees.</p>
          </div>
        </footer>
      </div>
  );
};

export default App;
