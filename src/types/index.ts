export type UserRole = 'donor' | 'ngo' | 'volunteer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  isVerified?: boolean;
  capacityKg?: number; // For NGOs
  vehicleType?: 'car' | 'van' | 'bicycle' | 'on_foot' | 'two_wheeler' | 'auto'; // For volunteers
  lat?: number;
  lng?: number;
  assignedTasksCount?: number;
  availability?: 'available' | 'on_pickup' | 'offline';
  createdAt?: string;
  updatedAt?: string;
}

export interface IndianCity {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  zoom: number;
  tagline: string;
}

export type FoodCategory =
  | 'prepared_meals'
  | 'bakery'
  | 'produce'
  | 'dairy'
  | 'canned_goods'
  | 'frozen'
  | 'beverages'
  | 'other';

export type StorageCondition = 'ambient' | 'refrigerated' | 'frozen' | 'hot_holding';

export type DonationStatus =
  | 'available'
  | 'requested'
  | 'matched'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface FoodDonation {
  id: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantityKg: number;
  estimatedServings: number;
  donorId: string;
  donorName: string;
  donorOrg?: string;
  donorPhone?: string;
  pickupAddress: string;
  city?: string;
  pinCode?: string;
  isDemoData?: boolean;
  pickupDeadline?: string;
  imageUrl?: string;
  lat: number;
  lng: number;
  storageCondition: StorageCondition;
  preparationTime: string;
  expiryWindow: string;
  allergens: string;
  handlingNotes: string;
  safetyVerificationCompleted: boolean;
  humanVerifierName: string;
  status: DonationStatus;
  requestedByNgoId?: string;
  requestedByNgoName?: string;
  collectionStatus?: 'pending' | 'scheduled' | 'in_transit' | 'collected' | 'distributed';
  collectionTime?: string;
  actualDistributionConfirmed?: boolean;
  beneficiariesServed?: number;
  distributionNotes?: string;
  volunteerId?: string;
  volunteerName?: string;
  aiPriorityScore?: number;
  aiUrgencyLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
  aiPriorityReason?: string;
  aiSummary?: string;
  aiHandlingTips?: string;
  aiNgoMatchExplanation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactLog {
  id: string;
  donationId: string;
  donorId: string;
  ngoId?: string;
  volunteerId?: string;
  kgRescued: number;
  co2AvoidedKg: number;
  mealsProvided: number;
  waterSavedLiters: number;
  completedAt: string;
}

export interface AiMatchResult {
  ngoId: string;
  ngoName: string;
  matchScore: number;
  suitabilityNotes: string;
  recommendedContact?: string;
  estimatedDeliveryTimeMin: number;
  capacityAnalysis?: string;
  distanceKm?: number;
}
