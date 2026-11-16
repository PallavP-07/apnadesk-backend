import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response";
import type { UpdateSalonInput } from "./salons.schema";
import { getSalonForUser, updateOwnSalon } from "./salons.service";

export async function getMine(request: Request, response: Response): Promise<void> {
  const { userId, role } = request.auth!;
  sendSuccess(response, await getSalonForUser(userId, role));
}

export async function updateMine(request: Request, response: Response): Promise<void> {
  const salon = await updateOwnSalon(request.auth!.userId, request.body as UpdateSalonInput);
  sendSuccess(response, salon);
}
