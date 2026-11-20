import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../common/decorators/public.decorator";
import { User } from "../common/decorators/user.decorator";
import { Verified } from "../common/decorators/verified.decorator";
import { BuildingsService } from "./buildings.service";
import { CreateBuildingDto } from "./dto/create-building.dto";
import { UpdateBuildingDto } from "./dto/update-building.dto";

@ApiTags("Buildings")
@Controller("buildings")
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({
    summary: "Create a building (verified user, auto-published)",
  })
  create(@User("id") userId: string, @Body() dto: CreateBuildingDto) {
    return this.buildingsService.create(userId, dto);
  }

  @Get("mine")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "List my buildings with floors and apartments" })
  findMine(@User("id") userId: string) {
    return this.buildingsService.findMine(userId);
  }

  @Get(":id")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Get my building detail (owner)" })
  findOne(@Param("id") id: string, @User("id") userId: string) {
    return this.buildingsService.findOneForOwner(id, userId);
  }

  @Public()
  @Get("public/:idOrSlug")
  @ApiOperation({
    summary: "Public building view (contact gated to verified viewers)",
  })
  findPublic(@Param("idOrSlug") idOrSlug: string, @Req() req: Request) {
    const user = req.user as { isEmailVerified?: boolean } | undefined;
    const viewerVerified = !!user?.isEmailVerified;
    return this.buildingsService.findPublic(idOrSlug, viewerVerified);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({ summary: "Update my building" })
  update(@Param("id") id: string, @User("id") userId: string, @Body() dto: UpdateBuildingDto) {
    return this.buildingsService.update(id, userId, dto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Delete my building" })
  remove(@Param("id") id: string, @User("id") userId: string) {
    return this.buildingsService.remove(id, userId);
  }

  @Post(":id/floors")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({
    summary: "Ensure/create a floor in building (hierarchy: building > floor)",
  })
  ensureFloor(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body() body: { floorNumber: number },
  ) {
    return this.buildingsService.ensureFloor(id, userId, body.floorNumber);
  }
}
