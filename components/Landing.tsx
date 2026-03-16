"use client"
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, House, ArrowLeftRight, Handshake } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="relative overflow-hidden">

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

        {/* Left: copy */}
        <div className="flex-1 w-full flex flex-col items-center lg:items-start text-center lg:text-left">

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
            We don't like agents,{' '}
            <br className="hidden sm:block" />
            <span className="text-primary-green">just like You.</span>
          </h1>

          {/* Problem box */}
          <div className="w-full max-w-md lg:max-w-none mb-8 text-left bg-red-50 border-l-4 border-red-500 p-5 sm:p-6 rounded-r-2xl shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-red-700 mb-3">The Problem is Real:</h2>
            <ul className="space-y-2 text-slate-700 font-medium text-sm sm:text-base">
              {['They inflate prices.', 'They are rude.', 'They lie to you.'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Join the Movement.</p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 w-full max-w-md lg:max-w-none">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-primary-green/90 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-full text-lg sm:text-xl font-bold hover:bg-primary-green transition-all shadow-xl hover:shadow-primary-green/20 transform hover:-translate-y-1 text-center"
            >
              Start swapping / searching
            </Link>
          </div>

          {/* Badges */}
          <div className="flex items-center justify-center lg:justify-start gap-4 text-slate-500 font-bold tracking-wide uppercase text-xs sm:text-sm mt-5">
            <span>Zero Agent Fees</span>
            <span className="text-slate-300">|</span>
            <span>Zero Inspection Fees</span>
          </div>

          {/* Body copy */}
          <div className="mt-8 text-slate-600 max-w-xl text-base sm:text-lg leading-relaxed space-y-3">
            <p>
              Tenantswap is a house-hunting platform that lets you connect with another tenant
              and communicate safely and securely—without an agent.
            </p>
            <p className="font-medium text-slate-800 italic">
              It's just like one tenant telling another: "There's a vacant space in my compound."
            </p>
          </div>
        </div>

        {/* Right: image */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="relative">
            <Image
              loading="lazy"
              width={2500}
              height={2500}
              src="/landing-display.jpg"
              alt="Beautiful Nigerian Home"
              className="w-full rounded-3xl shadow-2xl border-8 border-white object-cover"
            />
            <div className="absolute -top-5 -right-4 sm:-top-6 sm:-right-6 bg-primary-green text-white p-4 sm:p-6 rounded-2xl shadow-xl transform rotate-3">
              <p className="text-xl sm:text-2xl font-black">100%</p>
              <p className="text-xs font-bold uppercase tracking-wider">Agent Free</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-white py-20 sm:py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-primary-green font-bold uppercase tracking-widest text-xs sm:text-sm mb-3">
              4 Simple Steps
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">How It Works</h2>
          </div>


          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                num: '01',
                icon: <MessageCircle className="w-6 h-6" />,
                title: 'Tell us what you want',
                desc: 'Tell us the kind of apartment you want in detail.',
              },
              {
                num: '02',
                icon: <House className="w-6 h-6" />,
                title: 'List your Vacant Space',
                desc: 'Post your current apartment before your rent is due.',
              },
              {
                num: '03',
                icon: <ArrowLeftRight className="w-6 h-6" />,
                title: 'Match & Swap',
                desc: 'Find and connect with another tenant looking to move out of your dream neighbourhood.',
              },
              {
                num: '04',
                icon: <Handshake className="w-6 h-6" />,
                title: 'Transact Directly',
                desc: 'Inspect and sign with the landlord—cutting out the middleman entirely.',
              },
            ].map(({ num, icon, title, desc }) => (
              <div
                key={num}
                className="relative p-6 sm:p-8 rounded-3xl bg-slate-50 hover:bg-emerald-50 transition-colors group"
              >
                <div className="text-5xl font-black text-slate-200 group-hover:text-primary-green/20 transition-colors absolute top-4 right-6 select-none">
                  {num}
                </div>
                <div className="w-12 h-12 bg-primary-green text-white rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-200">
                  {icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
};