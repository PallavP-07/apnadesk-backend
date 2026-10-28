import type { Request, Response } from "express";
import { logger } from "../../lib/logger";
import { HTTP_STATUS } from "../../lib/http-status";
import { checkDatabase } from "./health.service";

export function getLiveness(_request: Request, response: Response): void {
  response.status(HTTP_STATUS.OK).json({ status: "ok" });
}

export async function getReadiness(_request: Request, response: Response): Promise<void> {
  try {
    await checkDatabase();
    response.status(HTTP_STATUS.OK).json({
      status: "ready",
      checks: { database: "ok" },
    });
  } catch (error) {
    logger.warn(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "Database readiness check failed",
    );
    response.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: "not_ready",
      checks: { database: "unavailable" },
    });
  }
}
