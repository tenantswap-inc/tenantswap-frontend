'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image
                src="/assets/TenantSwap Logo Combination monochrome.svg"
                alt="TenantSwap"
                width={140}
                height={36}
                className="brightness-0 invert"
              />
            </div>
            <p className="text-sm font-poppins-regular text-slate-400 leading-relaxed max-w-xs">
              Nigeria's first peer-to-peer apartment swapping platform. Zero agent fees. Built for tenants, by tenants.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {/* TikTok */}
              <a
                href="https://tiktok.com/@tenant_swap"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a
                href="https://wa.me/2349152861281"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-poppins-bold uppercase tracking-widest text-slate-400">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'Browse Vacancies', href: '/vacancies' },
                { label: 'Create a Swap', href: '/engine' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Settings', href: '/settings' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-poppins-regular text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-poppins-bold uppercase tracking-widest text-slate-400">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Terms of Service', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Cookie Policy', href: '#' },
                { label: 'Community Guidelines', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-poppins-regular text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-4">
            <h4 className="text-xs font-poppins-bold uppercase tracking-widest text-slate-400">Customer Support</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:tenantswap@gmail.com"
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                    <Mail size={14} className="text-emerald-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-wider">Email us</p>
                    <p className="text-sm font-poppins-regular text-slate-300 group-hover:text-emerald-400 transition-colors">
                      tenantswap@gmail.com
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="tel:+2349152861281"
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                    <Phone size={14} className="text-emerald-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-wider">Call us</p>
                    <p className="text-sm font-poppins-regular text-slate-300 group-hover:text-emerald-400 transition-colors">
                      +234 915 286 1281
                    </p>
                  </div>
                </a>
              </li>
            </ul>
            <div className="mt-2 rounded-xl bg-emerald-600/10 border border-emerald-600/20 px-4 py-3">
              <p className="text-xs font-poppins-regular text-emerald-400 leading-relaxed">
                Support hours: Mon – Fri, 9am – 6pm WAT
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-poppins-regular text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} TenantSwap Nigeria Ltd. All rights reserved.
          </p>
          <p className="text-xs font-poppins-regular text-slate-600 text-center">
            Built for Tenants, by Tenants &mdash; Zero Agent Fees.
          </p>
        </div>
      </div>
    </footer>
  )
}
