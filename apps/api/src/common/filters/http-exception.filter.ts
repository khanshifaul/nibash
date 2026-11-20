// src/common/filters/http-exception.filter.ts — consistent error envelope.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const payload =
        typeof res === "object" && res !== null ? (res as Record<string, unknown>) : {};
      const body = {
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: (payload.message as string | string[] | undefined) ?? exception.message,
        error: (payload.error as string | undefined) ?? exception.name,
      };
      return response.status(status).json(body);
    }

    const err = exception as Error;
    this.logger.error(
      `Unhandled: ${request.method} ${request.url} - ${err?.message}`,
      err?.stack,
    );
    return response.status(500).json({
      success: false,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: "An unexpected error occurred.",
      error: "Internal Server Error",
    });
  }
}
