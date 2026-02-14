"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyType, Location, Timeline, SwapRequest, UserState } from '@/shared/types';
import { PROPERTY_TYPES, LOCATIONS, TIMELINES, FEATURES, MOCK_REQUESTS } from '@/constants';
import GuestLayout from '@/app/GuestLayout';

interface DualFormProps {
  currentUser: SwapRequest | null;
}

const DualForm: React.FC<DualFormProps> = ({ currentUser }) => {
  const navigate = useRouter();

    const [db, setDb] = useState<SwapRequest[]>(MOCK_REQUESTS);
      const [userState, setUserState] = useState<UserState>({
        isLoggedIn: false,
        currentUser: null,
      });


  // Looking For state
  const [lookingType, setLookingType] = useState<PropertyType>(currentUser?.lookingFor.type || '2BR Flat');
  const [lookingLoc, setLookingLoc] = useState<Location>(currentUser?.lookingFor.location || 'Lagos');
  const [budget, setBudget] = useState(currentUser?.lookingFor.budget || 0);
  const [timeline, setTimeline] = useState<Timeline>(currentUser?.lookingFor.timeline || 'Immediate');

  // Leaving From state
  const [leavingType, setLeavingType] = useState<PropertyType>(currentUser?.leavingFrom.type || '1BR Flat');
  const [leavingLoc, setLeavingLoc] = useState<Location>(currentUser?.leavingFrom.location || 'Akure');
  const [vacancyDate, setVacancyDate] = useState(currentUser?.leavingFrom.vacancyDate || '');

  // Features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(currentUser?.features || []);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newRequest: SwapRequest = {
      id: currentUser?.id || `user-${Math.random().toString(36).substr(2, 9)}`,
      phoneNumber: currentUser?.phoneNumber || '08000000000', // Mock fallback
      lookingFor: { type: lookingType, location: lookingLoc, budget, timeline },
      leavingFrom: { type: leavingType, location: leavingLoc, vacancyDate },
      features: selectedFeatures
    };
    handleSaveRequest(newRequest);
    navigate.push('/dashboard');
  };

    const handleSaveRequest = (request: SwapRequest) => {
    setDb(prev => {
      const filtered = prev.filter(r => r.id !== request.id);
      return [...filtered, request];
    });
    setUserState(prev => ({ ...prev, currentUser: request }));
  };

  return (
<GuestLayout>
          <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Set Your Swap Engine</h2>
        <p className="text-slate-500">Tell us where you are and where you want to be.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Looking For */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">1</div>
            <h3 className="text-2xl font-bold text-slate-800">Looking For</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Preferred Property Type</label>
              <select
                value={lookingType}
                onChange={e => setLookingType(e.target.value as PropertyType)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center]"
              >
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Desired City/Area</label>
              <select
                value={lookingLoc}
                onChange={e => setLookingLoc(e.target.value as Location)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center]"
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Max Budget (₦ / Yearly)</label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                placeholder="800,000"
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Timeline</label>
              <select
                value={timeline}
                onChange={e => setTimeline(e.target.value as Timeline)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center]"
              >
                {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Leaving From */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold">2</div>
            <h3 className="text-2xl font-bold text-slate-800">Leaving From</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Current Property Type</label>
              <select
                value={leavingType}
                onChange={e => setLeavingType(e.target.value as PropertyType)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none appearance-none bg-no-repeat bg-[right_1rem_center]"
              >
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Current City/Area</label>
              <select
                value={leavingLoc}
                onChange={e => setLeavingLoc(e.target.value as Location)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none appearance-none bg-no-repeat bg-[right_1rem_center]"
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Available On</label>
              <input
                type="date"
                value={vacancyDate}
                onChange={e => setVacancyDate(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="mt-10">
            <label className="block text-sm font-semibold text-slate-600 mb-4">Home Features (Check all that apply)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {FEATURES.map(feat => (
                <label key={feat} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedFeatures.includes(feat) ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' : 'border-slate-200 text-slate-500'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedFeatures.includes(feat)}
                    onChange={() => toggleFeature(feat)}
                  />
                  <i className={`fas ${selectedFeatures.includes(feat) ? 'fa-check-square' : 'fa-square'}`}></i>
                  {feat}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-emerald-600 text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30"
          >
            Find My Swap Chain
          </button>
        </div>
      </form>
    </div>
</GuestLayout>
  );
};

export default DualForm;
