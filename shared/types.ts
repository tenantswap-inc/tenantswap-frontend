
export type PropertyType = 'No Option' | '2BR Flat' | 'Self-Contain' | '1BR Flat' | '4BR Duplex' | '3BR Flat';
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
  allowIncomingCalls: boolean,
  onboardingComplete: boolean,
}

export type ListingInterestStatus = 'REQUESTED' | 'CONTACT_APPROVED' | 'DECLINED' | 'RELEASED' | 'EXPIRED' | 'CONFIRMED_RENTER'

export interface UserSwapRequest {
  interestId: string
  status: ListingInterestStatus
  createdAt: string
  expiresAt: string
  listing: {
    id: string
    status: string
    currentState: string
    currentCity: string
    currentArea: string
    currentType: string
    currentRent: number
  }
  owner: {
    id: string
    fullName: string
    phone: string | null
  }
  requesterListingId: string
}

export interface IncomingInterestRequest {
  interestId: string
  status: ListingInterestStatus
  createdAt: string
  expiresAt: string | null
  requester: {
    userId: string
    fullName: string
    phone: string | null
    listingId: string
  }
}

export interface IncomingInterestListing {
  listingId: string
  listingStatus: string
  currentState: string
  currentCity: string
  currentArea: string | null
  currentType: string
  currentRent: number
  openRequests: number
  requests: IncomingInterestRequest[]
}


export interface MatchChain {
  id: string;
  participants: SwapRequest[];
  isDirect: boolean; // true if 2-way, false if 3+ way
}



export interface UserState {
  isLoggedIn: boolean;
  currentUser: User | null;
}

export interface UnregisteredUser {
  name: string;
  phone: string;
  email: string;
}

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'MATCHED' | 'CLOSED' | 'EXPIRED'

export type ListingCloseReason =
  | 'MATCHED'
  | 'EXPIRED'
  | 'USER_CLOSED'
  | 'ADMIN_CLOSED'
  | 'NO_MATCH_FOUND'

export interface SwapListing {
  id: string
  userId: string
  status: ListingStatus

  // What the user is looking for
  desiredType: string
  desiredState: string
  desiredCity: string
  desiredArea: string | null
  maxBudget: number
  timeline: string

  // What the user is leaving
currentType: string
  currentState: string
  currentCity: string
  currentArea: string | null
  currentRent: number           // ← add
  currentAvailable: boolean     // ← was currentAvailiable (typo fixed)
  currentAvailableOn: string | null  // ← add

  features: string[]

  // Interest-based matching metadata
  matchedInterestId: string | null
  matchedAt: Date | null
  expiresAt: Date | null
  closedAt: Date | null
  closeReason: ListingCloseReason | null
  closedByUserId: string | null

  // Auto search tracking
  autoSearchEnabled: boolean
  lastRecommendationCount: number
  autoSearchLastRunAt: Date | null
  autoSearchMatchedAt: Date | null

  createdAt: Date
}

export interface OAuthUser {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  token: string;
}

export interface TargetListing {
  id: string;
  userId: string;
  status: 'DRAFT' | 'ACTIVE' | 'MATCHED' | 'CLOSED' | 'EXPIRED';
  desiredType: string;
  desiredState: string;
  desiredCity: string;
  desiredArea: string | null;
  maxBudget: number;
  timeline: string;
  currentType: string;
  currentState: string;
  currentCity: string;
  currentArea: string | null;
  currentRent: number;
  currentAvailable: boolean;
  currentAvailableOn: string | null;
  features: string[];
  createdAt: string;
  expiresAt: string | null;
}

export interface MatchCandidate {
  id: string;
  fromListingId: string;
  toListingId: string;
  cityScore: number;
  typeScore: number;
  budgetScore: number;
  timelineScore: number;
  totalScore: number;
  createdAt: string;
  targetListing: TargetListing;
}

export interface VacancyAlert {
  id: string;
  apartmentType: string;
  state: string;
  city: string;
  area: string | null;
  features: string[];
  createdAt?: string;
}

export interface UserSwapListing {
  id: string;
  userId: string;
  status: 'DRAFT' | 'ACTIVE' | 'MATCHED' | 'CLOSED' | 'EXPIRED';
  desiredType: string;
  desiredState: string;
  desiredCity: string;
  desiredArea: string | null;
  maxBudget: number;
  timeline: string;
  currentType: string;
  currentState: string;
  currentCity: string;
  currentArea: string | null;
  currentRent: number;
  currentAvailable: boolean;
  currentAvailableOn: string | null;
  features: string[];
  matchedInterestId: string | null;
  matchedAt: string | null;
  expiresAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  closedByUserId: string | null;
  autoSearchEnabled: boolean;
  lastRecommendationCount: number;
  autoSearchLastRunAt: string | null;
  autoSearchMatchedAt: string | null;
  createdAt: string;
  vacancyAlert?: VacancyAlert | null;
  matchCount: number;
  matches: MatchCandidate[];
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  emailVerifiedAt: string | null;
  role: 'USER' | 'ADMIN';
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  subscriptionExpiresAt: string | null;
  reliabilityScore: number;
  cancellationCount: number;
  noShowCount: number;
  cooldownUntil: string | null;
  blockedUntil: string | null;
  profilePhotoUrl: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  occupation: string | null;
  allowIncomingCalls: boolean;
  oauthProvider: 'GOOGLE' | 'APPLE' | null;
  canConnectLandlord: boolean;
  hasLandlordContact: boolean;
  onboardingComplete: boolean;
  phoneVerifiedAt: string | null;
  createdAt: string;
  listings: UserSwapListing[];
}