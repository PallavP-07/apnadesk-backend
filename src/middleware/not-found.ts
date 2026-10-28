import type { Request, Response } from "express";
import { ApiError } from "../lib/api-error";
import { HTTP_STATUS } from "../lib/http-status";

export function notFoundHandler(_request: Request, _response: Response): never {
  throw new ApiError({
    status: HTTP_STATUS.NOT_FOUND,
    code: "ROUTE_NOT_FOUND",
    message: "The requested route was not found",
  });
}
