import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "../common/decorators/user.decorator";
import { Verified } from "../common/decorators/verified.decorator";
import type { AttachApartmentImageDto, AttachBuildingImageDto, PresignDto } from "./dto/media.dto";
import type { MediaService } from "./media.service";

@ApiTags("Media")
@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("media/presign")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({
    summary: "Get presigned upload URL for building/apartment image (S3-compatible)",
  })
  presign(@User("id") userId: string, @Body() dto: PresignDto) {
    return this.mediaService.presign(userId, dto);
  }

  @Post("buildings/:id/images")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({ summary: "Attach building image metadata" })
  attachBuilding(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body() dto: AttachBuildingImageDto,
  ) {
    return this.mediaService.attachBuildingImage(userId, id, dto);
  }

  @Post("apartments/:id/images")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({ summary: "Attach apartment image metadata (room-tagged)" })
  attachApartment(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body() dto: AttachApartmentImageDto,
  ) {
    return this.mediaService.attachApartmentImage(userId, id, dto);
  }

  @Delete("building-images/:imageId")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Delete building image" })
  deleteBuilding(@Param("imageId") imageId: string, @User("id") userId: string) {
    return this.mediaService.deleteBuildingImage(userId, imageId);
  }

  @Delete("apartment-images/:imageId")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Delete apartment image" })
  deleteApartment(@Param("imageId") imageId: string, @User("id") userId: string) {
    return this.mediaService.deleteApartmentImage(userId, imageId);
  }
}
