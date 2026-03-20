import { MatchCandidate, UserSwapRequest } from "@/shared/types";
import { TrendingUp, ArrowRight, MapPin, BadgeCheck, Phone, UserRound } from "lucide-react";
import React, { useState } from "react";

interface Props {
      match: MatchCandidate;
      relatedRequest?: UserSwapRequest;
      setSelectedMatch: (match: MatchCandidate | null) => void;
}

function formatDate(dateStr: string | null): string {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

function scoreColor(score: number): string {
      if (score >= 80) return 'text-emerald-600';
      if (score >= 50) return 'text-amber-500';
      return 'text-red-400';
}

const REQUEST_STATUS_STYLES: Record<UserSwapRequest['status'], { label: string; className: string }> = {
      REQUESTED: {
            label: 'Pending',
            className: 'border-amber-200 bg-amber-50 text-amber-700',
      },
      CONTACT_APPROVED: {
            label: 'Approved',
            className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      },
      DECLINED: {
            label: 'Declined',
            className: 'border-red-200 bg-red-50 text-red-600',
      },
      RELEASED: {
            label: 'Released',
            className: 'border-sky-200 bg-sky-50 text-sky-700',
      },
      EXPIRED: {
            label: 'Expired',
            className: 'border-slate-200 bg-slate-50 text-slate-500',
      },
      CONFIRMED_RENTER: {
            label: 'Confirmed',
            className: 'border-blue-200 bg-blue-50 text-blue-700',
      },
};

const MatchCard: React.FC<Props> = ({ match, relatedRequest, setSelectedMatch }) => {
      const { targetListing: t, totalScore } = match;
      const [showContact, setShowContact] = useState(false);
      const requestStatus = relatedRequest ? REQUEST_STATUS_STYLES[relatedRequest.status] : null;
      const canViewContact = relatedRequest?.status === 'CONTACT_APPROVED' && !!relatedRequest.owner.phone;

      return (
            <div className="group h-full bg-white border border-slate-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 w-fit">
                              <TrendingUp size={14} className={scoreColor(totalScore)} />
                              <span className={`text-sm font-poppins-bold ${scoreColor(totalScore)}`}>
                                    {totalScore}% match
                              </span>
                        </div>

                        {requestStatus ? (
                              <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-poppins-bold ${requestStatus.className}`}>
                                    {requestStatus.label}
                              </span>
                        ) : (
                              <button
                                    type="button"
                                    onClick={() => setSelectedMatch(match)}
                                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-emerald-700 shadow-sm opacity-0 translate-x-2 pointer-events-none transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-x-0 group-focus-within:pointer-events-auto hover:bg-emerald-50"
                              >
                                    Explore <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                              </button>
                        )}
                  </div>

                  <div className="space-y-2">
                        <p className="font-poppins-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <MapPin size={13} className="text-emerald-500 shrink-0" />
                              <span>{t.currentType} in {t.currentCity}</span>
                        </p>
                        <p className="text-xs text-slate-500 font-poppins-regular">
                              Rent: ₦{t.currentRent.toLocaleString()} / yr
                        </p>
                        {t.currentAvailable && t.currentAvailableOn && (
                              <p className="text-xs text-emerald-600 font-poppins-medium flex items-center gap-1">
                                    <BadgeCheck size={11} className="shrink-0" /> Available {formatDate(t.currentAvailableOn)}
                              </p>
                        )}
                  </div>

                  {canViewContact && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                              <button
                                    type="button"
                                    onClick={() => setShowContact((prev) => !prev)}
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-poppins-bold text-white transition-all hover:bg-emerald-700"
                              >
                                    <Phone size={12} /> {showContact ? 'Hide Contact' : 'View Contact'}
                              </button>

                              {showContact && (
                                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                                          <p className="flex items-center gap-2 font-poppins-medium">
                                                <UserRound size={13} className="text-emerald-600" /> {relatedRequest.owner.fullName}
                                          </p>
                                          <p className="flex items-center gap-2 font-poppins-medium">
                                                <Phone size={13} className="text-emerald-600" /> {relatedRequest.owner.phone}
                                          </p>
                                    </div>
                              )}
                        </div>
                  )}

                  {t.features.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                              <p className="text-[10px] text-slate-400 font-poppins-bold uppercase tracking-widest mb-2">
                                    Features
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                    {t.features.map((f) => (
                                          <span
                                                key={f}
                                                className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md font-poppins-medium"
                                          >
                                                {f}
                                          </span>
                                    ))}
                              </div>
                        </div>
                  )}
            </div>
      );
}

export default MatchCard;
