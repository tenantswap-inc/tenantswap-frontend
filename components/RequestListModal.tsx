'use client'
import React from 'react'
import { UserSwapRequest } from '@/shared/types'
import RequestsList from '@/components/RequestList'
import { X } from 'lucide-react'

interface RequestListModalProps {
      open: boolean
      onClose: () => void
      requests: UserSwapRequest[]
      totalRequests: number
}

const RequestListModal: React.FC<RequestListModalProps> = ({
      open,
      onClose,
      requests,
      totalRequests,
}) => {
      if (!open) return null

      return (
            <div className="inset-0 fixed z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">

                  {/* Backdrop */}
                  <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                  />

                  {/* Modal */}
                  <div className="relative z-10 bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl
                      max-h-[92dvh] overflow-y-auto flex flex-col
                      animate-in fade-in slide-in-from-bottom-4 duration-200">

                        {/* Header — sticky */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl">
                              <span className="text-sm font-poppins-bold text-slate-700">
                                    Ongoing Requests
                                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-poppins-medium">
                                          {totalRequests}
                                    </span>
                              </span>
                              <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-all"
                              >
                                    <X size={16} className="text-slate-500" />
                              </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4 flex-1 overflow-y-auto">
                              <RequestsList requests={requests} totalRequests={totalRequests} />
                        </div>

                  </div>
            </div>
      )
}

export default RequestListModal