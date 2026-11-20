import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import type { CreateBuildingDto } from "./dto/create-building.dto";
import type { UpdateBuildingDto } from "./dto/update-building.dto";

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(ownerId: string, dto: CreateBuildingDto) {
    // Ensure owner has phone (required for listing contact)
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException("User not found");
    if (!owner.phone && !dto.contactPhone) {
      throw new BadRequestException(
        "Phone number is required for listing. Update your profile or provide a contact phone.",
      );
    }

    const slug = await this.generateUniqueSlug(dto.name);
    const building = await this.prisma.building.create({
      data: {
        ownerId,
        name: dto.name,
        slug,
        areaZone: dto.areaZone,
        roadBlock: dto.roadBlock ?? null,
        addressLine: dto.addressLine ?? null,
        contactPhone: dto.contactPhone ?? owner.phone ?? null,
        lat: dto.lat,
        lng: dto.lng,
        totalFloors: dto.totalFloors,
        hasElevator: dto.hasElevator ?? false,
        elevatorCount: dto.elevatorCount ?? null,
        hasParking: dto.hasParking ?? false,
        parkingType: (dto.parkingType as any) ?? "NONE",
        hasGenerator: dto.hasGenerator ?? false,
        generatorScope: dto.generatorScope ?? null,
        hasSecurityGuard: dto.hasSecurityGuard ?? false,
        hasCctv: dto.hasCctv ?? false,
        hasIntercom: dto.hasIntercom ?? false,
        hasRooftop: dto.hasRooftop ?? false,
        hasSubmersiblePump: dto.hasSubmersiblePump ?? false,
        moderationStatus: "APPROVED", // auto-publish per decision
        publishedAt: new Date(),
      },
      include: { images: true, floors: { orderBy: { floorNumber: "asc" } } },
    });
    return building;
  }

  findMine(ownerId: string) {
    return this.prisma.building.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        floors: {
          orderBy: { floorNumber: "asc" },
          include: {
            apartments: {
              include: { images: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
        _count: { select: { floors: true } },
      },
    });
  }

  async findOneForOwner(id: string, ownerId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        floors: {
          orderBy: { floorNumber: "asc" },
          include: {
            apartments: {
              orderBy: { unitLabel: "asc" },
              include: { images: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
      },
    });
    if (!building) throw new NotFoundException("Building not found");
    if (building.ownerId !== ownerId) throw new ForbiddenException();
    return building;
  }

  async findPublic(idOrSlug: string, viewerVerified: boolean) {
    const building = await this.prisma.building.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        moderationStatus: "APPROVED",
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        floors: {
          orderBy: { floorNumber: "asc" },
          include: {
            apartments: {
              where: {
                availabilityStatus: { in: ["AVAILABLE", "COMING_SOON"] },
                publishedAt: { not: null },
              },
              orderBy: { unitLabel: "asc" },
              include: { images: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
        owner: { select: { name: true, email: true, phone: true } },
      },
    });
    if (!building) throw new NotFoundException("Building not found");

    // Gate contact info to logged-in verified users
    const { owner, contactPhone, ...rest } = building;
    return {
      ...rest,
      contactPhone: viewerVerified ? (contactPhone ?? owner.phone) : null,
      owner: viewerVerified ? { name: owner.name } : null,
    };
  }

  async update(id: string, ownerId: string, dto: UpdateBuildingDto) {
    const building = await this.prisma.building.findUnique({ where: { id } });
    if (!building) throw new NotFoundException("Building not found");
    if (building.ownerId !== ownerId) throw new ForbiddenException();

    return this.prisma.building.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.areaZone ? { areaZone: dto.areaZone } : {}),
        ...(dto.roadBlock !== undefined ? { roadBlock: dto.roadBlock } : {}),
        ...(dto.addressLine !== undefined ? { addressLine: dto.addressLine } : {}),
        ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
        ...(dto.lat !== undefined ? { lat: dto.lat } : {}),
        ...(dto.lng !== undefined ? { lng: dto.lng } : {}),
        ...(dto.totalFloors !== undefined ? { totalFloors: dto.totalFloors } : {}),
        ...(dto.hasElevator !== undefined ? { hasElevator: dto.hasElevator } : {}),
        ...(dto.elevatorCount !== undefined ? { elevatorCount: dto.elevatorCount } : {}),
        ...(dto.hasParking !== undefined ? { hasParking: dto.hasParking } : {}),
        ...(dto.parkingType !== undefined ? { parkingType: dto.parkingType as any } : {}),
        ...(dto.hasGenerator !== undefined ? { hasGenerator: dto.hasGenerator } : {}),
        ...(dto.generatorScope !== undefined ? { generatorScope: dto.generatorScope } : {}),
        ...(dto.hasSecurityGuard !== undefined ? { hasSecurityGuard: dto.hasSecurityGuard } : {}),
        ...(dto.hasCctv !== undefined ? { hasCctv: dto.hasCctv } : {}),
        ...(dto.hasIntercom !== undefined ? { hasIntercom: dto.hasIntercom } : {}),
        ...(dto.hasRooftop !== undefined ? { hasRooftop: dto.hasRooftop } : {}),
        ...(dto.hasSubmersiblePump !== undefined
          ? { hasSubmersiblePump: dto.hasSubmersiblePump }
          : {}),
      },
      include: { images: true, floors: { orderBy: { floorNumber: "asc" } } },
    });
  }

  async remove(id: string, ownerId: string) {
    const building = await this.prisma.building.findUnique({ where: { id } });
    if (!building) throw new NotFoundException("Building not found");
    if (building.ownerId !== ownerId) throw new ForbiddenException();
    await this.prisma.building.delete({ where: { id } });
    return { deleted: true };
  }

  async ensureFloor(buildingId: string, ownerId: string, floorNumber: number) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) throw new NotFoundException("Building not found");
    if (building.ownerId !== ownerId) throw new ForbiddenException();
    if (floorNumber < 0 || floorNumber > building.totalFloors) {
      throw new BadRequestException(`floorNumber must be between 0 and ${building.totalFloors}`);
    }
    return this.prisma.floor.upsert({
      where: { buildingId_floorNumber: { buildingId, floorNumber } },
      update: {},
      create: { buildingId, floorNumber },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || "building";
    let slug = base;
    let i = 1;
    while (await this.prisma.building.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
