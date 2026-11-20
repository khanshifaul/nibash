import { api } from "./client";
import type {
  AuthUser,
  Building,
  BuildingImage,
  CloneApartmentInput,
  CreateApartmentInput,
  CreateBuildingInput,
  CreateInquiryInput,
  ListingCard,
  ListingDetail,
  LoginInput,
  Paginated,
  PresignInput,
  PresignResult,
  RegisterInput,
  UpdateApartmentInput,
  UpdateApartmentStatusInput,
  UpdateBuildingInput,
  UpdateInquiryStatusInput,
  UpdateProfileInput,
  VerifyEmailInput,
  Apartment,
  Inquiry,
  ApartmentImage,
} from "./types";

/* ---------- Auth ---------- */

export const authApi = {
  register: (body: RegisterInput) =>
    api.post<{ success: boolean; message: string; data: { user: AuthUser; accessToken: string } }>("/auth/register", body),
  login: (body: LoginInput) =>
    api.post<{ success: boolean; message: string; data: { user: AuthUser; accessToken: string } }>("/auth/login", body),
  verifyEmail: (body: VerifyEmailInput) => api.post("/auth/verify-email", body),
  resendVerification: (body: { email: string }) => api.post("/auth/resend-verification", body),
  forgotPassword: (body: { email: string }) => api.post("/auth/forgot-password", body),
  resetPassword: (body: { token: string; newPassword: string }) =>
    api.post("/auth/reset-password", body),
  refresh: () => api.post<{ accessToken: string }>("/auth/refresh"),
  me: () => api.get<AuthUser>("/auth/me"),
  updateProfile: (body: UpdateProfileInput) =>
    api.patch<AuthUser>("/auth/me", body),
  logout: () => api.post<{ success: boolean }>("/auth/logout"),
};

/* ---------- Buildings ---------- */

export const buildingsApi = {
  create: (body: CreateBuildingInput) => api.post<Building>("/buildings", body),
  findMine: () => api.get<Building[]>("/buildings/mine"),
  findOne: (id: string) => api.get<Building>(`/buildings/${id}`),
  update: (id: string, body: UpdateBuildingInput) => api.patch<Building>(`/buildings/${id}`, body),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/buildings/${id}`),
  findPublic: (idOrSlug: string) => api.get<Building>(`/buildings/public/${idOrSlug}`),
  ensureFloor: (id: string, floorNumber: number) =>
    api.post<{ id: string; floorNumber: number }>(`/buildings/${id}/floors`, { floorNumber }),
};

/* ---------- Apartments ---------- */

export const apartmentsApi = {
  create: (buildingId: string, body: CreateApartmentInput) =>
    api.post<Apartment>(`/buildings/${buildingId}/apartments`, body),
  findOne: (id: string) => api.get<Apartment>(`/apartments/${id}`),
  update: (id: string, body: UpdateApartmentInput) =>
    api.patch<Apartment>(`/apartments/${id}`, body),
  updateStatus: (id: string, body: UpdateApartmentStatusInput) =>
    api.patch<Apartment>(`/apartments/${id}/status`, body),
  clone: (id: string, body: CloneApartmentInput) =>
    api.post<Apartment>(`/apartments/${id}/clone`, body),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/apartments/${id}`),
};

/* ---------- Media ---------- */

export const mediaApi = {
  presign: (body: PresignInput) => api.post<PresignResult>("/media/presign", body),
  attachBuilding: (buildingId: string, body: { storageKey: string; url: string; caption?: string; sortOrder?: number; isCover?: boolean }) =>
    api.post<BuildingImage>(`/buildings/${buildingId}/images`, body),
  attachApartment: (apartmentId: string, body: { storageKey: string; url: string; roomTag: string; sortOrder?: number }) =>
    api.post<ApartmentImage>(`/apartments/${apartmentId}/images`, body),
  deleteBuildingImage: (imageId: string) => api.delete<{ deleted: boolean }>(`/building-images/${imageId}`),
  deleteApartmentImage: (imageId: string) => api.delete<{ deleted: boolean }>(`/apartment-images/${imageId}`),
};

/* ---------- Search ---------- */

export const searchApi = {
  search: (params: {
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
    listingType?: "RENT" | "SALE";
    sort?: "newest" | "rent_asc" | "rent_desc" | "price_asc" | "price_desc";
  }) => {
    const searchParams = new URLSearchParams();
    if (params.q !== undefined) searchParams.set("q", params.q);
    if (params.area !== undefined) searchParams.set("area", params.area);
    if (params.minRent !== undefined) searchParams.set("minRent", String(params.minRent));
    if (params.maxRent !== undefined) searchParams.set("maxRent", String(params.maxRent));
    if (params.bedrooms !== undefined) searchParams.set("bedrooms", String(params.bedrooms));
    if (params.bathrooms !== undefined) searchParams.set("bathrooms", String(params.bathrooms));
    if (params.verandas !== undefined) searchParams.set("verandas", String(params.verandas));
    if (params.minSqft !== undefined) searchParams.set("minSqft", String(params.minSqft));
    if (params.floorNumber !== undefined) searchParams.set("floorNumber", String(params.floorNumber));
    if (params.excludeGround !== undefined) searchParams.set("excludeGround", String(params.excludeGround));
    if (params.hasElevator !== undefined) searchParams.set("hasElevator", String(params.hasElevator));
    if (params.hasParking !== undefined) searchParams.set("hasParking", String(params.hasParking));
    if (params.hasGenerator !== undefined) searchParams.set("hasGenerator", String(params.hasGenerator));
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
    if (params.listingType !== undefined) searchParams.set("listingType", params.listingType);
    if (params.sort !== undefined) searchParams.set("sort", params.sort);
    return api.get<Paginated<ListingCard>>(`/search/listings?${searchParams.toString()}`);
  },
  getListing: (id: string) => api.get<ListingDetail>(`/listings/${id}`),
};

/* ---------- Inquiries ---------- */

export const inquiriesApi = {
  create: (body: CreateInquiryInput) => api.post<Inquiry>("/inquiries", body),
  listForOwner: () => api.get<Inquiry[]>("/inquiries/owner"),
  listForRenter: () => api.get<Inquiry[]>("/inquiries/mine"),
  updateStatus: (id: string, body: UpdateInquiryStatusInput) =>
    api.patch<Inquiry>(`/inquiries/${id}/status`, body),
};
