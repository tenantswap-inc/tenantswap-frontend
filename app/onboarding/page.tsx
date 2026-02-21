'use client';

import React, { useState } from 'react';
import { useRouter } from'next/navigation';
import { ShieldCheck, PhoneCall, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { SwapRequest } from '@/shared/types';
import { Logo } from '@/components/logo';

interface OnboardingProps {
  currentUser: SwapRequest | null;
  onComplete: (updatedUser: SwapRequest) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ currentUser, onComplete }) => {
  const navigate = useRouter();
  const [canConnect, setCanConnect] = useState<boolean | null>(null);
  const [hasContact, setHasContact] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const handleComplete = () => {
    if (canConnect === null || hasContact === null) {
      setError('Please answer both questions to continue.');
      return;
    }

    if (!currentUser) return;

    const updatedUser: SwapRequest = {
      ...currentUser,
      canConnectLandlord: canConnect,
      hasLandlordContact: hasContact,
      onboardingComplete: true
    };

    onComplete(updatedUser);
    navigate.push('/engine');
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-emerald-600 p-8 text-white text-center">
          <div className="w-16 h-16  rounded-2xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
           <Logo className='h-16 w-16' autoplay={false}/>
          </div>
          <h2 className="text-3xl font-poppins-bold mb-2">Welcome to TenantSwap</h2>
          <p className="text-emerald-100 font-poppins-regular">Let's set up your profile for successful matching.</p>
        </div>

        <div className="p-8 md:p-12 space-y-10">
          {/* Question 1 */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {/* <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">1</div> */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  Are you fine with connecting an incoming Tenant to the Landlord of your apartment?
                </h3>
                <p className="text-slate-500 mt-2 text-sm">
                  This is essential for a smooth handover and is required for most successful swaps.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCanConnect(true)}
                className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                  canConnect === true
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
              >
                {canConnect === true && <CheckCircle2 size={18} />}
                Yes
              </button>
              <button
                onClick={() => setCanConnect(false)}
                className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                  canConnect === false
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
              >
                {canConnect === false && <CheckCircle2 size={18} />}
                No
              </button>
            </div>

            <div className=" bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
              <PhoneCall className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-amber-800 text-xs leading-relaxed">
                <strong>Note:</strong> You will be called by interested applicants to perform the task of connecting them to your landlord or property manager.
              </p>
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {/* <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">2</div> */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  Do you have your caretaker (property manager) or Landlord contact details?
                </h3>
                <p className="text-slate-500 mt-2 text-sm">
                  Having this contact is very important for our recommendation engine to prioritize your request.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setHasContact(true)}
                className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                  hasContact === true
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
              >
                {hasContact === true && <CheckCircle2 size={18} />}
                Yes, I have it
              </button>
              <button
                onClick={() => setHasContact(false)}
                className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                  hasContact === false
                    ? 'border-slate-400 bg-slate-50 text-slate-600'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
              >
                {hasContact === false && <CheckCircle2 size={18} />}
                No, not yet
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-medium animate-pulse">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            onClick={handleComplete}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Continue to Swap Engine
          </button>

          <div className="flex items-center gap-2 justify-center text-slate-400 text-xs">
            <Info size={14} />
            <span>Your answers help us find the perfect match for your relocation.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
