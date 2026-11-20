import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: "Password reset token from link" })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: "newpassword123", minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
