import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateInquiryDto, UpdateInquiryStatusDto } from "./dto/inquiry.dto";

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(renterId: string, dto: CreateInquiryDto) {
    const apartment = await this.prisma.apartment.findUnique({
      where: { id: dto.apartmentId },
      include: { building: true },
    });
    if (!apartment) throw new NotFoundException("Apartment not found");
    if (apartment.building.ownerId === renterId) {
      throw new BadRequestException("Cannot inquire on your own listing");
    }

    return this.prisma.inquiry.create({
      data: {
        apartmentId: apartment.id,
        buildingId: apartment.buildingId,
        renterId,
        message: dto.message ?? null,
        requestedVisitAt: dto.requestedVisitAt ? new Date(dto.requestedVisitAt) : null,
      },
      include: {
        apartment: { select: { id: true, unitLabel: true } },
        building: { select: { id: true, name: true } },
      },
    });
  }

  listForOwner(ownerId: string) {
    return this.prisma.inquiry.findMany({
      where: { building: { ownerId } },
      orderBy: { createdAt: "desc" },
      include: {
        apartment: { select: { id: true, unitLabel: true, floor: { select: { floorNumber: true } } } },
        building: { select: { id: true, name: true } },
        renter: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  listForRenter(renterId: string) {
    return this.prisma.inquiry.findMany({
      where: { renterId },
      orderBy: { createdAt: "desc" },
      include: {
        apartment: { select: { id: true, unitLabel: true } },
        building: { select: { id: true, name: true, areaZone: true } },
      },
    });
  }

  async updateStatus(id: string, ownerId: string, dto: UpdateInquiryStatusDto) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: { building: true },
    });
    if (!inquiry) throw new NotFoundException("Inquiry not found");
    if (inquiry.building.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.inquiry.update({
      where: { id },
      data: { status: dto.status as any },
    });
  }
}
