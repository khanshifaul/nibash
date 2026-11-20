import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { CreateApartmentDto } from "./create-apartment.dto";

export class UpdateApartmentDto extends PartialType(CreateApartmentDto) {
  @ApiProperty({ required: false, description: "Set published state" })
  @IsBoolean()
  @IsOptional()
  publish?: boolean;
}

export class CloneApartmentDto {
  @ApiProperty({ description: "Target floor number (defaults to next floor suggestion)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floorNumber!: number;

  @ApiProperty({ description: "New unit label (must be unique on target floor)" })
  unitLabel!: string;
}

export class UpdateApartmentStatusDto {
  @ApiProperty({ enum: ["AVAILABLE", "RENTED", "MAINTENANCE", "COMING_SOON", "SOLD"] })
  availabilityStatus!: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "COMING_SOON" | "SOLD";
}
