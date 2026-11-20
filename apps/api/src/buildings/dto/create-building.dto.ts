import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export enum ParkingTypeDto {
  NONE = "NONE",
  BIKE = "BIKE",
  CAR = "CAR",
  CAR_AND_BIKE = "CAR_AND_BIKE",
  PAID = "PAID",
}

export class CreateBuildingDto {
  @ApiProperty({ example: "Rose Garden Heights" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: "Dhanmondi" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  areaZone!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  roadBlock?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  addressLine?: string;

  @ApiProperty({ required: false, description: "Contact phone for this building/listing" })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ example: 23.7568 })
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 90.3765 })
  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @ApiProperty({ example: 8, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  totalFloors!: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  elevatorCount?: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasParking?: boolean;

  @ApiProperty({ enum: ParkingTypeDto, required: false })
  @IsEnum(ParkingTypeDto)
  @IsOptional()
  parkingType?: ParkingTypeDto;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasGenerator?: boolean;

  @ApiProperty({ required: false, example: "common" })
  @IsString()
  @IsOptional()
  generatorScope?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasSecurityGuard?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasCctv?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasIntercom?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasRooftop?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasSubmersiblePump?: boolean;
}
