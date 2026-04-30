"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  Home,
  Bell,
  Activity,
  ShieldCheck,
  LogOut,
  Flag,
  Phone,
  LayoutDashboard,
  Menu,
  X,
  UserPlus
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useAdminAuth } from "@/shared/hooks/useAdminAuth"
import { AdminAuthGuard } from "@/components/AdminAuthGuard"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Activity Logs", href: "/admin/dashboard/activity", icon: Activity },
    ]
  },
  {
    title: "Operations",
    items: [
      { label: "Chains", href: "/admin/dashboard/chains", icon: Activity },
      { label: "Vacancy Alerts", href: "/admin/dashboard/vacancies", icon: Bell },
    ]
  },
  {
    title: "Management",
    items: [
      { label: "Users", href: "/admin/dashboard/users", icon: Users },
      { label: "Listings", icon: Home, href: "/admin/dashboard/listings" },
      { label: "Staff & Roles", href: "/admin/dashboard/staff", icon: UserPlus },
    ]
  },
  {
    title: "Communication",
    items: [
      { label: "Push Notifications", href: "/admin/dashboard/push", icon: Phone },
    ]
  },
  {
    title: "Trust & Safety",
    items: [
      { label: "Moderation", href: "/admin/dashboard/reports", icon: Flag },
      { label: "Verifications", href: "/admin/dashboard/verifications", icon: ShieldCheck },
    ]
  }
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAdminAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#0A0F1C] text-slate-200 font-poppins-regular selection:bg-emerald-500/30 flex overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A]/80 backdrop-blur-2xl border-r border-slate-800/60
          transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0
          flex flex-col h-screen
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Activity size={18} className="text-emerald-400" />
              </div>
              <span className="font-poppins-bold text-lg text-white tracking-wide">TenantSwap</span>
            </Link>
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <h3 className="text-[10px] font-poppins-bold text-slate-500 uppercase tracking-widest px-3 pb-2">
                  {group.title}
                </h3>
                {group.items.map((item, itemIdx) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm group
                        ${isActive 
                          ? "bg-emerald-500/10 text-emerald-400 font-poppins-semibold shadow-[inset_0_0_12px_rgba(16,185,129,0.05)] border border-emerald-500/20" 
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent"}
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={18} className={isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300 transition-colors"} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="p-4 border-t border-slate-800/60 space-y-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 group"
            >
              <LogOut size={18} className="text-rose-400/60 group-hover:text-rose-400 transition-colors" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Content wrapper */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          
          {/* Mobile Header */}
          <header className="lg:hidden h-16 bg-[#0A0F1C]/80 backdrop-blur-md border-b border-slate-800/60 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg"
              >
                <Menu size={20} />
              </button>
              <span className="font-poppins-bold text-white">TS Admin</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-poppins-bold text-xs text-white border border-emerald-400/30">
              A
            </div>
          </header>

          {/* Main page content - Scrollable */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            {children}
          </main>
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.2);
          }
        `}</style>
      </div>
    </AdminAuthGuard>
  )
}
