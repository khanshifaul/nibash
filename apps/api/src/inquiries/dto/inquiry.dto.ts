import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateInquiryDto {
  @ApiProperty() @IsString() apartmentId!: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() message?: string;
  @ApiProperty({
    required: false,
    description: "ISO date string for requested visit",
  })
  @IsString()
  @IsOptional()
  requestedVisitAt?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({
    enum: ["PENDING", "CONTACTED", "SCHEDULED", "CLOSED", "SPAM"],
  })
  @IsEnum(["PENDING", "CONTACTED", "SCHEDULED", "CLOSED", "SPAM"])
  status!: "PENDING" | "CONTACTED" | "SCHEDULED" | "CLOSED" | "SPAM";
}
