import { SwapRequest, PropertyType, Location, Timeline } from "@/shared/types";

export const PROPERTY_TYPES: PropertyType[] = [
  "Self-Contain",
  "1BR Flat",
  "2BR Flat",
  "4BR Duplex",
];
export const LOCATIONS: Location[] = ["Akure", "Lagos", "Ibadan", "Abuja"];
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
  "Furnished"

];

// Mock data to demonstrate chains:
// User A: Wants Lagos 2BR, Leaves Akure 1BR
// User B: Wants Akure 1BR, Leaves Ibadan Self-Contain
// User C: Wants Ibadan Self-Contain, Leaves Lagos 2BR
// Result: 3-way chain A -> B -> C -> A
export const MOCK_REQUESTS: SwapRequest[] = [
  {
    id: "user-a",
    phoneNumber: "08012345678",
    lookingFor: {
      type: "2BR Flat",
      location: "Lagos",
      budget: 800000,
      timeline: "Immediate",
    },
    leavingFrom: {
      type: "1BR Flat",
      location: "Akure",
      vacancyDate: "2024-06-01",
    },
    features: ["Electricity", "Water", "Tiles"],
  },
  {
    id: "user-a",
    phoneNumber: "07059579655",
    lookingFor: {
      type: "2BR Flat",
      location: "Lagos",
      budget: 800000,
      timeline: "Immediate",
    },
    leavingFrom: {
      type: "1BR Flat",
      location: "Akure",
      vacancyDate: "2024-06-01",
    },
    features: ["Electricity", "Water", "Tiles"],
  },
  {
    id: "user-b",
    phoneNumber: "08122223333",
    lookingFor: {
      type: "1BR Flat",
      location: "Akure",
      budget: 400000,
      timeline: "Within 1 Month",
    },
    leavingFrom: {
      type: "Self-Contain",
      location: "Ibadan",
      vacancyDate: "2024-05-15",
    },
    features: ["Fenced", "Gates", "Water"],
  },
  {
    id: "user-c",
    phoneNumber: "09099998888",
    lookingFor: {
      type: "Self-Contain",
      location: "Ibadan",
      budget: 250000,
      timeline: "Immediate",
    },
    leavingFrom: {
      type: "2BR Flat",
      location: "Lagos",
      vacancyDate: "2024-06-15",
    },
    features: ["PoP", "Wardrobe", "Electricity"],
  },
  {
    id: "user-d", // Direct match with someone else perhaps?
    phoneNumber: "07011110000",
    lookingFor: {
      type: "4BR Duplex",
      location: "Abuja",
      budget: 2500000,
      timeline: "Flexible",
    },
    leavingFrom: {
      type: "2BR Flat",
      location: "Lagos",
      vacancyDate: "2024-07-01",
    },
    features: ["Tiles"],
  },
];
