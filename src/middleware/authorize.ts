import type { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { ApiError } from "../lib/api-error";
import { HTTP_STATUS } from "../lib/http-status";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(
        new ApiError({
          status: HTTP_STATUS.UNAUTHORIZED,
          code: "MISSING_TOKEN",
          message: "Authentication is required",
        }),
      );
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      next(
        new ApiError({
          status: HTTP_STATUS.FORBIDDEN,
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        }),
      );
      return;
    }

    next();
  };
}
