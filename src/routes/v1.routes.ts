import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { healthRouter } from "../modules/health/health.routes";
import { ownersRouter } from "../modules/owners/owners.routes";
import { staffRouter } from "../modules/staff/staff.routes";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/admin/owners", ownersRouter);
v1Router.use("/staff", staffRouter);
