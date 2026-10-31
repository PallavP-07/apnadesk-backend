import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response";
import { HTTP_STATUS } from "../../lib/http-status";
import type {
  CreateAccountInput,
  UpdateAccountInput,
  UpdateStatusInput,
  UserIdParams,
} from "../owners/owners.schema";
import { createStaff, getStaff, listStaff, setStaffStatus, updateStaff } from "./staff.service";

export async function create(request: Request, response: Response): Promise<void> {
  const staff = await createStaff(request.auth!.userId, request.body as CreateAccountInput);
  sendSuccess(response, staff, HTTP_STATUS.CREATED);
}

export async function list(request: Request, response: Response): Promise<void> {
  sendSuccess(response, await listStaff(request.auth!.userId));
}

export async function getById(request: Request, response: Response): Promise<void> {
  const { id } = request.validated!.params as UserIdParams;
  sendSuccess(response, await getStaff(request.auth!.userId, id));
}

export async function update(request: Request, response: Response): Promise<void> {
  const { id } = request.validated!.params as UserIdParams;
  const staff = await updateStaff(request.auth!.userId, id, request.body as UpdateAccountInput);
  sendSuccess(response, staff);
}

export async function updateStatus(request: Request, response: Response): Promise<void> {
  const { id } = request.validated!.params as UserIdParams;
  const { isActive } = request.body as UpdateStatusInput;
  sendSuccess(response, await setStaffStatus(request.auth!.userId, id, isActive));
}
