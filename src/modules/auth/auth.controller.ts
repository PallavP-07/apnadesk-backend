import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response";
import type { LoginInput } from "./auth.schema";
import { getCurrentUser, loginSuperAdmin } from "./auth.service";

export async function adminLogin(request: Request, response: Response): Promise<void> {
  const result = await loginSuperAdmin(request.body as LoginInput);
  sendSuccess(response, result);
}

export async function getMe(request: Request, response: Response): Promise<void> {
  const user = await getCurrentUser(request.auth!.userId);
  sendSuccess(response, user);
}
