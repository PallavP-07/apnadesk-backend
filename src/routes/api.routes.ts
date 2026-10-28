import { Router } from "express";
import { v1Router } from "./v1.routes";

export const apiRouter = Router();

apiRouter.use("/v1", v1Router);

