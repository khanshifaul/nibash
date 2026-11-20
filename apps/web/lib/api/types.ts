// Generated from API contract (apps/api/src) — matches NestJS response envelopes.
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ---------- Auth ---------- */

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isEmailVerified: boolean;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
};

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type VerifyEmailInput = { token: string };
export type ResendVerificationInput = { email: string };
export type ForgotPasswordInput = { email: string };
export type ResetPasswordInput = { token: string; newPassword: string };
export type UpdateProfileInput = { name?: string; phone?: string };

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
};

/* ---------- Buildings ---------- */

export type ParkingType = "NONE" | "BIKE" | "CAR" | "CAR_AND_BIKE" | "PAID";

export type BuildingImage = {
  id: string;
  buildingId: string;
  storageKey: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

export type Floor = {
  id: string;
  floorNumber: number;
  label: string | null;
  apartments: Apartment[];
};

export type Building = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  areaZone: string;
  roadBlock: string | null;
  addressLine: string | null;
  contactPhone: string | null;
  lat: number;
  lng: number;
  totalFloors: number;
  hasElevator: boolean;
  elevatorCount: number | null;
  hasParking: boolean;
  parkingType: ParkingType;
  hasGenerator: boolean;
  generatorScope: string | null;
  hasSecurityGuard: boolean;
  hasCctv: boolean;
  hasIntercom: boolean;
  hasRooftop: boolean;
  hasSubmersiblePump: boolean;
  moderationStatus: string;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  floors: Floor[];
  images: BuildingImage[];
  owner: { name: string | null; email: string | null; phone: string | null } | null;
};

export type CreateBuildingInput = {
  name: string;
  areaZone: string;
  roadBlock?: string;
  addressLine?: string;
  contactPhone?: string;
  lat: number;
  lng: number;
  totalFloors: number;
  hasElevator?: boolean;
  elevatorCount?: number;
  hasParking?: boolean;
  parkingType?: ParkingType;
  hasGenerator?: boolean;
  generatorScope?: string;
  hasSecurityGuard?: boolean;
  hasCctv?: boolean;
  hasIntercom?: boolean;
  hasRooftop?: boolean;
  hasSubmersiblePump?: boolean;
};

export type UpdateBuildingInput = Partial<CreateBuildingInput>;

/* ---------- Apartments ---------- */

export type ApartmentImage = {
  id: string;
  apartmentId: string;
  storageKey: string;
  url: string;
  roomTag: string;
  sortOrder: number;
};

export type Apartment = {
  id: string;
  buildingId: string;
  floorId: string;
  unitLabel: string;
  facing: string | null;
  sizeSqft: number | null;
  bedrooms: number;
  attachedBathrooms: number;
  bathrooms: number;
  highCommodeCount: number | null;
  diningRooms: number;
  drawingRooms: number;
  kitchens: number;
  verandas: number;
  gasType: string;
  utilityBillingType: string | null;
  preferredTenantTypes: string[];
  rentAmount: number;
  serviceCharge: number;
  securityDepositAmount: number;
  depositMonths: number | null;
  availabilityStatus: string;
  availableFrom: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: ApartmentImage[];
};

export type CreateApartmentInput = {
  floorNumber: number;
  unitLabel: string;
  facing?: string;
  sizeSqft?: number;
  bedrooms?: number;
  attachedBathrooms?: number;
  bathrooms?: number;
  highCommodeCount?: number;
  diningRooms?: number;
  drawingRooms?: number;
  kitchens?: number;
  verandas?: number;
  gasType?: string;
  utilityBillingType?: string;
  preferredTenantTypes?: string[];
  rentAmount: number;
  serviceCharge?: number;
  securityDepositAmount?: number;
  depositMonths?: number;
  availabilityStatus?: string;
  availableFrom?: string;
};

export type UpdateApartmentInput = Partial<CreateApartmentInput> & {
  publish?: boolean;
};

export type UpdateApartmentStatusInput = {
  availabilityStatus: string;
};

export type CloneApartmentInput = {
  floorNumber?: number;
  unitLabel?: string;
  copyAvailability?: boolean;
};

/* ---------- Media ---------- */

export type PresignInput = {
  entity: "BUILDING" | "APARTMENT";
  entityId: string;
  contentType: string;
  fileName: string;
};

export type PresignResult = {
  uploadUrl: string;
  storageKey: string;
  url: string;
};

export type AttachBuildingImageInput = {
  storageKey: string;
  url: string;
  caption?: string;
  sortOrder?: number;
  isCover?: boolean;
};

export type AttachApartmentImageInput = {
  storageKey: string;
  url: string;
  roomTag: string;
  sortOrder?: number;
};

/* ---------- Search ---------- */

export type ListingCard = {
  id: string;
  unitLabel: string;
  floorNumber: number | null;
  bedrooms: number;
  bathrooms: number;
  verandas: number;
  sizeSqft: number | null;
  rentAmount: number;
  serviceCharge: number;
  availabilityStatus: string;
  images: ApartmentImage[];
  building: {
    id: string;
    name: string;
    slug: string;
    areaZone: string;
    hasElevator: boolean;
    hasParking: boolean;
    hasGenerator: boolean;
    coverImage: BuildingImage | null;
  };
};

export type SearchInput = {
  q?: string;
  area?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  verandas?: number;
  minSqft?: number;
  floorNumber?: number;
  excludeGround?: boolean;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGenerator?: boolean;
  page?: number;
  limit?: number;
  sort?: "newest" | "rent_asc" | "rent_desc";
};

export type ListingDetail = {
  id: string;
  unitLabel: string;
  floorNumber: number;
  facing: string | null;
  sizeSqft: number | null;
  bedrooms: number;
  attachedBathrooms: number;
  bathrooms: number;
  highCommodeCount: number | null;
  diningRooms: number;
  drawingRooms: number;
  kitchens: number;
  verandas: number;
  gasType: string;
  utilityBillingType: string | null;
  preferredTenantTypes: string[];
  rentAmount: number;
  serviceCharge: number;
  securityDepositAmount: number;
  depositMonths: number | null;
  availabilityStatus: string;
  availableFrom: string | null;
  images: ApartmentImage[];
  building: {
    id: string;
    name: string;
    slug: string;
    areaZone: string;
    addressLine: string | null;
    lat: number;
    lng: number;
    totalFloors: number;
    hasElevator: boolean;
    elevatorCount: number | null;
    hasParking: boolean;
    parkingType: ParkingType;
    hasGenerator: boolean;
    generatorScope: string | null;
    hasSecurityGuard: boolean;
    hasCctv: boolean;
    hasIntercom: boolean;
    hasRooftop: boolean;
    hasSubmersiblePump: boolean;
    images: BuildingImage[];
  };
  contact: {
    phone: string | null;
    email: string | null;
    name: string | null;
  } | null;
  contactGated: boolean;
};

/* ---------- Inquiries ---------- */

export type Inquiry = {
  id: string;
  apartmentId: string;
  buildingId: string;
  renterId: string | null;
  message: string | null;
  requestedVisitAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  apartment: {
    id: string;
    unitLabel: string;
    floor: { floorNumber: number } | null;
  };
  building: {
    id: string;
    name: string;
    areaZone: string;
  };
  renter: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
};

export type CreateInquiryInput = {
  apartmentId: string;
  message?: string;
  requestedVisitAt?: string;
};

export type UpdateInquiryStatusInput = {
  status: string;
};
