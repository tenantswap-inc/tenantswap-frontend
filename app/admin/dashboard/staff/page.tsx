"use client"

import React, { useEffect, useState } from "react"
import { 
  UserPlus, 
  Shield, 
  Search, 
  Mail, 
  Lock, 
  Trash2,
  Clock,
  CheckCircle2,
  MoreVertical,
  XCircle,
  Key
} from "lucide-react"
import { AdminApiClient } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function StaffManagementPage() {
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<any[]>([])
  
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await AdminApiClient.staff.list()
      if (res.status === 200 && res.data) {
        const raw = res.data;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setStaff(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
      setAlertMsg("Could not load staff members.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  return (
    <div className="p-6 md:p-8">
      <Toasts
        alertMsg={alertMsg}
        successMsg={successMsg}
        onCloseAlert={() => setAlertMsg("")}
        onCloseSuccess={() => setSuccessMsg("")}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-poppins-bold text-white flex items-center gap-3">
            <Shield className="text-violet-500" size={24} />
            Staff & Role Management
          </h2>
          <p className="text-sm font-poppins-regular text-slate-400 mt-1">
            Manage administrative access, roles, and security permissions.
          </p>
        </div>
        
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-poppins-semibold transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
          <UserPlus size={18} />
          Invite Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Staff List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 h-20 animate-pulse" />
            ))
          ) : staff.length > 0 ? (
            staff.map((member) => (
              <div 
                key={member.id} 
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-violet-500/30 transition-all hover:bg-slate-900"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-poppins-bold">
                    {member.fullName?.charAt(0) || member.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-poppins-bold text-white mb-0.5">{member.fullName || "Admin User"}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Mail size={12} />
                      {member.email}
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <Shield size={12} className="text-violet-500/60" />
                      {member.role || "ADMIN"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    member.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    {member.isActive ? "ACTIVE" : "INACTIVE"}
                  </div>
                  <button className="p-2 text-slate-500 hover:text-white bg-slate-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl py-12 flex flex-col items-center justify-center text-center">
              <Shield size={32} className="text-slate-700 mb-2" />
              <p className="text-slate-500 font-poppins-medium text-sm">No staff members found.</p>
            </div>
          )}
        </div>

        {/* Roles & Permissions Card */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-poppins-bold text-white mb-4 flex items-center gap-2">
              <Key size={18} className="text-amber-400" />
              Roles Overview
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-poppins-bold text-white">SUPER ADMIN</span>
                  <span className="text-[10px] text-slate-500">Full Access</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-violet-500 h-full w-full" />
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl opacity-60">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-poppins-bold text-white">OPERATIONS</span>
                  <span className="text-[10px] text-slate-500">Ops + Support</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-2/3" />
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl opacity-60">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-poppins-bold text-white">FINANCE</span>
                  <span className="text-[10px] text-slate-500">Billing Only</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-1/3" />
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2 border border-slate-700 rounded-xl text-xs font-poppins-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              Manage Role Matrix
            </button>
          </div>
          
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
            <h3 className="font-poppins-bold text-rose-400 mb-2 flex items-center gap-2">
              <Lock size={18} />
              Security Policy
            </h3>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Staff logins are subject to session timeout (24h) and IP allowlisting if configured. Concurrent sessions are monitored.
            </p>
            <button className="text-[11px] font-poppins-bold text-rose-400 hover:underline">
              Review Security Logs &rarr;
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
