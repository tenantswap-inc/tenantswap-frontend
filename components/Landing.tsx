"use client"
import React from 'react';
import Link from 'next/link';
import { CheckCircle2, FileEdit, Link2, Handshake } from 'lucide-react';
import Image from 'next/image';


export const Landing: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10  flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-5xl lg:text-7xl  text-slate-900 font-poppins-bold leading-tight mb-6">
            Swap your home. <br />
            <span className="text-emerald-600 font-poppins-bold">Skip the agent.</span>
          </h1>
          <p className="text-xl  text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0">
            Tenant-to-Tenant housing marketplace. Find someone who wants your current house and has what you're looking for. Complete your move with zero commissions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/register" className="bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200">
              Start Swapping Now
            </Link>
            <div className="flex items-center gap-3 px-6 py-4 text-slate-500 font-poppins-bold ">
              <CheckCircle2 className="text-emerald-500" size={25} />
              No Registration Fees
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <Image
            loading='lazy'
            width={2500}
            height={2500}
            src="/landing-display.jpg"
            alt="Beautiful Nigerian Home"
            className="rounded-3xl shadow-2xl border-8 border-white object-cover "
          />
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl hidden sm:block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                85%
              </div>
              <div>
                <p className="text-sm font-poppins-bold text-slate-900">Savings on Rent</p>
                <p className="text-xs text-slate-500">Average tenant savings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-poppins-bold text-slate-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-6 mx-auto">
                <FileEdit size={28} />
              </div>
              <h3 className="text-xl font-poppins-bold mb-4">Post Your House</h3>
              <p className="text-slate-500 font-poppins-regular leading-relaxed ">List the house you're leaving and the house you're looking for in any major Nigerian city.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-6 mx-auto">
                <Link2 size={28} />
              </div>
              <h3 className="text-xl font-poppins-bold mb-4">Home Matching</h3>
              <p className="text-slate-500 font-poppins-regular leading-relaxed">Our algorithm finds 2-way, 3-way, or even 4-way swaps to get everyone into their dream home.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-6 mx-auto">
                <Handshake size={28} />
              </div>
              <h3 className="text-xl font-poppins-bold mb-4">Connect Directly</h3>
              <p className="text-slate-500 font-poppins-regular leading-relaxed">Get the phone numbers of potential swappers instantly. No agents, no middle-men.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

