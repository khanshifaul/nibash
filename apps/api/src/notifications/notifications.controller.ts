import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { User } from "../common/decorators/user.decorator";
import { SubscribePushDto, UnsubscribePushDto } from "./dto/notifications.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get("vapid-public-key")
  @Public()
  @ApiOperation({ summary: "Get VAPID public key for web push subscription" })
  getPublicKey() {
    return this.notifications.getPublicKey();
  }

  @Post("subscribe")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Subscribe current user to web push notifications" })
  subscribe(@User("id") userId: string, @Body() dto: SubscribePushDto) {
    return this.notifications.subscribe(userId, dto);
  }

  @Post("unsubscribe")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Unsubscribe current user from web push notifications" })
  unsubscribe(@User("id") userId: string, @Body() dto: UnsubscribePushDto) {
    return this.notifications.unsubscribe(userId, dto.endpoint);
  }
}
