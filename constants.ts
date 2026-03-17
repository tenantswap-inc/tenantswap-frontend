import { PropertyType, Location, Timeline } from "@/shared/types";

export const PROPERTY_TYPES: PropertyType[] = [
  "Self-Contain",
  "1BR Flat",
  "2BR Flat",
  "3BR Flat",
  "4BR Duplex",
];

export const TIMELINES: Timeline[] = [
  "Immediate",
  "Within 1 Month",
  "1-3 Months",
  "Flexible",
];

export const FEATURES = [
  "Electricity",
  "Water",
  "Fenced",
  "PoP",
  "Gates",
  "Wardrobe",
  "Cupboards",
  "Landlord off site",
  "Tiles",
  "Garden",
  "Water Heater",
  "Furnished",
];

// ─── Locations ────────────────────────────────────────────────────────────────

export const LOCATIONS: Location[] = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT Abuja',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

export const CITIES_BY_STATE: Record<Location, string[]> = {
  "No Option": [],
  'Abia': [
    'Aba', 'Umuahia', 'Ohafia', 'Arochukwu', 'Bende',
    'Isuikwuato', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West',
  ],
  'Adamawa': [
    'Yola', 'Mubi', 'Jimeta', 'Numan', 'Michika',
    'Ganye', 'Hong', 'Gombi', 'Toungo', 'Mayo-Belwa',
  ],
  'Akwa Ibom': [
    'Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak',
    'Etinan', 'Ikot Abasi', 'Itu', 'Nsit Ubium', 'Ibeno',
  ],
  'Anambra': [
    'Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Agulu',
    'Ogidi', 'Ihiala', 'Obosi', 'Aguata', 'Ozubulu',
  ],
  'Bauchi': [
    'Bauchi', 'Azare', 'Misau', 'Katagum', 'Jamaare',
    'Dass', 'Tafawa Balewa', 'Gombe', 'Ningi', 'Alkaleri',
  ],
  'Bayelsa': [
    'Yenagoa', 'Ogbia', 'Brass', 'Nembe', 'Sagbama',
    'Ekeremor', 'Kolokuma', 'Opokuma', 'Southern Ijaw', 'Ukpeliede',
  ],
  'Benue': [
    'Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya',
    'Ado', 'Oju', 'Ogoja', 'Oturkpo', 'Kwande',
  ],
  'Borno': [
    'Maiduguri', 'Biu', 'Dikwa', 'Gwoza', 'Bama',
    'Konduga', 'Monguno', 'Chibok', 'Damboa', 'Kukawa',
  ],
  'Cross River': [
    'Calabar', 'Ikom', 'Ogoja', 'Obudu', 'Bekwara',
    'Akamkpa', 'Yala', 'Obubra', 'Biase', 'Odukpani',
  ],
  'Delta': [
    'Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor',
    'Effurun', 'Ozoro', 'Kwale', 'Oleh', 'Abraka',
  ],
  'Ebonyi': [
    'Abakaliki', 'Afikpo', 'Onueke', 'Ezza', 'Ikwo',
    'Ishielu', 'Ohaozara', 'Onicha', 'Ivo', 'Ohaukwu',
  ],
  'Edo': [
    'Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Igarra',
    'Sabongida-Ora', 'Ubiaja', 'Afuze', 'Igueben', 'Irrua',
  ],
  'Ekiti': [
    'Ado Ekiti', 'Ikere', 'Oye', 'Ikole', 'Efon',
    'Ise/Orun', 'Ilejemeje', 'Irepodun/Ifelodun', 'Moba', 'Gbonyin',
  ],
  'Enugu': [
    'Enugu', 'Nsukka', 'Agbani', 'Awgu', 'Oji River',
    'Udi', 'Igbo-Eze North', 'Igbo-Eze South', 'Ezeagu', 'Nkanu West',
  ],
  'FCT Abuja': [
    'Abuja', 'Garki', 'Wuse', 'Maitama', 'Asokoro',
    'Gwarinpa', 'Kubwa', 'Kuje', 'Bwari', 'Gwagwalada',
    'Lugbe', 'Nyanya', 'Karu', 'Zuba', 'Jabi',
    'Utako', 'Gudu', 'Katampe', 'Lifecamp', 'Lokogoma',
  ],
  'Gombe': [
    'Gombe', 'Kaltungo', 'Billiri', 'Dukku', 'Nafada',
    'Funakaye', 'Kwami', 'Balanga', 'Shomgom', 'Yamaltu',
  ],
  'Imo': [
    'Owerri', 'Orlu', 'Okigwe', 'Mbaise', 'Oguta',
    'Nkwerre', 'Oru East', 'Oru West', 'Njaba', 'Ideato North',
  ],
  'Jigawa': [
    'Dutse', 'Hadejia', 'Gumel', 'Kazaure', 'Ringim',
    'Birnin Kudu', 'Kaugama', 'Maigatari', 'Garki', 'Gwaram',
  ],
  'Kaduna': [
    'Kaduna', 'Zaria', 'Kafanchan', 'Soba', 'Lere',
    'Ikara', 'Kaura', 'Kauru', 'Makarfi', 'Birnin Gwari',
    'Rigachikun', 'Sabon Gari', 'Chikun', 'Igabi', 'Jema\'a',
  ],
  'Kano': [
    'Kano', 'Wudil', 'Gaya', 'Bichi', 'Rano',
    'Wawan Kurmi', 'Ungogo', 'Tarauni', 'Nasarawa', 'Fagge',
    'Dala', 'Gwale', 'Kumbotso', 'Tudun Wada', 'Garko',
  ],
  'Katsina': [
    'Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Kankia',
    'Mashi', 'Jibia', 'Dutsin-Ma', 'Batagarawa', 'Bindawa',
  ],
  'Kebbi': [
    'Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Koko',
    'Yelwa', 'Bagudo', 'Bunza', 'Jega', 'Maiyama',
  ],
  'Kogi': [
    'Lokoja', 'Okene', 'Kabba', 'Idah', 'Anyigba',
    'Ogaminana', 'Ajaokuta', 'Ankpa', 'Ofu', 'Olamaboro',
  ],
  'Kwara': [
    'Ilorin', 'Offa', 'Omu-Aran', 'Lafiagi', 'Kaiama',
    'Patigi', 'Share', 'Jebba', 'Oro', 'Erin-Ile',
  ],
  'Lagos': [
    'Ikeja', 'Lagos Island', 'Victoria Island', 'Lekki', 'Ajah',
    'Surulere', 'Yaba', 'Mushin', 'Agege', 'Alimosho',
    'Badagry', 'Epe', 'Ikorodu', 'Kosofe', 'Ojo',
    'Amuwo-Odofin', 'Apapa', 'Eti-Osa', 'Lagos Mainland', 'Somolu',
    'Ibeju-Lekki', 'Ifako-Ijaiye', 'Shomolu', 'Maryland', 'Gbagada',
    'Magodo', 'Ojodu', 'Ojota', 'Sangotedo', 'Igando',
  ],
  'Nasarawa': [
    'Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Doma',
    'Obi', 'Awe', 'Wamba', 'Toto', 'Keana',
  ],
  'Niger': [
    'Minna', 'Bida', 'Suleja', 'Kontagora', 'Lapai',
    'Agaie', 'Mokwa', 'Rijau', 'Gwadabawa', 'Borgu',
  ],
  'Ogun': [
    'Abeokuta', 'Sagamu', 'Ijebu-Ode', 'Ilaro', 'Ota',
    'Ifo', 'Ayetoro', 'Owode', 'Ewekoro', 'Imeko',
    'Obafemi', 'Odogbolu', 'Remo North', 'Ipokia', 'Yewa North',
  ],
  'Ondo': [
    'Akure', 'Ondo City', 'Owo', 'Ikare', 'Ore',
    'Idanre', 'Ifon', 'Okitipupa', 'Ilaje', 'Odigbo',
  ],
  'Osun': [
    'Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo',
    'Ikirun', 'Inisa', 'Ejigbo', 'Ipetu-Ijesa', 'Iree',
  ],
  'Oyo': [
    'Ibadan', 'Ogbomosho', 'Oyo', 'Iseyin', 'Saki',
    'Igbo-Ora', 'Eruwa', 'Fiditi', 'Lanlate', 'Kishi',
    'Moniya', 'Ojoo', 'Oluyole', 'Egbeda', 'Akinyele',
  ],
  'Plateau': [
    'Jos', 'Bukuru', 'Shendam', 'Pankshin', 'Langtang',
    'Wase', 'Mangu', 'Barikin Ladi', 'Riyom', 'Kanke',
  ],
  'Rivers': [
    'Port Harcourt', 'Obio-Akpor', 'Bonny', 'Degema', 'Eleme',
    'Ikwerre', 'Khana', 'Oyigbo', 'Omuma', 'Ogu-Bolo',
    'GRA Phase 1', 'GRA Phase 2', 'GRA Phase 3', 'Trans Amadi', 'Rumuola',
    'Rumuola', 'Rumuigbo', 'Rumuokoro', 'Woji', 'Rukpokwu',
    'Eneka', 'Rumuodara', 'Ozuoba', 'Nkpolu', 'Choba',
  ],
  'Sokoto': [
    'Sokoto', 'Tambuwal', 'Wurno', 'Illela', 'Gwadabawa',
    'Yabo', 'Rabah', 'Bodinga', 'Dange-Shuni', 'Goronyo',
  ],
  'Taraba': [
    'Jalingo', 'Wukari', 'Bali', 'Gashaka', 'Karim Lamido',
    'Takum', 'Ussa', 'Zing', 'Donga', 'Sardauna',
  ],
  'Yobe': [
    'Damaturu', 'Potiskum', 'Nguru', 'Gashua', 'Geidam',
    'Machina', 'Nangere', 'Yunusari', 'Bade', 'Fika',
  ],
  'Zamfara': [
    'Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka', 'Maru',
    'Bungudu', 'Shinkafi', 'Bakura', 'Birnin Magaji', 'Maradun',
  ],
};

// ── helpers ───────────────────────────────────────────────────────────────────

/** Get cities for a given state, returns [] if state not found */
export const getCitiesForState = (state: Location): string[] =>
  CITIES_BY_STATE[state] ?? []

/** Flat list of all cities across all states */
export const ALL_CITIES: string[] = Object.values(CITIES_BY_STATE).flat()