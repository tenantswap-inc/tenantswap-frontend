"use client"

import React, { useEffect, useState } from "react"
import { Home, Search, ShieldCheck, XCircle, Trash2 } from "lucide-react"
import { AdminApiClient } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function ListingsManagementPage() {
  const [listings, setListings] = useState<Record<string, unknown>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setIsLoading(true)
    try {
      const res = await AdminApiClient.listings.list({ limit: 50 })
      if (res.status === 200 && res.data) {
        const raw = res.data;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setListings(Array.isArray(items) ? items : []);
      }
    } catch {
      setAlertMsg("Failed to load listings.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (listingId: string, approve: boolean) => {
    try {
      await AdminApiClient.listings.verifyListing(listingId, { approve, reason: approve ? "" : "Admin verification failure" })
      setSuccessMsg(`Listing ${approve ? "approved" : "rejected"} successfully.`)
      fetchListings()
    } catch {
      setAlertMsg("Verification action failed.")
    }
  }

  const handleClose = async (listingId: string) => {
    const reason = window.prompt("Reason for closing listing:")
    if (!reason) return
    try {
      await AdminApiClient.listings.closeListing(listingId, { reason })
      setSuccessMsg("Listing closed.")
      fetchListings()
    } catch {
      setAlertMsg("Failed to close listing.")
    }
  }

  const handleDelete = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return
    try {
      await AdminApiClient.listings.deleteListing(listingId)
      setSuccessMsg("Listing deleted.")
      fetchListings()
    } catch {
      setAlertMsg("Failed to delete listing.")
    }
  }

  return (
    <div className="p-6 md:p-8 bg-[#0A0F1C] min-h-screen text-slate-200">
      <Toasts alertMsg={alertMsg} successMsg={successMsg} onCloseAlert={() => setAlertMsg("")} onCloseSuccess={() => setSuccessMsg("")} />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-poppins-bold text-white mb-1 flex items-center gap-2">
            <Home size={24} className="text-emerald-400" /> Listings Management
          </h1>
          <p className="text-sm text-slate-400 font-poppins-medium">Review, moderate, and manage property listings.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search title or ID..." className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 outline-none w-64" />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900/80 text-slate-400 font-poppins-semibold text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Property</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Listed</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading listings...</td></tr>
            ) : listings.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No active listings found.</td></tr>
            ) : (
              listings.map(item => (
                <tr key={item.id as string} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-poppins-bold text-white mb-0.5">{(item.title as string) || "Untitled Property"}</p>
                    <p className="text-xs text-slate-500 font-mono">{(item.id as string)?.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-poppins-bold px-2 py-1 rounded-md ${
                      item.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                      item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {(item.status as string) || "DRAFT"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-poppins-medium text-slate-300">{(item.ownerName as string) || "N/A"}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{item.createdAt ? new Date(item.createdAt as string).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5 action-btn-group">
                       {item.status === 'PENDING' && (
                         <>
                           <button onClick={() => handleVerify(item.id as string, true)} title="Approve" className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-md transition"><ShieldCheck size={16} /></button>
                           <button onClick={() => handleVerify(item.id as string, false)} title="Reject" className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-md transition"><XCircle size={16} /></button>
                         </>
                       )}
                       <button onClick={() => handleClose(item.id as string)} title="Close Listing" className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-md transition"><XCircle size={16} /></button>
                       <button onClick={() => handleDelete(item.id as string)} title="Delete Listing" className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-md transition"><Trash2 size={16} /></button>
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
