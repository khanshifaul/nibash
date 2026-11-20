import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import type { CreateApartmentDto } from "./dto/create-apartment.dto";
import type {
  CloneApartmentDto,
  UpdateApartmentDto,
  UpdateApartmentStatusDto,
} from "./dto/update-apartment.dto";

@Injectable()
export class ApartmentsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(buildingId: string, ownerId: string, dto: CreateApartmentDto) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) throw new NotFoundException("Building not found");
    if (building.ownerId !== ownerId) throw new ForbiddenException();

    if (dto.floorNumber < 0 || dto.floorNumber > building.totalFloors) {
      throw new BadRequestException(`floorNumber must be between 0 and ${building.totalFloors}`);
    }

    const floor = await this.prisma.floor.upsert({
      where: {
        buildingId_floorNumber: { buildingId, floorNumber: dto.floorNumber },
      },
      update: {},
      create: { buildingId, floorNumber: dto.floorNumber },
    });

    const existing = await this.prisma.apartment.findUnique({
      where: {
        floorId_unitLabel: { floorId: floor.id, unitLabel: dto.unitLabel },
      },
    });
    if (existing) throw new ConflictException("Unit label already exists on this floor");

    const autoPublish =
      dto.publish === false
        ? false
        : dto.publish === true
          ? true
          : dto.availabilityStatus !== "COMING_SOON";
    const apartment = await this.prisma.apartment.create({
      data: {
        buildingId,
        floorId: floor.id,
        unitLabel: dto.unitLabel,
        facing: dto.facing ?? null,
        sizeSqft: dto.sizeSqft ?? null,
        bedrooms: dto.bedrooms ?? 0,
        attachedBathrooms: dto.attachedBathrooms ?? 0,
        bathrooms: dto.bathrooms ?? 0,
        highCommodeCount: dto.highCommodeCount ?? null,
        diningRooms: dto.diningRooms ?? 0,
        drawingRooms: dto.drawingRooms ?? 0,
        kitchens: dto.kitchens ?? 0,
        verandas: dto.verandas ?? 0,
        gasType: (dto.gasType as any) ?? "NONE",
        utilityBillingType: dto.utilityBillingType ?? null,
        preferredTenantTypes: dto.preferredTenantTypes ?? [],
        listingType: (dto.listingType as any) ?? "RENT",
        rentAmount: dto.rentAmount ?? 0,
        salePrice: dto.salePrice ?? null,
        serviceCharge: dto.serviceCharge ?? 0,
        securityDepositAmount: dto.securityDepositAmount ?? 0,
        depositMonths: dto.depositMonths ?? null,
        availabilityStatus: (dto.availabilityStatus as any) ?? "AVAILABLE",
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        publishedAt: autoPublish ? new Date() : null,
      },
      include: {
        floor: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    return apartment;
  }

  async findOneForOwner(id: string, ownerId: string) {
    const apt = await this.prisma.apartment.findUnique({
      where: { id },
      include: {
        floor: true,
        building: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!apt) throw new NotFoundException("Apartment not found");
    if (apt.building.ownerId !== ownerId) throw new ForbiddenException();
    return apt;
  }

  async update(id: string, ownerId: string, dto: UpdateApartmentDto) {
    const apt = await this.prisma.apartment.findUnique({
      where: { id },
      include: { building: true },
    });
    if (!apt) throw new NotFoundException("Apartment not found");
    if (apt.building.ownerId !== ownerId) throw new ForbiddenException();

    let floorId = apt.floorId;
    if (dto.floorNumber !== undefined && dto.floorNumber !== null) {
      if (dto.floorNumber < 0 || dto.floorNumber > apt.building.totalFloors) {
        throw new BadRequestException(
          `floorNumber must be between 0 and ${apt.building.totalFloors}`,
        );
      }
      const floor = await this.prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId: apt.buildingId,
            floorNumber: dto.floorNumber,
          },
        },
        update: {},
        create: { buildingId: apt.buildingId, floorNumber: dto.floorNumber },
      });
      floorId = floor.id;
    }

    if (dto.unitLabel) {
      const conflict = await this.prisma.apartment.findFirst({
        where: { floorId, unitLabel: dto.unitLabel, id: { not: id } },
      });
      if (conflict) throw new ConflictException("Unit label already exists on this floor");
    }

    return this.prisma.apartment.update({
      where: { id },
      data: {
        floorId,
        ...(dto.unitLabel !== undefined ? { unitLabel: dto.unitLabel } : {}),
        ...(dto.facing !== undefined ? { facing: dto.facing } : {}),
        ...(dto.sizeSqft !== undefined ? { sizeSqft: dto.sizeSqft } : {}),
        ...(dto.bedrooms !== undefined ? { bedrooms: dto.bedrooms } : {}),
        ...(dto.attachedBathrooms !== undefined
          ? { attachedBathrooms: dto.attachedBathrooms }
          : {}),
        ...(dto.bathrooms !== undefined ? { bathrooms: dto.bathrooms } : {}),
        ...(dto.highCommodeCount !== undefined ? { highCommodeCount: dto.highCommodeCount } : {}),
        ...(dto.diningRooms !== undefined ? { diningRooms: dto.diningRooms } : {}),
        ...(dto.drawingRooms !== undefined ? { drawingRooms: dto.drawingRooms } : {}),
        ...(dto.kitchens !== undefined ? { kitchens: dto.kitchens } : {}),
        ...(dto.verandas !== undefined ? { verandas: dto.verandas } : {}),
        ...(dto.gasType !== undefined ? { gasType: dto.gasType as any } : {}),
        ...(dto.utilityBillingType !== undefined
          ? { utilityBillingType: dto.utilityBillingType }
          : {}),
        ...(dto.preferredTenantTypes !== undefined
          ? { preferredTenantTypes: dto.preferredTenantTypes }
          : {}),
        ...(dto.listingType !== undefined ? { listingType: dto.listingType as any } : {}),
        ...(dto.rentAmount !== undefined ? { rentAmount: dto.rentAmount } : {}),
        ...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
        ...(dto.serviceCharge !== undefined ? { serviceCharge: dto.serviceCharge } : {}),
        ...(dto.securityDepositAmount !== undefined
          ? { securityDepositAmount: dto.securityDepositAmount }
          : {}),
        ...(dto.depositMonths !== undefined ? { depositMonths: dto.depositMonths } : {}),
        ...(dto.availabilityStatus !== undefined
          ? { availabilityStatus: dto.availabilityStatus as any }
          : {}),
        ...(dto.availableFrom !== undefined
          ? {
              availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
            }
          : {}),
        ...(dto.publish === true
          ? { publishedAt: new Date() }
          : dto.publish === false
            ? { publishedAt: null }
            : {}),
      },
      include: { floor: true, images: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async updateStatus(id: string, ownerId: string, dto: UpdateApartmentStatusDto) {
    const apt = await this.prisma.apartment.findUnique({
      where: { id },
      include: { building: true },
    });
    if (!apt) throw new NotFoundException("Apartment not found");
    if (apt.building.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.apartment.update({
      where: { id },
      data: { availabilityStatus: dto.availabilityStatus as any },
    });
  }

  async clone(id: string, ownerId: string, dto: CloneApartmentDto) {
    const source = await this.prisma.apartment.findUnique({
      where: { id },
      include: { building: true, floor: true },
    });
    if (!source) throw new NotFoundException("Apartment not found");
    if (source.building.ownerId !== ownerId) throw new ForbiddenException();

    if (dto.floorNumber < 0 || dto.floorNumber > source.building.totalFloors) {
      throw new BadRequestException(
        `floorNumber must be between 0 and ${source.building.totalFloors}`,
      );
    }

    const targetFloor = await this.prisma.floor.upsert({
      where: {
        buildingId_floorNumber: {
          buildingId: source.buildingId,
          floorNumber: dto.floorNumber,
        },
      },
      update: {},
      create: { buildingId: source.buildingId, floorNumber: dto.floorNumber },
    });

    const conflict = await this.prisma.apartment.findUnique({
      where: {
        floorId_unitLabel: {
          floorId: targetFloor.id,
          unitLabel: dto.unitLabel,
        },
      },
    });
    if (conflict) throw new ConflictException("Unit label already exists on target floor");

    return this.prisma.apartment.create({
      data: {
        buildingId: source.buildingId,
        floorId: targetFloor.id,
        unitLabel: dto.unitLabel,
        facing: source.facing,
        sizeSqft: source.sizeSqft,
        bedrooms: source.bedrooms,
        attachedBathrooms: source.attachedBathrooms,
        bathrooms: source.bathrooms,
        highCommodeCount: source.highCommodeCount,
        diningRooms: source.diningRooms,
        drawingRooms: source.drawingRooms,
        kitchens: source.kitchens,
        verandas: source.verandas,
        gasType: source.gasType,
        utilityBillingType: source.utilityBillingType,
        preferredTenantTypes: source.preferredTenantTypes,
        listingType: source.listingType,
        rentAmount: source.rentAmount,
        salePrice: source.salePrice,
        serviceCharge: source.serviceCharge,
        securityDepositAmount: source.securityDepositAmount,
        depositMonths: source.depositMonths,
        availabilityStatus: "AVAILABLE",
        publishedAt: new Date(),
        // images intentionally not copied
      },
      include: { floor: true, images: true },
    });
  }

  async remove(id: string, ownerId: string) {
    const apt = await this.prisma.apartment.findUnique({
      where: { id },
      include: { building: true },
    });
    if (!apt) throw new NotFoundException("Apartment not found");
    if (apt.building.ownerId !== ownerId) throw new ForbiddenException();
    await this.prisma.apartment.delete({ where: { id } });
    return { deleted: true };
  }
}
