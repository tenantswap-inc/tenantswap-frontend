"use client"

import React, { useEffect, useState } from "react"
import { Send, Search, Megaphone, Target, Loader2 } from "lucide-react"
import { AdminApiClient } from "@/shared/utils/AdminApiClient"
import Toasts from "@/components/Toasts"

export default function PushNotificationsPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [alertMsg, setAlertMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Form
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [target, setTarget] = useState<"ALL_USERS" | "SEEKERS" | "SWAPPERS" | "VERIFIED_USERS">("ALL_USERS")

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setIsLoading(true)
    try {
      const res = await AdminApiClient.pushNotifications.getCampaigns()
      if (res.status === 200 && res.data) {
        const raw = res.data as any;
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.data || []);
        setCampaigns(Array.isArray(items) ? items : []);
      }
    } catch {
      setAlertMsg("Failed to load campaigns.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAndSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !desc) return setAlertMsg("Title and description are required.")
    
    setIsSending(true)
    try {
      const createRes = await AdminApiClient.pushNotifications.create({ title, desc, target })
      if (createRes.status === 200 || createRes.status === 201) {
        const campaignId = (createRes.data as Record<string, unknown>).id as string
        if (campaignId) {
           await AdminApiClient.pushNotifications.sendNow(campaignId)
        }
        setSuccessMsg("Campaign created and pushed to queues successfully.")
        setTitle("")
        setDesc("")
        fetchCampaigns()
      }
    } catch {
      setAlertMsg("Failed to process campaign.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="p-6 md:p-8 bg-[#0A0F1C] min-h-screen text-slate-200">
      <Toasts alertMsg={alertMsg} successMsg={successMsg} onCloseAlert={() => setAlertMsg("")} onCloseSuccess={() => setSuccessMsg("")} />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-poppins-bold text-white mb-1 flex items-center gap-2">
            <Megaphone size={24} className="text-rose-400" /> Announcements
          </h1>
          <p className="text-sm text-slate-400 font-poppins-medium">Create and manage targeted push notifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Campaign */}
        <div className="col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-poppins-bold text-white flex items-center gap-2 mb-6">
            <Send size={18} className="text-slate-400" /> New Broadcast
          </h2>
          <form onSubmit={handleCreateAndSend} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">Target Audience</label>
              <div className="relative">
                <Target size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select 
                  value={target}
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:border-rose-500 appearance-none"
                >
                  <option value="ALL_USERS">All Users</option>
                  <option value="SEEKERS">House Seekers</option>
                  <option value="SWAPPERS">Home Swappers</option>
                  <option value="VERIFIED_USERS">Verified Accounts Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">Notification Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New Feature Alert!" 
                className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm outline-none focus:border-rose-500" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-poppins-bold text-slate-400 uppercase tracking-widest">Message Body</label>
              <textarea 
                rows={4}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Write your push notification message here..." 
                className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm outline-none focus:border-rose-500 resize-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isSending}
              className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-poppins-semibold py-3 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSending ? <><Loader2 size={18} className="animate-spin" /> Pushing Out...</> : <><Send size={18} /> Send Campaign</>}
            </button>
          </form>
        </div>

        {/* Campaign History */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-poppins-bold text-white">Campaign History</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Search..." className="bg-slate-900 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 outline-none w-48" />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/80 text-slate-400 font-poppins-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">Loading history...</td></tr>
                ) : campaigns.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">No campaigns launched yet.</td></tr>
                ) : (
                  campaigns.map(camp => (
                    <tr key={camp.id as string} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-poppins-bold text-white mb-0.5">{(camp.title as string) || "Untitled"}</p>
                        <p className="text-xs text-slate-500 truncate w-48" title={camp.desc as string}>{(camp.desc as string)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 text-slate-300 text-[10px] uppercase font-poppins-bold px-2 py-1 rounded-md">
                          {(camp.target as string) || "ALL"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 text-xs font-poppins-medium">Delivered</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date((camp.createdAt as string) || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
