import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "../common/decorators/user.decorator";
import { Verified } from "../common/decorators/verified.decorator";
import type { CreateInquiryDto, UpdateInquiryStatusDto } from "./dto/inquiry.dto";
import type { InquiriesService } from "./inquiries.service";

@ApiTags("Inquiries")
@Controller("inquiries")
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @Verified()
  @ApiOperation({
    summary: "Create inquiry/visit request (logged-in verified user)",
  })
  create(@User("id") userId: string, @Body() dto: CreateInquiryDto) {
    return this.inquiriesService.create(userId, dto);
  }

  @Get("owner")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "List inquiries for my buildings (owner inbox)" })
  listForOwner(@User("id") userId: string) {
    return this.inquiriesService.listForOwner(userId);
  }

  @Get("mine")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "List my inquiries as renter" })
  listForRenter(@User("id") userId: string) {
    return this.inquiriesService.listForRenter(userId);
  }

  @Patch(":id/status")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Update inquiry status (owner)" })
  updateStatus(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    return this.inquiriesService.updateStatus(id, userId, dto);
  }
}
