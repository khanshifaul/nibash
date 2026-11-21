import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateInquiryDto {
  @ApiProperty({ example: "cmwouplu80024w0rrda43kaxn", description: "Target apartment ID" })
  @IsString()
  apartmentId!: string;

  @ApiProperty({
    required: false,
    example: "I am interested in this apartment. Is it available for a visit this weekend?",
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    required: false,
    example: "2026-11-25T10:00:00.000Z",
    description: "ISO date string for requested visit",
  })
  @IsString()
  @IsOptional()
  requestedVisitAt?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({
    enum: ["PENDING", "CONTACTED", "SCHEDULED", "CLOSED", "SPAM"],
    example: "CONTACTED",
  })
  @IsEnum(["PENDING", "CONTACTED", "SCHEDULED", "CLOSED", "SPAM"])
  status!: "PENDING" | "CONTACTED" | "SCHEDULED" | "CLOSED" | "SPAM";
}
