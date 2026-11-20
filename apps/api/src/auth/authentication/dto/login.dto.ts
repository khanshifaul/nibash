import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: false, required: false, description: "Extend refresh token expiry" })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
