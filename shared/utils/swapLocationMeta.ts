import { CITIES_BY_STATE } from '@/constants';
import type { Location } from '@/shared/types';

export const ALLOWED_SWAP_STATES = ['Lagos', 'Ondo'] as const satisfies readonly Location[];

type AllowedSwapState = (typeof ALLOWED_SWAP_STATES)[number];

export type ParsedSwapLocation = {
  state: Location;
  city: string;
  area: string;
};

const SWAP_AREAS_BY_CITY: Record<AllowedSwapState, Partial<Record<string, string[]>>> = {
  Lagos: {
    'Ikeja': ['Alausa', 'Oregun', 'Adeniyi Jones', 'Computer Village', 'Anifowoshe'],
    'Lagos Island': ['Marina', 'Onikan', 'Campos', 'Ebute Ero', 'Idumota'],
    'Victoria Island': ['Ahmadu Bello Way', 'Adeola Odeku', 'Kofo Abayomi', 'Akin Adesola', 'Eko Atlantic'],
    'Lekki': ['Lekki Phase 1', 'Chevron', 'Osapa London', 'Ikate', 'Jakande'],
    'Ajah': ['Sangotedo', 'Abraham Adesanya', 'Ado Road', 'Badore', 'Langbasa'],
    'Surulere': ['Bode Thomas', 'Adeniran Ogunsanya', 'Aguda', 'Ijesha', 'Ojuelegba'],
    'Yaba': ['Sabo', 'Akoka', 'Tejuosho', 'Jibowu', 'Alagomeji'],
    'Mushin': ['Idi Oro', 'Palm Avenue', 'Ladipo', 'Ilasamaja', 'Olosha'],
    'Agege': ['Dopemu', 'Tabon Tabon', 'Capetown', 'Oko Oba', 'Isale Odo'],
    'Alimosho': ['Egbeda', 'Idimu', 'Ikotun', 'Ayobo', 'Ipaja'],
    'Badagry': ['Topo', 'Ajara', 'Mowo', 'Seme', 'Ibereko'],
    'Epe': ['Epe T-Junction', 'Popo Oba', 'Poka', 'Noforija', 'Eredo'],
    'Ikorodu': ['Agric', 'Igbogbo', 'Ebute', 'Owutu', 'Benson'],
    'Kosofe': ['Ketu', 'Mile 12', 'Ojota', 'Ogudu', 'Alapere'],
    'Ojo': ['Alaba', 'Ijanikin', 'Okokomaiko', 'Trade Fair', 'Iba'],
    'Amuwo-Odofin': ['Festac', 'Satellite Town', 'Mile 2', 'Apple Junction', 'Ago Palace'],
    'Apapa': ['Apapa GRA', 'Ajegunle', 'Wharf', 'Liverpool', 'Marine Beach'],
    'Eti-Osa': ['Ikoyi', 'Ilasan', 'Ajiran', 'Agungi', 'Oniru'],
    'Lagos Mainland': ['Ebute Metta', 'Yaba Tech Area', 'Adekunle', 'Makoko', 'Oyingbo'],
    'Somolu': ['Bariga', 'Bajulaiye', 'Pedro', 'Fadeyi', 'Akoka'],
    'Ibeju-Lekki': ['Awoyaya', 'Lakowe', 'Bogije', 'Abijo', 'Eleko'],
    'Ifako-Ijaiye': ['Ojokoro', 'Abule Egba', 'College Road', 'Ifako', 'Ijaiye'],
    'Shomolu': ['Bajulaiye', 'Onipanu', 'Palmgrove', 'Fola Agoro', 'Pedrol'],
    'Maryland': ['Mende', 'Anthony', 'Ilupeju Bypass', 'Maryland Estate', 'Ikeja Along'],
    'Gbagada': ['New Garage', 'Phase 1', 'Phase 2', 'Atunrase', 'Pedro'],
    'Magodo': ['Shangisha', 'Magodo Phase 1', 'Magodo Phase 2', 'CMD Road', 'Isheri'],
    'Ojodu': ['Berger', 'Grammar School', 'Yakoyo', 'Omole Phase 1', 'Omole Phase 2'],
    'Ojota': ['Motorway', 'Ogudu GRA Edge', 'Ketu Link', 'CMD Road', 'Mile 12 Axis'],
    'Sangotedo': ['Monastery Road', 'Novare Mall Axis', 'Abraham Adesanya Axis', 'Crown Estate', 'Shoprite Axis'],
    'Igando': ['Iyana Era', 'Ikotun Road', 'Pako', 'Lasu-Iba Axis', 'Egbe Road'],
  },
  Ondo: {
    'Akure': ['Alagbaka', 'Ijapo', 'Oda', 'Oba Ile', 'Ijoka'],
    'Ondo City': ['Fagun', 'Yaba', 'Sabo', 'Ayeyemi', 'Loro'],
    'Owo': ['Iyere', 'Isuada', 'Rufus Giwa Axis', 'Ehinogbe', 'Ipele Road'],
    'Ikare': ['Oka Road', 'Arigidi Axis', 'Igbede', 'Oyinmo', 'Okela'],
    'Ore': ['Odigbo Road', 'Sabo', 'Lagos Garage', 'Camp Area', 'Idi Mango'],
    'Idanre': ['Odode', 'Alade', 'Atosin', 'Owena', 'Isalu'],
    'Ifon': ['Oke Afo', 'Igbaka', 'Irese', 'Odoja', 'Ayetoro'],
    'Okitipupa': ['Ayeka', 'Igbotako', 'Erinje', 'Ode Aye', 'Igodan'],
    'Ilaje': ['Igbokoda', 'Mahin', 'Ugbo', 'Ayetoro', 'Etikan'],
    'Odigbo': ['Ore Gate', 'Ajue', 'Oniparaga', 'Kajola', 'Ayesan'],
  },
};

export const getAllowedSwapCities = (state: Location): string[] =>
  state === 'No Option' || !ALLOWED_SWAP_STATES.includes(state as AllowedSwapState)
    ? []
    : CITIES_BY_STATE[state];

export const getSwapAreasForCity = (state: Location, city: string): string[] => {
  if (!city || state === 'No Option' || !ALLOWED_SWAP_STATES.includes(state as AllowedSwapState)) {
    return [];
  }

  const allowedState = state as AllowedSwapState;
  return SWAP_AREAS_BY_CITY[allowedState][city] ?? [];
};

const findStateForCity = (city: string): Location => {
  const normalizedCity = city.trim().toLowerCase();

  for (const state of ALLOWED_SWAP_STATES) {
    if (CITIES_BY_STATE[state].some(option => option.toLowerCase() === normalizedCity)) {
      return state;
    }
  }

  return 'No Option';
};

export const parseStoredSwapLocation = (value: string | null | undefined): ParsedSwapLocation => {
  const raw = value?.trim() ?? '';

  if (!raw) {
    return { state: 'No Option', city: '', area: '' };
  }

  const parts = raw.split(',').map(part => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const maybeState = parts.at(-1) as Location;

    if (ALLOWED_SWAP_STATES.includes(maybeState as AllowedSwapState)) {
      if (parts.length >= 3) {
        return {
          state: maybeState,
          city: parts.at(-2) ?? '',
          area: parts.slice(0, -2).join(', '),
        };
      }

      return {
        state: maybeState,
        city: parts[0] ?? '',
        area: '',
      };
    }
  }

  if (ALLOWED_SWAP_STATES.includes(raw as AllowedSwapState)) {
    return { state: raw as Location, city: '', area: '' };
  }

  const inferredState = findStateForCity(raw);

  if (inferredState !== 'No Option') {
    return { state: inferredState, city: raw, area: '' };
  }

  return { state: 'No Option', city: '', area: '' };
};

export const formatSwapLocation = (state: Location, city: string, area = ''): string => {
  if (area && city) return `${area}, ${city}, ${state}`;
  if (city) return `${city}, ${state}`;
  if (state !== 'No Option') return state;
  return 'Not selected';
};
