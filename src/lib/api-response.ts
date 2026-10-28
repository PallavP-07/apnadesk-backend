import type { Response } from "express";
import { HTTP_STATUS, type HttpStatus } from "./http-status";

type SuccessEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export function sendSuccess<T>(
  response: Response,
  data: T,
  status: HttpStatus = HTTP_STATUS.OK,
  meta?: Record<string, unknown>,
): Response<SuccessEnvelope<T>> {
  return response.status(status).json({
    data,
    ...(meta ? { meta } : {}),
  });
}
