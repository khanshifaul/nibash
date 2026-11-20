// src/main.ts — bootstrap with config, security, Swagger, CORS.
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import cookieParser = require("cookie-parser");

import type { Request, Response } from "express";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ValidationExceptionFilter } from "./common/filters/validation-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);

  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));

  app.use((req: Request, res: Response, next: () => void) => {
    void req;
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.use(cookieParser());
  app.enableShutdownHooks();

  app.setGlobalPrefix("api", {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(), new ValidationExceptionFilter());

  const configService = app.get(ConfigService);
  const webOrigin = configService.get<string>("webOrigin") ?? "http://localhost:3004";
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("nibash API")
    .setDescription(
      "Multi-building apartment rental platform API: auth, buildings/floors/apartments, media, search, inquiries.",
    )
    .setVersion("0.1.0")
    .addCookieAuth("nibash_token")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get<number>("port") ?? 4000;
  await app.listen(port);
  console.log(`🚀 API running on: http://localhost:${port}`);
  console.log(`🚀 Swagger on: http://localhost:${port}/api/docs`);
}

bootstrap();
