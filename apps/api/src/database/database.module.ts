// src/database/database.module.ts — Prisma 7 with pg adapter (schoolos pattern).
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseService } from "./database.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
