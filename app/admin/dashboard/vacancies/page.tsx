"use client"

import React, { useEffect, useState } from "react"
import { 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar,
  AlertCircle,
  Loader2,
  Filter,
  ArrowUpDown
} from "lucide-react"
import { AdminApiClient } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function VacanciesPage() {
  const [loading, setLoading] = useState(true)
  const [vacancies, setVacancies] = useState<any[]>([])
  
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const fetchVacancies = async () => {
    setLoading(true)
    try {
      const res = await AdminApiClient.vacancies.list()
      if (res.status === 200 && res.data) {
        const raw = res.data;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setVacancies(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error("Failed to fetch vacancies:", error)
      setAlertMsg("Could not load vacancies.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVacancies()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vacancy?")) return
    try {
      const res = await AdminApiClient.vacancies.delete(id)
      if (res.status === 200 || res.status === 204) {
        setSuccessMsg("Vacancy deleted successfully.")
        fetchVacancies()
      }
    } catch (e) {
      setAlertMsg("Failed to delete vacancy.")
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
            <Building2 className="text-emerald-500" size={24} />
            Vacancies Management
          </h2>
          <p className="text-sm font-poppins-regular text-slate-400 mt-1">
            Track and manage available property vacancies across the platform.
          </p>
        </div>
        
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-poppins-semibold transition-all shadow-[0_4px_12px_rgba(79,70,229,0.2)]">
          <Plus size={18} />
          Add New Vacancy
        </button>
      </div>

      {/* Grid of Vacancies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-64 animate-pulse" />
          ))
        ) : vacancies.length > 0 ? (
          vacancies.map((vacancy) => (
            <div 
              key={vacancy.id} 
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 group hover:border-slate-700 transition-all hover:bg-slate-900 shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Building2 size={24} />
                </div>
                <button 
                  onClick={() => handleDelete(vacancy.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-lg font-poppins-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {vacancy.title || "Unnamed Vacancy"}
              </h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <MapPin size={14} className="text-slate-500" />
                  {vacancy.location || vacancy.city || "Unknown Location"}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Calendar size={14} className="text-slate-500" />
                  Added {new Date(vacancy.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-xl font-poppins-bold text-white">
                  ₦{vacancy.price?.toLocaleString() || "0"}
                  <span className="text-[10px] text-slate-500 ml-1 uppercase">/ YEAR</span>
                </span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-poppins-bold ${
                  vacancy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {vacancy.status || "ACTIVE"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
            <Building2 size={48} className="text-slate-700 mb-4" />
            <h4 className="text-lg font-poppins-bold text-slate-500 mb-2">No Vacancies Found</h4>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              You haven&apos;t added any manual vacancies yet. Click the button above to create your first one.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
