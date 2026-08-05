export type UserRole = 'passenger' | 'driver' | 'admin';
export type Language = 'en' | 'ur';
export type Theme = 'light' | 'dark' | 'gold' | 'blue' | 'red' | 'green' | 'purple';
export type ServiceType = 'city' | 'long-route' | 'city-to-city' | 'tourism' | 'sharing' | 'outstation' | 'carpool' | 'instant' | 'monthly';

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  email?: string;
  selfieUrl?: string;
  isVerified?: boolean;
  country: string;
  role: UserRole;
  status?: string;
  language: Language;
  theme: Theme;
  ringtone?: string;
  notificationSound?: string;
  urduVoiceMode?: 'formal' | 'casual';
  lowFareAlertEnabled?: boolean;
  createdAt: number;
  walletBalance: number;
  password?: string;
  securityCode?: string;
  fingerprintEnabled?: boolean;
}

export interface DriverProfile extends UserProfile {
  // Documents
  idCardFrontUrl: string;
  idCardBackUrl: string;
  licenseFrontUrl: string;
  licenseBackUrl: string;
  
  // Vehicle
  vehicle?: string;
  vehicleNumber?: string;
  vehicleFrontUrl: string; 
  vehicleBackUrl: string;
  vehicleBookFrontUrl: string;
  vehicleBookBackUrl: string;
  
  selfieUrl: string; // Required for driver
  status: 'pending' | 'approved' | 'rejected';
  acceptedRideId?: string | null;
  seats?: number;
  route?: string;
  vehicleType: VehicleType;
  pendingVehicleType?: VehicleType;
  serviceType: ServiceType;
  driveMode?: 'daily' | 'weekly' | 'free';
  selectedCompany?: 'ProRider' | 'Uber' | 'Careem' | 'InDrive';
  customTarget?: number;
  discountPercentage?: number;
  completedTrips?: number;
  totalEarnings?: number;
  rating?: number;
}

export type VehicleType = 
  | 'bike' 
  | 'rickshaw' 
  | 'mini' 
  | 'sedan' 
  | 'comfortable' 
  | 'premium' 
  | 'seven_seater' 
  | 'seven_seater_ocean' 
  | 'hiace_15' 
  | 'loading_cargo';

export type StatusType = 'text' | 'route' | 'video';

export interface UserStatus {
  id: string;
  userId: string;
  userName: string;
  userRole?: 'passenger' | 'driver' | 'admin';
  userPhone?: string;
  vehicleType?: VehicleType;
  userAvatar?: string;
  type: StatusType;
  text?: string;
  content: string; // URL or text
  mediaUrl?: string;
  vehicleImageUrl?: string;
  timestamp: number;
  likes: number;
  metadata?: {
    seats?: number;
    time?: string;
    route?: string;
    schedule?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    pickupTime?: string;
    dropoffTime?: string;
    carModel?: string;
    returnTime?: string;
  };
}

export type RideStatus = 'pending' | 'driver_offered' | 'passenger_approved' | 'in_status' | 'driver_pending_admin' | 'accepted' | 'arrived' | 'ongoing' | 'completed' | 'cancelled' | 'admin_pending_carpool';

export interface Ride {
  id: string;
  passengerId: string;
  passengerName?: string;
  passengerPhone?: string;
  driverId?: string;
  driverName?: string;
  driverVehicle?: string;
  driverVehicleNumber?: string;
  driverComingFrom?: string;
  driverSelfie?: string;
  driverPhone?: string;
  driverRating?: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  driverCoords?: { lat: number; lng: number };
  status: RideStatus;
  fare: number;
  driverFareOffers?: {
    driverId: string;
    driverName: string;
    driverPhone: string;
    driverVehicle: string;
    driverVehicleNumber?: string;
    driverComingFrom?: string;
    driverSelfie: string;
    driverRating: number;
    fare: number;
    timestamp: number;
  }[];
  startRequestedByDriver?: boolean;
  endRequestedByDriver?: boolean;
  passengerStartConfirmed?: boolean;
  passengerEndConfirmed?: boolean;
  distance: string;
  vehicleType: VehicleType;
  serviceType: ServiceType;
  createdAt: number;
  acceptedAt?: number;
  startedAt?: number;
  pickupTime?: string;
  dropoffTime?: string;
  vehicleName?: string;
  travelDays?: number;
  dailyKm?: number;
  totalMonthlyKm?: number;
  carpoolRightsStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  statusMessage?: string;
  passengerRating?: number;
  passengerComment?: string;
  driverRatingForPassenger?: number;
  driverCommentForPassenger?: string;
  ratedAt?: number;
}

export interface FareEstimate {
  bike: number;
  rickshaw: number;
  mini: number;
  sedan: number;
  comfortable: number;
  premium: number;
  seven_seater: number;
  seven_seater_ocean: number;
  hiace_15: number;
  loading_cargo: number;
  distance: string;
}
