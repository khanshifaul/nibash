import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class PushSubscriptionKeysDto {
  @ApiProperty({ example: "BN..." })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ example: "abc123..." })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class SubscribePushDto {
  @ApiProperty({ example: "https://fcm.googleapis.com/fcm/send/..." })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty({ type: PushSubscriptionKeysDto })
  @IsObject()
  keys!: PushSubscriptionKeysDto;
}

export class UnsubscribePushDto {
  @ApiProperty({ example: "https://fcm.googleapis.com/fcm/send/..." })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;
}

export class PushPayloadDto {
  @ApiProperty({ example: "New inquiry" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: "You have a new inquiry." })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({ required: false, example: "/dashboard/inquiries" })
  @IsString()
  @IsOptional()
  url?: string;
}
