import { UserRole } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validateRequest } from "../../middleware/validate-request";
import { getMine, updateMine } from "./salons.controller";
import { updateSalonSchema } from "./salons.schema";

export const salonRouter = Router();

salonRouter.use(authenticate);

salonRouter.get("/", authorize(UserRole.OWNER, UserRole.STAFF), asyncHandler(getMine));
salonRouter.patch(
  "/",
  authorize(UserRole.OWNER),
  validateRequest(updateSalonSchema),
  asyncHandler(updateMine),
);
