import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../common/decorators/public.decorator";
import { SearchService } from "./search.service";

@ApiTags("Search")
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get("search/listings")
  @ApiOperation({ summary: "Public search for apartment listings" })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "area", required: false })
  @ApiQuery({ name: "listingType", required: false, enum: ["RENT", "SALE"] })
  @ApiQuery({ name: "minRent", required: false, type: Number })
  @ApiQuery({ name: "maxRent", required: false, type: Number })
  @ApiQuery({ name: "minPrice", required: false, type: Number })
  @ApiQuery({ name: "maxPrice", required: false, type: Number })
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
    enum: ["newest", "rent_asc", "rent_desc", "price_asc", "price_desc"],
  })
  search(
    @Query("q") q?: string,
    @Query("area") area?: string,
    @Query("listingType") listingType?: string,
    @Query("minRent") minRent?: string,
    @Query("maxRent") maxRent?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
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
    const allowedSort = new Set(["newest", "rent_asc", "rent_desc", "price_asc", "price_desc"]);
    const lt = listingType === "RENT" || listingType === "SALE" ? listingType : undefined;
    return this.searchService.search({
      q,
      area,
      listingType: lt,
      minRent: toNum(minRent),
      maxRent: toNum(maxRent),
      minPrice: toNum(minPrice),
      maxPrice: toNum(maxPrice),
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
      sort: sort && allowedSort.has(sort) ? (sort as any) : undefined,
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
