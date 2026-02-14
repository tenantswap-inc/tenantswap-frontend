"use client"
import { useState } from 'react';
import { Phone, Lock , DoorOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SwapRequest, UserState } from '@/shared/types';
import { MOCK_REQUESTS } from '@/constants';
import GuestLayout from '@/app/GuestLayout';
import {useRouter} from 'next/navigation';



const Login: React.FC = () => {
  const router = useRouter()

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userState, setUserState] = useState<UserState>({
    isLoggedIn: false,
      currentUser: null,
    });
      const [db, setDb] = useState<SwapRequest[]>(MOCK_REQUESTS);


    const handleLogin = (phoneNumber: string) => {
      // Basic MVP logic: Check if user exists in mock DB
      const existing = db.find(u => u.phoneNumber === phoneNumber);
      console.log(existing, phoneNumber)
      if (existing) {
        setUserState({ isLoggedIn: true, currentUser: existing });
        router.push('/dashboard');
        console.log('working')
      } else {
        // Create a temporary "empty" user for demonstration
        setUserState({ isLoggedIn: true, currentUser: null });
        console.log('user does not exist')
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10 && password) {
      handleLogin(phone);
    } else {
      alert("Please enter valid credentials. (Mock Auth: Any valid phone + password works)");
    }

  };



  return (
    <GuestLayout>

          <div className="max-w-md mx-auto my-20 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-poppins-bold text-slate-900 mb-2">Welcome Back</h2>
          <p className="text-slate-500">Sign in to manage your house swap</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
               <Phone className='w-5 h-5'/>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className='w-5 h-5'/>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full hover:-translate-y-1 btn transition-all duration-500  bg-emerald-600 text-white py-4 rounded-xl flex justify-center gap-4 items-center font-poppins-bold text-lg hover:bg-emerald-700  shadow-lg shadow-emerald-600/20"
          >
                Sign In
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

<div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-slate-500 text-sm">
            New to TenantSwap? <Link href="/register" className="text-emerald-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>

      </div>
    </div>
    </GuestLayout>

  );
};

export default Login;
