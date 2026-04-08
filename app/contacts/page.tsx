'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, UserCheck, Lock } from 'lucide-react'
import AuthLayout from '@/app/AuthLayout'
import { Client } from '@/shared/utils/ApiClient'
import { UserSwapRequest, IncomingInterestListing } from '@/shared/types'

const FREE_CONTACT_LIMIT = 2

interface ContactEntry {
  id: string
  kind: 'outgoing' | 'incoming'
  name: string
  phone: string | null
  isLocked: boolean
}

export default function ContactsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<ContactEntry[]>([])
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('JWT_TOKEN')
      if (!token) return

      const [outRes, inRes, meRes] = await Promise.all([
        Client.get('/matching/interests/outgoing', {}, { Authorization: `Bearer ${token}` }),
        Client.get('/matching/interests/incoming', {}, { Authorization: `Bearer ${token}` }),
        Client.get('/users/me', {}, { Authorization: `Bearer ${token}` }),
      ])

      const premium = meRes?.data?.subscriptionStatus === 'ACTIVE'
      setIsPremium(premium)

      const outgoing: UserSwapRequest[] = outRes?.data ?? []
      const incoming: IncomingInterestListing[] = inRes?.data ?? []

      const approvedOutgoing = outgoing.filter((r) => r.status === 'CONTACT_APPROVED')
      const approvedIncoming = incoming.flatMap((il) =>
        il.requests.filter((r) => r.status === 'CONTACT_APPROVED')
      )

      // Combine both lists then apply the 2-contact limit across the whole combined list
      const combined = [
        ...approvedOutgoing.map((r) => ({
          id: r.interestId,
          kind: 'outgoing' as const,
          name: r.owner.fullName,
          phone: r.owner.phone ?? null,
        })),
        ...approvedIncoming.map((r) => ({
          id: r.interestId,
          kind: 'incoming' as const,
          name: r.requester.fullName,
          phone: r.requester.phone ?? null,
        })),
      ]

      const entries: ContactEntry[] = combined.map((c, idx) => ({
        ...c,
        isLocked: !premium && idx >= FREE_CONTACT_LIMIT,
      }))

      setContacts(entries)
      setLoading(false)
    }
    void load()
  }, [])

  return (
    <AuthLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-slate-100 px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-poppins-bold text-slate-800">Approved Contacts</h1>
            {!loading && (
              <p className="text-xs font-poppins-regular text-slate-400">
                {contacts.filter((c) => !c.isLocked).length} contact{contacts.filter((c) => !c.isLocked).length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
        </div>

        <div className="px-4 py-5 space-y-3 max-w-lg mx-auto">
          {loading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
                <UserCheck size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-poppins-bold text-slate-500">No approved contacts yet</p>
              <p className="text-xs font-poppins-regular text-slate-400 mt-1">
                When someone approves your request or you approve theirs, they'll appear here.
              </p>
            </div>
          ) : (
            <>
              {contacts.map((c) =>
                c.isLocked ? (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <Lock size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 font-poppins-bold uppercase tracking-widest">Contact Locked</p>
                      <p className="text-sm font-poppins-bold text-slate-300">•••••••••••</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-amber-500 px-3 py-1.5 text-xs font-poppins-bold text-white whitespace-nowrap">
                      Upgrade
                    </span>
                  </div>
                ) : (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3.5 shadow-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <UserCheck size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-400 font-poppins-bold uppercase tracking-widest">
                        {c.kind === 'outgoing' ? 'Contact Approved' : 'You Approved'}
                      </p>
                      <p className="text-sm font-poppins-bold text-slate-800 truncate">{c.name}</p>
                      {c.phone && (
                        <p className="text-xs font-poppins-regular text-slate-500">{c.phone}</p>
                      )}
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-poppins-bold text-blue-600 transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Phone size={11} /> Call
                      </a>
                    )}
                  </div>
                )
              )}

              {!isPremium && contacts.some((c) => c.isLocked) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center mt-2">
                  <p className="text-xs font-poppins-bold text-amber-700">
                    Upgrade to Premium to unlock all contacts
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
