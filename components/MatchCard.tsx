import { MatchCandidate } from "@/shared/types";
import { TrendingUp, ArrowRight, MapPin, BadgeCheck } from "lucide-react";
import React from "react";

interface Props {
      match: MatchCandidate;
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

const MatchCard: React.FC<Props> = ({ match, setSelectedMatch }) => {
      const { targetListing: t, totalScore } = match;

      return (
            <div className="group h-full bg-white border border-slate-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 w-fit">
                              <TrendingUp size={14} className={scoreColor(totalScore)} />
                              <span className={`text-sm font-poppins-bold ${scoreColor(totalScore)}`}>
                                    {totalScore}% match
                              </span>
                        </div>

                        <button
                              type="button"
                              onClick={() => setSelectedMatch(match)}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-poppins-bold text-emerald-700 shadow-sm opacity-0 translate-x-2 pointer-events-none transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-x-0 group-focus-within:pointer-events-auto hover:bg-emerald-50"
                        >
                              Explore <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                        </button>
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