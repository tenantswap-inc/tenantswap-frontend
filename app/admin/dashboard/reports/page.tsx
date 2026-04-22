"use client"

import React, { useEffect, useState } from "react"
import { 
  Flag, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  User, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react"
import { AdminApiClient } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "" })
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0 })
  
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await AdminApiClient.reports.list(filters)
      if (res.status === 200 && res.data) {
        const raw = res.data;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setReports(Array.isArray(items) ? items : []);
        
        setStats({
          total: raw.meta?.total || items.length || 0,
          pending: items.filter((r: any) => r.status === "PENDING").length,
          reviewed: items.filter((r: any) => r.status === "REVIEWED" || r.status === "DISMISSED").length,
        })
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      setAlertMsg("Could not load reports. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [filters.page, filters.status])

  const handleReview = async (reportId: string, action: "REVIEWED" | "DISMISSED") => {
    try {
      const res = await AdminApiClient.reports.reviewReport(reportId, { status: action })
      if (res.status === 200) {
        setSuccessMsg(`Report marked as ${action.toLowerCase()}`)
        fetchReports()
      }
    } catch (e) {
      setAlertMsg("Failed to update report status.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "REVIEWED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "DISMISSED": return "bg-slate-500/10 text-slate-500 border-slate-500/20"
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20"
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
            <Flag className="text-rose-500" size={24} />
            User Reports & Moderation
          </h2>
          <p className="text-sm font-poppins-regular text-slate-400 mt-1">
            Review and take action on community reports.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-poppins-bold text-slate-500">Pending</span>
              <span className="text-lg font-poppins-bold text-amber-500">{stats.pending}</span>
            </div>
            <div className="w-px h-8 bg-slate-800 mx-1" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-poppins-bold text-slate-500">Total</span>
              <span className="text-lg font-poppins-bold text-white">{stats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search report ID, reporter email..." 
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilters(f => ({ ...f, status: "" }))}
            className={`px-4 py-2.5 rounded-xl text-xs font-poppins-semibold transition-all border ${
              filters.status === "" ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilters(f => ({ ...f, status: "PENDING" }))}
            className={`px-4 py-2.5 rounded-xl text-xs font-poppins-semibold transition-all border ${
              filters.status === "PENDING" ? "bg-amber-600 text-white border-amber-500" : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilters(f => ({ ...f, status: "REVIEWED" }))}
            className={`px-4 py-2.5 rounded-xl text-xs font-poppins-semibold transition-all border ${
              filters.status === "REVIEWED" ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            Reviewed
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30">
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Reporter / Subject</th>
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Reason / Details</th>
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-left py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="text-right py-4 px-6 text-[11px] font-poppins-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-8 px-6">
                      <div className="h-4 bg-slate-800 rounded w-full opacity-50" />
                    </td>
                  </tr>
                ))
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-indigo-400" />
                          <span className="text-sm font-poppins-semibold text-white">{report.reporter?.fullName || "System"}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">Reporting: {report.subjectId?.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-200 font-poppins-medium truncate">{report.reason}</span>
                        <p className="text-xs text-slate-500 line-clamp-1">{report.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-poppins-bold border ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-xs">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {report.status === "PENDING" && (
                          <>
                            <button 
                              onClick={() => handleReview(report.id, "REVIEWED")}
                              className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                              title="Mark as Resolved"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleReview(report.id, "DISMISSED")}
                              className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                              title="Dismiss Report"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button className="p-2 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-all">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Clock size={32} className="text-slate-700" />
                      <p className="text-slate-500 font-poppins-medium">No reports found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
