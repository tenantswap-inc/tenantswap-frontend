"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SwapRequest, UserState } from '@/shared/types';
import { MOCK_REQUESTS } from '@/constants';
import Navbar from '@/components/Navbar';

interface Props {
  children: React.ReactNode;
}


const App: React.FC<Props> = ({children}) => {
  const [userState, setUserState] = useState<UserState>({
    isLoggedIn: false,
    currentUser: null,
  });
  const [db, setDb] = useState<SwapRequest[]>(MOCK_REQUESTS);

  const location = usePathname();



    const handleRegister = (phoneNumber: string) => {
    const newUser: SwapRequest = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      phoneNumber,
      lookingFor: { type: '1BR Flat', location: 'Lagos', budget: 0, timeline: 'Flexible' },
      leavingFrom: { type: 'Self-Contain', location: 'Lagos', vacancyDate: '' },
      features: []
    };
    setDb(prev => [...prev, newUser]);
    setUserState({ isLoggedIn: true, currentUser: newUser });
  };

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
