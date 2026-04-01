'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert } from '@heroui/alert';
import { CheckSquare, Copy, Loader2, Megaphone, Share2, Square, X } from 'lucide-react';

import { FEATURES, PROPERTY_TYPES } from '@/constants';
import type { Location, PropertyType, UserSwapListing } from '@/shared/types';
import {
  ALLOWED_SWAP_STATES,
  getAllowedSwapCities,
  getSwapAreasForCity,
} from '@/shared/utils/swapLocationMeta';

type VacancyPayload = {
  apartmentType: string;
  state: string;
  city: string;
  area: string | null;
  features: string[];
};

interface VacancyAlertModalProps {
  open: boolean;
  listing: UserSwapListing | null;
  saving: boolean;
  onClose: () => void;
  onSave: (listingId: string, vacancyAlert: VacancyPayload | null) => Promise<void> | void;
}

const baseFieldClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500';

const VacancyAlertModal: React.FC<VacancyAlertModalProps> = ({
  open,
  listing,
  saving,
  onClose,
  onSave,
}) => {
  const [hasVacancy, setHasVacancy] = useState<boolean | null>(null);
  const [apartmentType, setApartmentType] = useState<PropertyType>('No Option');
  const [state, setState] = useState<Location>('No Option');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!listing) {
      return;
    }

    const alert = listing.vacancyAlert;
    setHasVacancy(alert ? true : false);
    setApartmentType((alert?.apartmentType as PropertyType) ?? 'No Option');
    setState((alert?.state as Location) ?? 'No Option');
    setCity(alert?.city ?? '');
    setArea(alert?.area ?? '');
    setFeatures(alert?.features ?? []);
    setErrorMsg('');
  }, [listing]);

  const cities = useMemo(() => getAllowedSwapCities(state), [state]);
  const areas = useMemo(() => getSwapAreasForCity(state, city), [state, city]);

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((item) => item !== feature)
        : [...prev, feature],
    );
  };

  const handleShare = async () => {
    if (!listing?.vacancyAlert) return;
    const vacancyId = listing.vacancyAlert.id;
    const shareUrl = `${window.location.origin}/vacancy/${vacancyId}`;
    const shareText = `Vacancy Available: ${listing.vacancyAlert.apartmentType} in ${listing.vacancyAlert.city}, ${listing.vacancyAlert.state}. Check it out on TenantSwap!`;

    // Record share count (fire and forget)
    void fetch(`${process.env.NEXT_PUBLIC_API_URL}/vacancy/${vacancyId}/share`, { method: 'POST' }).catch(() => undefined);

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vacancy Alert — TenantSwap', text: shareText, url: shareUrl });
      } catch {
        // user cancelled share sheet
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async () => {
    if (!listing) {
      return;
    }

    if (hasVacancy === null) {
      setErrorMsg('Please choose whether there is a vacancy to share.');
      return;
    }

    if (!hasVacancy) {
      await onSave(listing.id, null);
      return;
    }

    if (apartmentType === 'No Option') {
      setErrorMsg('Select the vacancy apartment type.');
      return;
    }

    if (!(ALLOWED_SWAP_STATES as readonly string[]).includes(state)) {
      setErrorMsg('Select the vacancy state.');
      return;
    }

    if (!city || !cities.includes(city)) {
      setErrorMsg('Select a valid vacancy city.');
      return;
    }

    if (areas.length > 0 && (!area || !areas.includes(area))) {
      setErrorMsg('Select a valid vacancy area.');
      return;
    }

    if (features.length === 0) {
      setErrorMsg('Select at least one vacancy feature.');
      return;
    }

    await onSave(listing.id, {
      apartmentType,
      state,
      city,
      area: area || null,
      features,
    });
  };

  return (
    <AnimatePresence>
      {open && listing && (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-[130] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.22)] max-h-[95vh] flex flex-col"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-[11px] font-poppins-bold uppercase tracking-[0.35em] text-emerald-500">
                    Vacancy Alert
                  </p>
                  <h3 className="mt-2 text-2xl font-poppins-bold text-slate-900">
                    {listing.vacancyAlert ? 'Edit Vacancy Alert' : 'Share Vacancy Alert'}
                  </h3>
                  <p className="mt-1 text-sm font-poppins-regular text-slate-500">
                    Share a possible vacancy linked to this listing without editing the full swap details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 p-2 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {errorMsg && (
                  <div className="mb-5">
                    <Alert color="danger" variant="flat" isVisible onClose={() => setErrorMsg('')}>
                      <span className="font-poppins-medium">{errorMsg}</span>
                    </Alert>
                  </div>
                )}

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-poppins-bold text-slate-900">Is there a vacancy?</h4>
                      <p className="text-sm font-poppins-regular text-slate-500">
                        If yes, we will notify users looking for or already living around that location.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setHasVacancy(true)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        hasVacancy === true
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="block text-sm font-poppins-bold">Yes, share vacancy info</span>
                      <span className={`mt-1 block text-xs ${hasVacancy === true ? 'text-emerald-50' : 'text-slate-500'}`}>
                        Apartment type, location and features only.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHasVacancy(false)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        hasVacancy === false
                          ? 'border-slate-800 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-sm font-poppins-bold">No vacancy to share</span>
                      <span className={`mt-1 block text-xs ${hasVacancy === false ? 'text-slate-200' : 'text-slate-500'}`}>
                        Save this listing without an active vacancy alert.
                      </span>
                    </button>
                  </div>
                </div>

                {hasVacancy && (
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-poppins-medium text-slate-600">
                        Apartment Type
                      </label>
                      <select
                        value={apartmentType}
                        onChange={(event) => setApartmentType(event.target.value as PropertyType)}
                        className={baseFieldClass}
                      >
                        <option value="No Option" disabled>
                          Select apartment type…
                        </option>
                        {PROPERTY_TYPES.filter((type) => type !== 'No Option').map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-poppins-medium text-slate-600">
                        State
                      </label>
                      <select
                        value={state}
                        onChange={(event) => {
                          setState(event.target.value as Location);
                          setCity('');
                          setArea('');
                        }}
                        className={baseFieldClass}
                      >
                        <option value="No Option" disabled>
                          Select state…
                        </option>
                        {ALLOWED_SWAP_STATES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-poppins-medium text-slate-600">
                        City
                      </label>
                      <select
                        value={city}
                        onChange={(event) => {
                          setCity(event.target.value);
                          setArea('');
                        }}
                        disabled={state === 'No Option'}
                        className={baseFieldClass}
                      >
                        <option value="" disabled>
                          {state === 'No Option' ? 'Select state first…' : 'Select city…'}
                        </option>
                        {cities.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-poppins-medium text-slate-600">
                        Area / Region
                      </label>
                      <select
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                        disabled={!city || areas.length === 0}
                        className={baseFieldClass}
                      >
                        <option value="" disabled>
                          {!city
                            ? 'Select city first…'
                            : areas.length === 0
                              ? 'No areas configured yet'
                              : 'Select area…'}
                        </option>
                        {areas.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-3 block text-sm font-poppins-medium text-slate-600">
                        Features
                      </label>
                      <div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-3">
                        {FEATURES.map((feature) => (
                          <label
                            key={feature}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all ${
                              features.includes(feature)
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={features.includes(feature)}
                              onChange={() => toggleFeature(feature)}
                            />
                            {features.includes(feature) ? <CheckSquare size={18} /> : <Square size={18} />}
                            <span className={features.includes(feature) ? 'font-poppins-bold' : 'font-poppins-regular'}>
                              {feature}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-poppins-medium text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-60"
                  >
                    Close
                  </button>

                  {listing?.vacancyAlert && (
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-poppins-medium text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {copied ? (
                        <>
                          <Copy size={15} />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <Share2 size={15} />
                          Share Vacancy
                        </>
                      )}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-poppins-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>{hasVacancy ? 'Save Vacancy Alert' : 'Save Selection'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VacancyAlertModal;
