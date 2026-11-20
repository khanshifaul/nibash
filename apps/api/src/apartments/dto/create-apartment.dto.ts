import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

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
  @ApiProperty({ description: "Floor number within the building (floor will be created if needed)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floorNumber!: number;

  @ApiProperty({ example: "4B" })
  @IsString()
  @MaxLength(50)
  unitLabel!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  facing?: string;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sizeSqft?: number;

  @ApiProperty({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @IsOptional() bedrooms?: number;
  @ApiProperty({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @IsOptional() attachedBathrooms?: number;
  @ApiProperty({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @IsOptional() bathrooms?: number;
  @ApiProperty({ required: false }) @Type(() => Number) @IsInt() @IsOptional() highCommodeCount?: number;
  @ApiProperty({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @IsOptional() diningRooms?: number;
  @ApiProperty({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @IsOptional() drawingRooms?: number;
  @ApiProperty({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @IsOptional() kitchens?: number;
  @ApiProperty({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @IsOptional() verandas?: number;

  @ApiProperty({ enum: GasTypeDto, default: "NONE" })
  @IsEnum(GasTypeDto)
  @IsOptional()
  gasType?: GasTypeDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  utilityBillingType?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredTenantTypes?: string[];

  @ApiProperty({ enum: ListingTypeDto, default: "RENT" })
  @IsEnum(ListingTypeDto)
  @IsOptional()
  listingType?: ListingTypeDto;

  @ApiProperty({ required: false, description: "Monthly rent in minor units (paisa). Required/used for RENT listings." })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  rentAmount?: number;

  @ApiProperty({ required: false, description: "Sale price in minor units (paisa). Required/used for SALE listings." })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiProperty({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;

  @ApiProperty({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  securityDepositAmount?: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  depositMonths?: number;

  @ApiProperty({ enum: AvailabilityStatusDto, default: "AVAILABLE" })
  @IsEnum(AvailabilityStatusDto)
  @IsOptional()
  availabilityStatus?: AvailabilityStatusDto;

  @ApiProperty({ required: false, description: "ISO date string when coming soon / available from" })
  @IsString()
  @IsOptional()
  availableFrom?: string;


  @ApiProperty({ required: false, default: true, description: "Whether to list this unit publicly (requires published state in search)" })
  @IsOptional()
  publish?: boolean;

}
