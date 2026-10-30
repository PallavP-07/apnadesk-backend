import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "../../lib/api-error";
import { asyncHandler } from "../../lib/async-handler";
import { HTTP_STATUS } from "../../lib/http-status";
import { authenticate } from "../../middleware/authenticate";
import { validateRequest } from "../../middleware/validate-request";
import { adminLogin, getMe } from "./auth.controller";
import { loginSchema } from "./auth.schema";

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, _response, next) => {
    next(
      new ApiError({
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        code: "TOO_MANY_LOGIN_ATTEMPTS",
        message: "Too many login attempts, please try again later",
      }),
    );
  },
});

export const authRouter = Router();

authRouter.post(
  "/admin/login",
  loginRateLimiter,
  validateRequest(loginSchema),
  asyncHandler(adminLogin),
);
authRouter.get("/me", authenticate, asyncHandler(getMe));
