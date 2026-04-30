"use client"

import React, { useEffect, useState } from "react"
import { Users as UsersIcon, Search, MoreVertical, ShieldAlert, CheckCircle2, UserX } from "lucide-react"
import { AdminApiClient } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  
  // Actions states
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [penaltyReason, setPenaltyReason] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await AdminApiClient.users.list({ limit: 50 })
      if (res.status === 200 && res.data) {
        const raw = res.data;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setUsers(Array.isArray(items) ? items : []);
      }
    } catch (e) {
      setAlertMsg("Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyPenalty = async (userId: string) => {
    if (!penaltyReason) return setAlertMsg("Please enter a reason for the penalty.")
    try {
      await AdminApiClient.users.applyPenalty(userId, {
        reason: penaltyReason,
        scorePenalty: 10,
        cooldownHours: 24,
        blockHours: 48,
        metadata: { source: "admin_dashboard" }
      })
      setSuccessMsg("Penalty applied successfully.")
      setActionUserId(null)
      fetchUsers()
    } catch (e) {
      setAlertMsg("Failed to apply penalty.")
    }
  }

  const handleSuspend = async (userId: string) => {
    try {
      await AdminApiClient.users.suspendUser(userId, { hours: 72 })
      setSuccessMsg("User suspended (72h).")
      fetchUsers()
    } catch (e) {
      setAlertMsg("Failed to suspend user.")
    }
  }

  const handleUnblock = async (userId: string) => {
    try {
      await AdminApiClient.users.unblockUser(userId, { reason: "Admin Override" })
      setSuccessMsg("User unblocked.")
      fetchUsers()
    } catch (e) {
      setAlertMsg("Failed to unblock user.")
    }
  }

  return (
    <div className="p-6 md:p-8 bg-[#0A0F1C] min-h-screen text-slate-200">
      <Toasts alertMsg={alertMsg} successMsg={successMsg} onCloseAlert={() => setAlertMsg("")} onCloseSuccess={() => setSuccessMsg("")} />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-poppins-bold text-white mb-1 flex items-center gap-2">
            <UsersIcon size={24} className="text-indigo-400" /> User Management
          </h1>
          <p className="text-sm text-slate-400 font-poppins-medium">View and enforce platform moderation for users.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name or email..." className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 outline-none w-64" />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900/80 text-slate-400 font-poppins-semibold text-xs uppercase">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No users found.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-poppins-bold text-white mb-0.5">{user.fullName || "Unnamed User"}</p>
                    <p className="text-xs text-slate-500">{user.email || user.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-slate-300 text-[10px] uppercase font-poppins-bold px-2 py-1 rounded-md">
                      {user.role || "USER"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.suspended ? (
                      <span className="flex items-center gap-1.5 text-rose-400 text-xs font-poppins-medium"><UserX size={14} /> Suspended</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-poppins-medium"><CheckCircle2 size={14} /> Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{ width: `${user.reliabilityScore || 100}%` }}></div>
                      </div>
                      <span className="text-xs font-poppins-semibold">{user.reliabilityScore || 100}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button onClick={() => setActionUserId(user.id === actionUserId ? null : user.id)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                      <MoreVertical size={16} />
                    </button>
                    {actionUserId === user.id && (
                      <div className="absolute right-10 top-10 bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-2 w-48 z-10">
                        <button onClick={() => handleSuspend(user.id)} className="w-full text-left px-3 py-2 text-xs font-poppins-medium text-amber-400 hover:bg-slate-700 rounded-lg flex items-center gap-2">
                          Suspened User
                        </button>
                        <button onClick={() => {
                          const r = window.prompt("Penalty Reason:")
                          if(r) { setPenaltyReason(r); handleApplyPenalty(user.id) }
                        }} className="w-full text-left px-3 py-2 text-xs font-poppins-medium text-rose-400 hover:bg-slate-700 rounded-lg flex items-center gap-2">
                          <ShieldAlert size={14} /> Apply 10pt Penalty
                        </button>
                        <div className="h-px bg-slate-700 my-1 w-full" />
                        <button onClick={() => handleUnblock(user.id)} className="w-full text-left px-3 py-2 text-xs font-poppins-medium text-emerald-400 hover:bg-slate-700 rounded-lg flex items-center gap-2">
                          Unblock User
                        </button>
                      </div>
                    )}
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
