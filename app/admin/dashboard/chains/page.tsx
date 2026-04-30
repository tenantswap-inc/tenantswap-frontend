"use client"

import React, { useEffect, useState } from "react"
import { Link2, Search, Zap, Trash2, RotateCw } from "lucide-react"
import { AdminApiClient, BreakChainReason } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function ChainsManagementPage() {
  const [chains, setChains] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [alertMsg, setAlertMsg] = useState<string>("")
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [actionChainId, setActionChainId] = useState<string | null>(null)

  useEffect(() => {
    fetchChains()
  }, [])

  const fetchChains = async () => {
    setIsLoading(true)
    try {
      const res = await AdminApiClient.chains.list({ limit: 50 })
      if (res.status === 200 && res.data) {
        const raw = res.data;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setChains(Array.isArray(items) ? items : []);
      }
    } catch (e) {
      setAlertMsg("Failed to load chains.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBreakChain = async (chainId: string) => {
    const reasonPrompt = window.prompt("Reason for broken chain (ADMIN_FORCE | NO_SHOW | CONFLICT | UNKNOWN):", "ADMIN_FORCE")
    if (!reasonPrompt) return
    const offender = window.prompt("Offender User ID (optional):", "")

    try {
      await AdminApiClient.chains.breakChain(chainId, {
        reason: (reasonPrompt.toUpperCase() || "ADMIN_FORCE") as BreakChainReason,
        offenderUserId: offender || "system"
      })
      setSuccessMsg("Chain broken successfully.")
      setActionChainId(null)
      fetchChains()
    } catch (e) {
      setAlertMsg("Failed to break chain.")
    }
  }

  const handleRerun = async (chainId: string) => {
    try {
      await AdminApiClient.chains.rerunMatching(chainId)
      setSuccessMsg("Chain matching rerun queued.")
      setActionChainId(null)
    } catch (e) {
      setAlertMsg("Rerun failed.")
    }
  }

  const handleExpireOverdue = async () => {
    try {
      await AdminApiClient.chains.expireOverdue()
      setSuccessMsg("Overdue chains expired.")
      fetchChains()
    } catch (e) {
      setAlertMsg("Expire action failed.")
    }
  }


  return (
    <div className="p-6 md:p-8 bg-[#0A0F1C] min-h-screen text-slate-200">
      <Toasts alertMsg={alertMsg} successMsg={successMsg} onCloseAlert={() => setAlertMsg("")} onCloseSuccess={() => setSuccessMsg("")} />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-poppins-bold text-white mb-1 flex items-center gap-2">
            <Link2 size={24} className="text-violet-400" /> Chains Management
          </h1>
          <p className="text-sm text-slate-400 font-poppins-medium">Monitor matching loops and break problematic chains.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleExpireOverdue} className="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-poppins-semibold transition text-slate-300">
            Expire Overdue
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search loops..." className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 outline-none w-56" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900/80 text-slate-400 font-poppins-semibold text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Chain ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Participants</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500 font-poppins-medium">Loading matching chains...</td></tr>
            ) : chains.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500 font-poppins-medium">No active chains mapped.</td></tr>
            ) : (
              chains.map((chain: any) => (
                <tr key={chain.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-indigo-300">{chain.id?.slice(0, 8)}...</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-poppins-bold px-2 py-1 rounded-md ${
                      chain.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                      chain.status === 'BROKEN' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {chain.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-poppins-semibold text-slate-200">
                    {chain._count?.members || chain.cycleSize || 0} Members
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(chain.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleRerun(chain.id)} title="Rerun Matching" className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-md transition">
                         <RotateCw size={16} />
                       </button>
                       <button onClick={() => handleBreakChain(chain.id)} title="Break Chain" className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-md transition">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
