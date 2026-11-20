import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "../common/decorators/user.decorator";
import { Verified } from "../common/decorators/verified.decorator";
import { ApartmentsService } from "./apartments.service";
import type { CreateApartmentDto } from "./dto/create-apartment.dto";
import type {
  CloneApartmentDto,
  UpdateApartmentDto,
  UpdateApartmentStatusDto,
} from "./dto/update-apartment.dto";

@ApiTags("Apartments")
@Controller()
export class ApartmentsController {
  constructor(private readonly apartmentsService: ApartmentsService) {}

  @Post("buildings/:buildingId/apartments")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({
    summary: "Create apartment in building (auto-creates floor in hierarchy)",
  })
  create(
    @Param("buildingId") buildingId: string,
    @User("id") userId: string,
    @Body() dto: CreateApartmentDto,
  ) {
    return this.apartmentsService.create(buildingId, userId, dto);
  }

  @Get("apartments/:id")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Get apartment detail (owner)" })
  findOne(@Param("id") id: string, @User("id") userId: string) {
    return this.apartmentsService.findOneForOwner(id, userId);
  }

  @Patch("apartments/:id")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({ summary: "Update apartment" })
  update(@Param("id") id: string, @User("id") userId: string, @Body() dto: UpdateApartmentDto) {
    return this.apartmentsService.update(id, userId, dto);
  }

  @Patch("apartments/:id/status")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Update apartment availability status" })
  updateStatus(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body() dto: UpdateApartmentStatusDto,
  ) {
    return this.apartmentsService.updateStatus(id, userId, dto);
  }

  @Post("apartments/:id/clone")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({
    summary: "Clone apartment to another floor (copies specs, resets label/images)",
  })
  clone(@Param("id") id: string, @User("id") userId: string, @Body() dto: CloneApartmentDto) {
    return this.apartmentsService.clone(id, userId, dto);
  }

  @Delete("apartments/:id")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Delete apartment" })
  remove(@Param("id") id: string, @User("id") userId: string) {
    return this.apartmentsService.remove(id, userId);
  }
}
