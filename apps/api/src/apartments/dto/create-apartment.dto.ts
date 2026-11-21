import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export enum GasTypeDto {
  LINE = "LINE",
  CYLINDER = "CYLINDER",
  LPG_CENTRAL = "LPG_CENTRAL",
  NONE = "NONE",
}

export enum ListingTypeDto {
  RENT = "RENT",
  SALE = "SALE",
}

export enum AvailabilityStatusDto {
  AVAILABLE = "AVAILABLE",
  RENTED = "RENTED",
  MAINTENANCE = "MAINTENANCE",
  COMING_SOON = "COMING_SOON",
  SOLD = "SOLD",
}

export class CreateApartmentDto {
  @ApiProperty({
    description: "Floor number within the building (floor will be created if needed)",
    example: 4,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floorNumber!: number;

  @ApiProperty({ example: "4B" })
  @IsString()
  @MaxLength(50)
  unitLabel!: string;

  @ApiProperty({ required: false, example: "South" })
  @IsString()
  @IsOptional()
  facing?: string;

  @ApiProperty({ required: false, example: 1250 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sizeSqft?: number;

  @ApiProperty({ default: 0, example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  bedrooms?: number;
  @ApiProperty({ default: 0, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  attachedBathrooms?: number;
  @ApiProperty({ default: 0, example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  bathrooms?: number;
  @ApiProperty({ required: false, example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  highCommodeCount?: number;
  @ApiProperty({ default: 0, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  diningRooms?: number;
  @ApiProperty({ default: 0, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  drawingRooms?: number;
  @ApiProperty({ default: 0, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  kitchens?: number;
  @ApiProperty({ default: 0, example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  verandas?: number;

  @ApiProperty({ enum: GasTypeDto, default: "NONE", example: GasTypeDto.LINE })
  @IsEnum(GasTypeDto)
  @IsOptional()
  gasType?: GasTypeDto;

  @ApiProperty({ required: false, example: "SEPARATE_METER" })
  @IsString()
  @IsOptional()
  utilityBillingType?: string;

  @ApiProperty({ type: [String], required: false, example: ["FAMILY", "BACHELOR"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredTenantTypes?: string[];

  @ApiProperty({ enum: ListingTypeDto, default: "RENT", example: ListingTypeDto.RENT })
  @IsEnum(ListingTypeDto)
  @IsOptional()
  listingType?: ListingTypeDto;

  @ApiProperty({
    required: false,
    example: 3500000,
    description: "Monthly rent in minor units (paisa). Required/used for RENT listings.",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  rentAmount?: number;

  @ApiProperty({
    required: false,
    example: 850000000,
    description: "Sale price in minor units (paisa). Required/used for SALE listings.",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiProperty({ default: 0, example: 200000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;

  @ApiProperty({ default: 0, example: 7000000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  securityDepositAmount?: number;

  @ApiProperty({ required: false, example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  depositMonths?: number;

  @ApiProperty({
    enum: AvailabilityStatusDto,
    default: "AVAILABLE",
    example: AvailabilityStatusDto.AVAILABLE,
  })
  @IsEnum(AvailabilityStatusDto)
  @IsOptional()
  availabilityStatus?: AvailabilityStatusDto;

  @ApiProperty({
    required: false,
    example: "2026-12-01",
    description: "ISO date string when coming soon / available from",
  })
  @IsString()
  @IsOptional()
  availableFrom?: string;

  @ApiProperty({
    required: false,
    default: true,
    example: true,
    description: "Whether to list this unit publicly (requires published state in search)",
  })
  @IsOptional()
  publish?: boolean;
}
