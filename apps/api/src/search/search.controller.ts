import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../common/decorators/public.decorator";
import type { SearchService } from "./search.service";

@ApiTags("Search")
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get("search/listings")
  @ApiOperation({ summary: "Public search for apartment listings" })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "area", required: false })
  @ApiQuery({ name: "minRent", required: false, type: Number })
  @ApiQuery({ name: "maxRent", required: false, type: Number })
  @ApiQuery({ name: "bedrooms", required: false, type: Number })
  @ApiQuery({ name: "bathrooms", required: false, type: Number })
  @ApiQuery({ name: "verandas", required: false, type: Number })
  @ApiQuery({ name: "minSqft", required: false, type: Number })
  @ApiQuery({ name: "floorNumber", required: false, type: Number })
  @ApiQuery({ name: "excludeGround", required: false, type: Boolean })
  @ApiQuery({ name: "hasElevator", required: false, type: Boolean })
  @ApiQuery({ name: "hasParking", required: false, type: Boolean })
  @ApiQuery({ name: "hasGenerator", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["newest", "rent_asc", "rent_desc"],
  })
  search(
    @Query("q") q?: string,
    @Query("area") area?: string,
    @Query("minRent") minRent?: string,
    @Query("maxRent") maxRent?: string,
    @Query("bedrooms") bedrooms?: string,
    @Query("bathrooms") bathrooms?: string,
    @Query("verandas") verandas?: string,
    @Query("minSqft") minSqft?: string,
    @Query("floorNumber") floorNumber?: string,
    @Query("excludeGround") excludeGround?: string,
    @Query("hasElevator") hasElevator?: string,
    @Query("hasParking") hasParking?: string,
    @Query("hasGenerator") hasGenerator?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string,
  ) {
    const toNum = (v?: string) => (v !== undefined && v !== "" ? Number(v) : undefined);
    const toBool = (v?: string) => v === "true" || v === "1";
    return this.searchService.search({
      q,
      area,
      minRent: toNum(minRent),
      maxRent: toNum(maxRent),
      bedrooms: toNum(bedrooms),
      bathrooms: toNum(bathrooms),
      verandas: toNum(verandas),
      minSqft: toNum(minSqft),
      floorNumber: toNum(floorNumber),
      excludeGround: toBool(excludeGround),
      hasElevator: toBool(hasElevator),
      hasParking: toBool(hasParking),
      hasGenerator: toBool(hasGenerator),
      page: toNum(page),
      limit: toNum(limit),
      sort: sort === "rent_asc" || sort === "rent_desc" || sort === "newest" ? sort : undefined,
    });
  }

  @Public()
  @Get("listings/:id")
  @ApiOperation({
    summary: "Public listing detail (contact gated to verified users)",
  })
  getListing(@Param("id") id: string, @Req() req: Request) {
    const user = req.user as { isEmailVerified?: boolean } | undefined;
    const viewerVerified = !!user?.isEmailVerified;
    return this.searchService.getListingDetail(id, viewerVerified);
  }
}
