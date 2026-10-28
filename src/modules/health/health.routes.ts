import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { getLiveness, getReadiness } from "./health.controller";

export const healthRouter = Router();

healthRouter.get("/live", getLiveness);
healthRouter.get("/ready", asyncHandler(getReadiness));
