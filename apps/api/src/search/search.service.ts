import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "../../prisma/generated/client";
import { DatabaseService } from "../database/database.service";

export interface SearchQuery {
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
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: DatabaseService) {}

  async search(query: SearchQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const apartmentWhere: any = {
      publishedAt: { not: null },
      availabilityStatus: { in: ["AVAILABLE", "COMING_SOON"] },
      building: { moderationStatus: "APPROVED" },
    };

    if (query.minRent !== undefined) apartmentWhere.rentAmount = { ...(apartmentWhere.rentAmount ?? {}), gte: query.minRent };
    if (query.maxRent !== undefined) apartmentWhere.rentAmount = { ...(apartmentWhere.rentAmount ?? {}), lte: query.maxRent };
    if (query.bedrooms !== undefined) apartmentWhere.bedrooms = { gte: query.bedrooms };
    if (query.bathrooms !== undefined) apartmentWhere.bathrooms = { gte: query.bathrooms };
    if (query.verandas !== undefined) apartmentWhere.verandas = { gte: query.verandas };
    if (query.minSqft !== undefined) apartmentWhere.sizeSqft = { gte: query.minSqft };
    if (query.floorNumber !== undefined) apartmentWhere.floor = { floorNumber: query.floorNumber };
    if (query.excludeGround) apartmentWhere.floor = { ...(apartmentWhere.floor ?? {}), floorNumber: { gt: 0 } };

    const buildingFilters: any = {};
    if (query.area) buildingFilters.areaZone = { contains: query.area, mode: "insensitive" };
    if (query.q) {
      buildingFilters.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { areaZone: { contains: query.q, mode: "insensitive" } },
        { addressLine: { contains: query.q, mode: "insensitive" } },
      ];
    }
    if (query.hasElevator) buildingFilters.hasElevator = true;
    if (query.hasParking) buildingFilters.hasParking = true;
    if (query.hasGenerator) buildingFilters.hasGenerator = true;

    apartmentWhere.building = { ...apartmentWhere.building, ...buildingFilters };

    const hasSearchCriteria = Boolean(
      query.q ||
        query.area ||
        query.minRent !== undefined ||
        query.maxRent !== undefined ||
        query.bedrooms !== undefined ||
        query.bathrooms !== undefined ||
        query.verandas !== undefined ||
        query.minSqft !== undefined ||
        query.floorNumber !== undefined ||
        query.excludeGround ||
        query.hasElevator ||
        query.hasParking ||
        query.hasGenerator,
    );

    // Featured properties first (especially after search/filters), then by selected sort.
    const orderBy: Prisma.ApartmentOrderByWithRelationInput[] =
      query.sort === "rent_asc"
        ? [{ building: { isFeatured: "desc" } }, { rentAmount: "asc" }, { createdAt: "desc" }]
        : query.sort === "rent_desc"
          ? [{ building: { isFeatured: "desc" } }, { rentAmount: "desc" }, { createdAt: "desc" }]
          : [{ building: { isFeatured: "desc" } }, { createdAt: "desc" }];

    void hasSearchCriteria; // ordering rule: featured-first always acceptable before/after search

    const [items, total] = await this.prisma.$transaction([
      this.prisma.apartment.findMany({
        where: apartmentWhere,
        skip,
        take: limit,
        orderBy,
        include: {
          floor: { select: { floorNumber: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 5 },
          building: {
            select: {
              id: true,
              name: true,
              slug: true,
              areaZone: true,
              addressLine: true,
              lat: true,
              lng: true,
              hasElevator: true,
              hasParking: true,
              hasGenerator: true,
              hasSecurityGuard: true,
              hasCctv: true,
              images: { where: { isCover: true }, take: 1 },
            },
          },
        },
      }),
      this.prisma.apartment.count({ where: apartmentWhere }),
    ]);

    return {
      items: items.map((apt) => this.toPublicCard(apt)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getListingDetail(apartmentId: string, viewerVerified: boolean) {
    const apt = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: {
        floor: { select: { floorNumber: true } },
        images: { orderBy: { sortOrder: "asc" } },
        building: {
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            owner: { select: { name: true, phone: true, email: true } },
          },
        },
      },
    });

    if (!apt || !apt.publishedAt || apt.building.moderationStatus !== "APPROVED") {
      throw new NotFoundException("Listing not found");
    }

    const { building } = apt;
    const contactPhone = viewerVerified ? (building.contactPhone ?? building.owner.phone) : null;
    const contactEmail = viewerVerified ? building.owner.email : null;

    return {
      id: apt.id,
      unitLabel: apt.unitLabel,
      floorNumber: apt.floor.floorNumber,
      facing: apt.facing,
      sizeSqft: apt.sizeSqft,
      bedrooms: apt.bedrooms,
      attachedBathrooms: apt.attachedBathrooms,
      bathrooms: apt.bathrooms,
      highCommodeCount: apt.highCommodeCount,
      diningRooms: apt.diningRooms,
      drawingRooms: apt.drawingRooms,
      kitchens: apt.kitchens,
      verandas: apt.verandas,
      gasType: apt.gasType,
      utilityBillingType: apt.utilityBillingType,
      preferredTenantTypes: apt.preferredTenantTypes,
      rentAmount: apt.rentAmount,
      serviceCharge: apt.serviceCharge,
      securityDepositAmount: apt.securityDepositAmount,
      depositMonths: apt.depositMonths,
      availabilityStatus: apt.availabilityStatus,
      availableFrom: apt.availableFrom,
      images: apt.images,
      building: {
        id: building.id,
        name: building.name,
        slug: building.slug,
        areaZone: building.areaZone,
        addressLine: building.addressLine,
        lat: building.lat,
        lng: building.lng,
        totalFloors: building.totalFloors,
        hasElevator: building.hasElevator,
        elevatorCount: building.elevatorCount,
        hasParking: building.hasParking,
        parkingType: building.parkingType,
        hasGenerator: building.hasGenerator,
        generatorScope: building.generatorScope,
        hasSecurityGuard: building.hasSecurityGuard,
        hasCctv: building.hasCctv,
        hasIntercom: building.hasIntercom,
        hasRooftop: building.hasRooftop,
        hasSubmersiblePump: building.hasSubmersiblePump,
        images: building.images,
      },
      contact: viewerVerified
        ? { phone: contactPhone, email: contactEmail, name: building.owner.name }
        : null,
      contactGated: !viewerVerified,
    };
  }

  private toPublicCard(apt: any) {
    return {
      id: apt.id,
      unitLabel: apt.unitLabel,
      floorNumber: apt.floor?.floorNumber,
      bedrooms: apt.bedrooms,
      bathrooms: apt.bathrooms,
      verandas: apt.verandas,
      sizeSqft: apt.sizeSqft,
      rentAmount: apt.rentAmount,
      serviceCharge: apt.serviceCharge,
      availabilityStatus: apt.availabilityStatus,
      images: apt.images,
      building: {
        id: apt.building.id,
        name: apt.building.name,
        slug: apt.building.slug,
        areaZone: apt.building.areaZone,
        hasElevator: apt.building.hasElevator,
        hasParking: apt.building.hasParking,
        hasGenerator: apt.building.hasGenerator,
        coverImage: apt.building.images?.[0] ?? null,
      },
    };
  }
}
