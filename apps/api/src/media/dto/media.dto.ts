import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export enum ImageEntityDto {
  BUILDING = "BUILDING",
  APARTMENT = "APARTMENT",
}

export enum RoomTagDto {
  COVER = "COVER",
  MASTER_BEDROOM = "MASTER_BEDROOM",
  BEDROOM = "BEDROOM",
  DINING = "DINING",
  DRAWING = "DRAWING",
  KITCHEN = "KITCHEN",
  WASHROOM = "WASHROOM",
  VERANDA = "VERANDA",
  OTHER = "OTHER",
}

export class PresignDto {
  @ApiProperty({ enum: ImageEntityDto })
  @IsEnum(ImageEntityDto)
  entity!: ImageEntityDto;

  @ApiProperty({ description: "Building or Apartment ID" })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({ example: "photo.jpg" })
  @IsString()
  @IsNotEmpty()
  fileName!: string;
}

export class AttachBuildingImageDto {
  @ApiProperty() @IsString() @IsNotEmpty() storageKey!: string;
  @ApiProperty() @IsString() @IsNotEmpty() url!: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() caption?: string;
  @ApiProperty({ required: false, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  isCover?: boolean;
}

export class AttachApartmentImageDto {
  @ApiProperty() @IsString() @IsNotEmpty() storageKey!: string;
  @ApiProperty() @IsString() @IsNotEmpty() url!: string;
  @ApiProperty({ enum: RoomTagDto }) @IsEnum(RoomTagDto) roomTag!: RoomTagDto;
  @ApiProperty({ required: false, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
