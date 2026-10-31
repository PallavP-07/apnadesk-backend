import { UserRole } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validateRequest } from "../../middleware/validate-request";
import {
  createAccountSchema,
  updateAccountSchema,
  updateStatusSchema,
  userIdParamsSchema,
} from "../owners/owners.schema";
import { create, getById, list, update, updateStatus } from "./staff.controller";

export const staffRouter = Router();

staffRouter.use(authenticate, authorize(UserRole.OWNER));

staffRouter.post("/", validateRequest(createAccountSchema), asyncHandler(create));
staffRouter.get("/", asyncHandler(list));
staffRouter.get("/:id", validateRequest(userIdParamsSchema, "params"), asyncHandler(getById));
staffRouter.patch(
  "/:id",
  validateRequest(userIdParamsSchema, "params"),
  validateRequest(updateAccountSchema),
  asyncHandler(update),
);
staffRouter.patch(
  "/:id/status",
  validateRequest(userIdParamsSchema, "params"),
  validateRequest(updateStatusSchema),
  asyncHandler(updateStatus),
);
