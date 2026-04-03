'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Home, Bell, Search, ChevronRight, Clock, Share2, Copy } from 'lucide-react';
import GuestLayout from '@/app/GuestLayout';
import { Client } from '@/shared/utils/ApiClient';
import {
  ALLOWED_SWAP_STATES,
  getAllowedSwapCities,
} from '@/shared/utils/swapLocationMeta';
import type { Location } from '@/shared/types';

interface VacancyItem {
  id: string;
  apartmentType: string;
  state: string;
  city: string;
  area: string | null;
  features: string[];
  createdAt: string;
  user: { id: string; fullName: string; profilePhotoUrl: string | null };
}

interface Meta { total: number; page: number; pages: number }

const PROPERTY_TYPES = ['Self-contain', 'Room and Parlour', 'Mini flat', 'One bedroom', 'Two bedroom', 'Three bedroom', 'Duplex', 'Bungalow'];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) {
    return <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover" />;
  }
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-poppins-bold">
      {initials}
    </div>
  );
}

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<Location>('No Option');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cities = useMemo(() => getAllowedSwapCities(stateFilter), [stateFilter]);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '12' };
    if (stateFilter !== 'No Option') params.state = stateFilter;
    if (cityFilter) params.city = cityFilter;
    if (typeFilter) params.apartmentType = typeFilter;

    Client.get('/vacancy', params)
      .then((res) => {
        const body = res.data?.data;
        setVacancies(body?.vacancies ?? []);
        setMeta(body?.meta ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => setVacancies([]))
      .finally(() => setLoading(false));
  }, [page, stateFilter, cityFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleShare = async (vacancy: VacancyItem) => {
    const url = `${window.location.origin}/vacancy/${vacancy.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Vacancy Alert — TenantSwap', url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopiedId(vacancy.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    void Client.post(`/vacancy/${vacancy.id}/share`, {}).catch(() => undefined);
  };

  return (
    <GuestLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-white">
        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-4 pt-14 pb-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-8 left-12 w-32 h-32 rounded-full bg-white blur-2xl" />
            <div className="absolute bottom-4 right-16 w-48 h-48 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-poppins-bold text-white/90 mb-4">
              <Bell size={12} />
              Vacancy Alerts
            </div>
            <h1 className="text-3xl font-poppins-bold text-white leading-tight mb-2">
              Available Apartments
            </h1>
            <p className="text-emerald-100 text-sm font-poppins-regular leading-relaxed">
              Browse apartments with open vacancies shared by current tenants looking to swap.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search size={15} className="text-emerald-600" />
              <span className="text-sm font-poppins-bold text-slate-700">Filter Vacancies</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                value={stateFilter}
                onChange={(e) => { setStateFilter(e.target.value as Location); setCityFilter(''); setPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="No Option">All States</option>
                {ALLOWED_SWAP_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                disabled={stateFilter === 'No Option'}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">All Types</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {meta.total > 0 && (
              <p className="mt-3 text-xs text-slate-400 font-poppins-regular">
                {meta.total} vacanc{meta.total === 1 ? 'y' : 'ies'} found
              </p>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100" />
                    <div className="h-3 bg-slate-100 rounded w-28" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-slate-100 rounded-full w-16" />
                    <div className="h-5 bg-slate-100 rounded-full w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-base font-poppins-bold text-slate-700 mb-1">No vacancies yet</h3>
              <p className="text-sm text-slate-400 font-poppins-regular">
                {stateFilter !== 'No Option' || cityFilter || typeFilter
                  ? 'Try adjusting your filters.'
                  : 'Check back soon — new alerts are posted regularly.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vacancies.map((v) => (
                <div key={v.id} className="group bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
                  {/* Card header */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={v.user.fullName} photo={v.user.profilePhotoUrl} />
                        <span className="text-xs font-poppins-medium text-slate-600 truncate max-w-[120px]">{v.user.fullName}</span>
                      </div>
                      <span className="text-xs text-slate-300 font-poppins-regular flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(v.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-poppins-bold text-slate-800">{v.apartmentType}</h3>
                      <p className="text-xs text-slate-500 font-poppins-regular flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-emerald-500 flex-shrink-0" />
                        {[v.area, v.city, v.state].filter(Boolean).join(', ')}
                      </p>
                    </div>

                    {v.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {v.features.slice(0, 4).map((f) => (
                          <span key={f} className="text-[10px] font-poppins-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                            {f}
                          </span>
                        ))}
                        {v.features.length > 4 && (
                          <span className="text-[10px] font-poppins-medium bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full">
                            +{v.features.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-slate-50 px-5 py-3 flex items-center justify-between">
                    <button
                      onClick={() => handleShare(v)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 font-poppins-medium transition-colors"
                    >
                      {copiedId === v.id ? <><Copy size={12} /> Copied!</> : <><Share2 size={12} /> Share</>}
                    </button>

                    <Link
                      href={`/vacancy/${v.id}`}
                      onClick={() => void Client.post(`/vacancy/${v.id}/click`, {}).catch(() => undefined)}
                      className="flex items-center gap-1 text-xs font-poppins-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      View Details <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-poppins-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all">
                ← Prev
              </button>
              <span className="text-sm text-slate-400">Page {page} of {meta.pages}</span>
              <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-poppins-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </GuestLayout>
  );
}
