
export type PropertyType = 'No Option'|'2BR Flat' | 'Self-Contain' | '1BR Flat' | '4BR Duplex' | '3BR Flat';
export type Timeline = 'Immediate' | 'Within 1 Month' | '1-3 Months' | 'Flexible' | 'No Option';
export type Location =
"No Option"
  | 'Abia'
  | 'Adamawa'
  | 'Akwa Ibom'
  | 'Anambra'
  | 'Bauchi'
  | 'Bayelsa'
  | 'Benue'
  | 'Borno'
  | 'Cross River'
  | 'Delta'
  | 'Ebonyi'
  | 'Edo'
  | 'Ekiti'
  | 'Enugu'
  | 'FCT Abuja'
  | 'Gombe'
  | 'Imo'
  | 'Jigawa'
  | 'Kaduna'
  | 'Kano'
  | 'Katsina'
  | 'Kebbi'
  | 'Kogi'
  | 'Kwara'
  | 'Lagos'
  | 'Nasarawa'
  | 'Niger'
  | 'Ogun'
  | 'Ondo'
  | 'Osun'
  | 'Oyo'
  | 'Plateau'
  | 'Rivers'
  | 'Sokoto'
  | 'Taraba'
  | 'Yobe'
  | 'Zamfara';

export interface PropertyDetails {
  type: PropertyType;
  location: Location;
}

export interface SwapRequest {
  id: string;
  phoneNumber: string;
  lookingFor: PropertyDetails & { budget: number; timeline: Timeline };
  leavingFrom: PropertyDetails & { vacancyDate: string };
  features: string[];
  canConnectLandlord: boolean,
  hasLandlordContact: boolean,
  onboardingComplete: boolean,
}

export interface MatchChain {
  id: string;
  participants: SwapRequest[];
  isDirect: boolean; // true if 2-way, false if 3+ way
}

export interface User {
  phone: string;
  email?: string;
  password: string
}

export interface UserState {
  isLoggedIn: boolean;
  currentUser: User | null;
}

export interface UnregisteredUser{
  name: string;
  phone: string;
  email: string;
}