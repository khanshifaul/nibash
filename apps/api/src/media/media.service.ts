import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { AttachApartmentImageDto, AttachBuildingImageDto, ImageEntityDto, PresignDto } from "./dto/media.dto";

@Injectable()
export class MediaService {
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: DatabaseService,
  ) {
    const endpoint = this.configService.get<string>("storage.endpoint") || this.configService.get<string>("STORAGE_ENDPOINT");
    const accessKeyId = this.configService.get<string>("storage.accessKeyId") || this.configService.get<string>("STORAGE_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>("storage.secretAccessKey") || this.configService.get<string>("STORAGE_SECRET_ACCESS_KEY");
    const region = this.configService.get<string>("storage.region") || "us-east-1";
    const forcePathStyle = this.configService.get<boolean>("storage.forcePathStyle") ?? this.configService.get<string>("STORAGE_FORCE_PATH_STYLE") === "true";
    this.bucket = this.configService.get<string>("storage.bucket") || this.configService.get<string>("STORAGE_BUCKET") || "nibash-storage";
    this.publicBaseUrl = this.configService.get<string>("storage.publicBaseUrl") || this.configService.get<string>("STORAGE_PUBLIC_BASE_URL") || "";

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region,
        endpoint,
        forcePathStyle,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.s3 = null;
    }
  }

  async presign(userId: string, dto: PresignDto) {
    await this.assertOwnership(userId, dto.entity, dto.entityId);

    if (!this.s3) {
      throw new BadRequestException("Storage is not configured (missing STORAGE_* env vars)");
    }

    const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const prefix = dto.entity === ImageEntityDto.BUILDING ? "buildings" : "apartments";
    const key = `${prefix}/${dto.entityId}/${Date.now()}-${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const url = this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`
      : uploadUrl.split("?")[0];

    return { uploadUrl, storageKey: key, url };
  }

  async attachBuildingImage(userId: string, buildingId: string, dto: AttachBuildingImageDto) {
    await this.assertOwnership(userId, ImageEntityDto.BUILDING, buildingId);

    if (dto.isCover) {
      await this.prisma.buildingImage.updateMany({
        where: { buildingId },
        data: { isCover: false },
      });
    }

    return this.prisma.buildingImage.create({
      data: {
        buildingId,
        storageKey: dto.storageKey,
        url: dto.url,
        caption: dto.caption ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isCover: dto.isCover ?? false,
      },
    });
  }

  async attachApartmentImage(userId: string, apartmentId: string, dto: AttachApartmentImageDto) {
    await this.assertOwnership(userId, ImageEntityDto.APARTMENT, apartmentId);

    return this.prisma.apartmentImage.create({
      data: {
        apartmentId,
        storageKey: dto.storageKey,
        url: dto.url,
        roomTag: dto.roomTag as any,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async deleteBuildingImage(userId: string, imageId: string) {
    const image = await this.prisma.buildingImage.findUnique({
      where: { id: imageId },
      include: { building: true },
    });
    if (!image) throw new NotFoundException("Image not found");
    if (image.building.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.buildingImage.delete({ where: { id: imageId } });
    return { deleted: true };
  }

  async deleteApartmentImage(userId: string, imageId: string) {
    const image = await this.prisma.apartmentImage.findUnique({
      where: { id: imageId },
      include: { apartment: { include: { building: true } } },
    });
    if (!image) throw new NotFoundException("Image not found");
    if (image.apartment.building.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.apartmentImage.delete({ where: { id: imageId } });
    return { deleted: true };
  }

  private async assertOwnership(userId: string, entity: ImageEntityDto, entityId: string) {
    if (entity === ImageEntityDto.BUILDING) {
      const building = await this.prisma.building.findUnique({ where: { id: entityId } });
      if (!building) throw new NotFoundException("Building not found");
      if (building.ownerId !== userId) throw new ForbiddenException();
      return;
    }
    const apartment = await this.prisma.apartment.findUnique({
      where: { id: entityId },
      include: { building: true },
    });
    if (!apartment) throw new NotFoundException("Apartment not found");
    if (apartment.building.ownerId !== userId) throw new ForbiddenException();
  }
}
