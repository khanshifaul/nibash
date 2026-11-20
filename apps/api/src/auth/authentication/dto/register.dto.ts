import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: "+8801700000000",
    required: false,
    description: "Phone number (needed for listing/contact)",
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "password123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
