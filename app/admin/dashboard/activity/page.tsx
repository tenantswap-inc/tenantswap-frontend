"use client"

import React, { useEffect, useState } from "react"
import {
  Activity,
  Search,
  Calendar,
  User,
  Terminal,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2
} from "lucide-react"
import { AdminApiClient } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function ActivityLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: "" })
  
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await AdminApiClient.activity.getLogs(filters)
      if (res.status === 200 && res.data) {
        const raw = res.data;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setLogs(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      setAlertMsg("Could not load activity logs.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filters.page])

  const getLogIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 size={16} className="text-emerald-400" />
      case "warning": return <AlertTriangle size={16} className="text-amber-400" />
      case "danger": return <AlertTriangle size={16} className="text-rose-400" />
      default: return <Info size={16} className="text-blue-400" />
    }
  }

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
            <Activity className="text-indigo-500" size={24} />
            Platform Activity Logs
          </h2>
          <p className="text-sm font-poppins-regular text-slate-400 mt-1">
            Real-time audit trail of all system and administrative actions.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchLogs()}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            title="Refresh Logs"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-poppins-semibold transition-all">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Terminal size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-poppins-bold text-slate-500 tracking-wider">Storage Status</p>
            <p className="text-sm font-poppins-bold text-white">Active (90 Days)</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Cpu size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-poppins-bold text-slate-500 tracking-wider">Throughput</p>
            <p className="text-sm font-poppins-bold text-white">~45 events/min</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-poppins-bold text-slate-500 tracking-wider">Audit Integrity</p>
            <p className="text-sm font-poppins-bold text-white">Verified</p>
          </div>
        </div>
      </div>
      
      {/* Search & Global Lookup */}

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 relative group">
        <Search className="absolute left-7.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder="Lookup by User ID, Email, Phone, Listing ID, Chain ID..." 
          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Event</th>
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Actor</th>
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Resource ID</th>
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-right py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-6 px-6">
                      <div className="h-4 bg-slate-800 rounded w-full opacity-30" />
                    </td>
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-800/20 transition-colors font-mono">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getLogIcon(log.status)}</div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">{log.action || log.description}</span>
                          <span className="text-[10px] text-slate-500">{log.module || "SYSTEM"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-300">{log.user || "root"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-indigo-400 underline decoration-indigo-400/20 underline-offset-4 cursor-pointer hover:text-indigo-300 transition-colors">
                        {log.resourceId || log.id?.slice(0, 12) || "n/a"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        log.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {log.status?.toUpperCase() || "INFO"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-300">{new Date(log.createdAt || log.time).toLocaleTimeString()}</span>
                        <span className="text-[10px] text-slate-500">{new Date(log.createdAt || log.time).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 px-6 text-center">
                    <p className="text-slate-500 text-sm font-poppins-medium">No activity records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-poppins-medium">Showing {logs.length} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white hover:bg-slate-800">Next</button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  )
}
