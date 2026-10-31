import { UserRole } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validateRequest } from "../../middleware/validate-request";
import { create, getById, list, update, updateStatus } from "./owners.controller";
import {
  createAccountSchema,
  updateAccountSchema,
  updateStatusSchema,
  userIdParamsSchema,
} from "./owners.schema";

export const ownersRouter = Router();

ownersRouter.use(authenticate, authorize(UserRole.SUPER_ADMIN));

ownersRouter.post("/", validateRequest(createAccountSchema), asyncHandler(create));
ownersRouter.get("/", asyncHandler(list));
ownersRouter.get("/:id", validateRequest(userIdParamsSchema, "params"), asyncHandler(getById));
ownersRouter.patch(
  "/:id",
  validateRequest(userIdParamsSchema, "params"),
  validateRequest(updateAccountSchema),
  asyncHandler(update),
);
ownersRouter.patch(
  "/:id/status",
  validateRequest(userIdParamsSchema, "params"),
  validateRequest(updateStatusSchema),
  asyncHandler(updateStatus),
);
