import { Prisma } from "@prisma/client";
import { z } from "zod";
import { HTTP_STATUS, type HttpStatus } from "./http-status";

type ApiErrorOptions = {
  status: HttpStatus;
  code: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: HttpStatus;
  readonly code: string;
  readonly details?: unknown;

  constructor({ status, code, message, details }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof z.ZodError) {
    return new ApiError({
      status: HTTP_STATUS.BAD_REQUEST,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new ApiError({
        status: HTTP_STATUS.CONFLICT,
        code: "RESOURCE_CONFLICT",
        message: "A resource with these details already exists",
      });
    }

    if (error.code === "P2025") {
      return new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        code: "RESOURCE_NOT_FOUND",
        message: "The requested resource was not found",
      });
    }

    if (error.code === "P2003") {
      return new ApiError({
        status: HTTP_STATUS.CONFLICT,
        code: "RELATED_RESOURCE_CONFLICT",
        message: "The request conflicts with a related resource",
      });
    }
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === HTTP_STATUS.BAD_REQUEST
  ) {
    return new ApiError({
      status: HTTP_STATUS.BAD_REQUEST,
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON",
    });
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    if (error.status === HTTP_STATUS.PAYLOAD_TOO_LARGE) {
      return new ApiError({
        status: HTTP_STATUS.PAYLOAD_TOO_LARGE,
        code: "PAYLOAD_TOO_LARGE",
        message: "Request payload exceeds the allowed size",
      });
    }

    if (error.status === HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE) {
      return new ApiError({
        status: HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Request content type is not supported",
      });
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new ApiError({
      status: HTTP_STATUS.SERVICE_UNAVAILABLE,
      code: "DATABASE_UNAVAILABLE",
      message: "The service is temporarily unavailable",
    });
  }

  return new ApiError({
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
}
