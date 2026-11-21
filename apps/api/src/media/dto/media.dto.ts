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
  @ApiProperty({ enum: ImageEntityDto, example: ImageEntityDto.APARTMENT })
  @IsEnum(ImageEntityDto)
  entity!: ImageEntityDto;

  @ApiProperty({ description: "Building or Apartment ID", example: "cmwouplu80024w0rrda43kaxn" })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({ example: "living-room.jpg" })
  @IsString()
  @IsNotEmpty()
  fileName!: string;
}

export class AttachBuildingImageDto {
  @ApiProperty({ example: "buildings/abc123/cover.jpg" })
  @IsString()
  @IsNotEmpty()
  storageKey!: string;
  @ApiProperty({ example: "https://cdn.example.com/buildings/abc123/cover.jpg" })
  @IsString()
  @IsNotEmpty()
  url!: string;
  @ApiProperty({ required: false, example: "Front elevation" })
  @IsString()
  @IsOptional()
  caption?: string;
  @ApiProperty({ required: false, default: 0, example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
  @ApiProperty({ required: false, default: false, example: true })
  @IsOptional()
  isCover?: boolean;
}

export class AttachApartmentImageDto {
  @ApiProperty({ example: "apartments/apt123/bedroom.jpg" })
  @IsString()
  @IsNotEmpty()
  storageKey!: string;
  @ApiProperty({ example: "https://cdn.example.com/apartments/apt123/bedroom.jpg" })
  @IsString()
  @IsNotEmpty()
  url!: string;
  @ApiProperty({ enum: RoomTagDto, example: RoomTagDto.BEDROOM })
  @IsEnum(RoomTagDto)
  roomTag!: RoomTagDto;
  @ApiProperty({ required: false, default: 0, example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
