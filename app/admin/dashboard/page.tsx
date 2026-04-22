"use client"

import React, { useEffect, useState } from "react"
import {
  Users,
  Home,
  AlertCircle,
  CreditCard,
  MoreVertical,
  Activity,
  CheckCircle2
} from "lucide-react"

import { AdminApiClient } from "@/shared/utils/AdminApiClient"

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  
  // API State
  const [isLoading, setIsLoading] = useState(true)
  const [statsData, setStatsData] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  const fetchDashboardData = async () => {

    console.log(localStorage.getItem("ADMIN_JWT_TOKEN"))
    try {
      const [statsRes, activityRes] = await Promise.all([
        AdminApiClient.stats.getOverview(),
        AdminApiClient.activity.getLogs({ limit: 5 })
      ])

      if (statsRes.status === 200 && statsRes.data) {
        console.log(statsRes.data.data)
   setStatsData([
  { label: "Total Users", value: statsRes.data.data.totalUsers ?? "0", change: "+0%", trend: "up", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Active Listings", value: statsRes.data.data.activeListings ?? "0", change: "+0%", trend: "up", icon: Home, color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { label: "Total Listings", value: statsRes.data.data.totalListings ?? "0", change: "+0%", trend: "up", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Pending Verifications", value: statsRes.data.data.pendingVerifications ?? "0", change: "0%", trend: "down", icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-400/10" },
])
      }

      if (activityRes.status === 200 && activityRes.data) {
        setActivityLogs(activityRes.data.data || activityRes.data)
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  if (!mounted) return null

  return (
    <div className="p-6 md:p-8">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-poppins-bold text-white mb-1">
            Welcome back, Admin
          </h2>
          <p className="text-sm font-poppins-regular text-slate-400">
            Here&apos;s what&apos;s happening on TenantSwap today.
          </p>
        </div>
        <button className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-poppins-semibold transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
          Generate Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-32 animate-pulse" />
          ))
        ) : (
          statsData.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500`} />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5`}>
                  <stat.icon size={20} />
                </div>
                <span className={`text-[11px] font-poppins-bold px-2 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-slate-400 text-xs font-poppins-medium uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-poppins-bold text-white tracking-tight">
                  {stat.value}
                </h3>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Area (Placeholder) */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-poppins-semibold text-white">Revenue Overview</h3>
            <button className="text-slate-400 hover:text-white transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
          
          <div className="h-64 w-full flex items-end gap-2 justify-between">
            {/* Mock Chart Bars */}
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <div key={i} className="w-full bg-slate-800/50 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500/80 to-teal-400/80 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[11px] text-slate-500 font-poppins-medium uppercase">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-poppins-semibold text-white">Recent Activity</h3>
          </div>
          
          <div className="flex-1 space-y-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-slate-800 rounded" />
                    <div className="h-2 w-1/2 bg-slate-800/50 rounded" />
                  </div>
                </div>
              ))
            ) : activityLogs.length > 0 ? (
              activityLogs.map((activity, idx) => (
                <div key={activity.id || idx} className="flex gap-4">
                  <div className="mt-1">
                    {activity.status === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
                    {activity.status === "warning" && <AlertCircle size={16} className="text-amber-400" />}
                    {activity.status === "danger" && <AlertCircle size={16} className="text-rose-400" />}
                    {(!activity.status || activity.status === "info") && <Activity size={16} className="text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-poppins-medium text-slate-200">
                      {activity.action || activity.description || "System action logged"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-poppins-bold text-slate-500">{activity.user || "System"}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <span className="text-[11px] text-slate-500">{activity.time || new Date(activity.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 font-poppins-medium">No recent activity found.</p>
            )}
          </div>
          
          <button className="w-full mt-4 py-2 border border-slate-700 rounded-xl text-xs font-poppins-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            View All Logs
          </button>
        </div>

      </div>
    </div>
  )

}
