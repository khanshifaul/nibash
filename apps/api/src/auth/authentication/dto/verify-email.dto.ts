import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({
    description: "Email verification token from link",
    example: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: "user@example.com" })
  @IsString()
  @IsNotEmpty()
  email!: string;
}
