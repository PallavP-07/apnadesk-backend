import jwt from "jsonwebtoken";
import { ApiError } from "../lib/api-error";
import { asyncHandler } from "../lib/async-handler";
import { HTTP_STATUS } from "../lib/http-status";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

function unauthorized(code: string, message: string): ApiError {
  return new ApiError({ status: HTTP_STATUS.UNAUTHORIZED, code, message });
}

export const authenticate = asyncHandler(async (request, _response, next) => {
  const [scheme, token] = request.headers.authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw unauthorized("MISSING_TOKEN", "Authentication is required");
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token).sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw unauthorized("TOKEN_EXPIRED", "Access token has expired");
    }
    throw unauthorized("INVALID_TOKEN", "Access token is invalid");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true, owner: { select: { isActive: true } } },
  });

  if (!user || !user.isActive || user.owner?.isActive === false) {
    throw unauthorized("INVALID_TOKEN", "Access token is invalid");
  }

  request.auth = { userId: user.id, role: user.role };
  next();
});
