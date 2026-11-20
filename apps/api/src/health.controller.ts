import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "./common/decorators/public.decorator";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Public()
  @Get("health")
  health() {
    return { success: true, status: "ok", service: "nibash-api" };
  }
}
