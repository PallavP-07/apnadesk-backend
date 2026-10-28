import type { ErrorRequestHandler } from "express";
import { normalizeApiError } from "../lib/api-error";
import { HTTP_STATUS } from "../lib/http-status";
import { logger } from "../lib/logger";

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const apiError = normalizeApiError(error);

  if (apiError.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    logger.error({ err: error, requestId: request.id }, "Unhandled request error");
  }

  response.status(apiError.status).json({
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details === undefined ? {} : { details: apiError.details }),
      ...(request.id === undefined ? {} : { requestId: request.id }),
    },
  });
};
