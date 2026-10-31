import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response";
import { HTTP_STATUS } from "../../lib/http-status";
import type {
  CreateAccountInput,
  UpdateAccountInput,
  UpdateStatusInput,
  UserIdParams,
} from "./owners.schema";
import { createOwner, getOwner, listOwners, setOwnerStatus, updateOwner } from "./owners.service";

export async function create(request: Request, response: Response): Promise<void> {
  const owner = await createOwner(request.body as CreateAccountInput);
  sendSuccess(response, owner, HTTP_STATUS.CREATED);
}

export async function list(_request: Request, response: Response): Promise<void> {
  sendSuccess(response, await listOwners());
}

export async function getById(request: Request, response: Response): Promise<void> {
  const { id } = request.validated!.params as UserIdParams;
  sendSuccess(response, await getOwner(id));
}

export async function update(request: Request, response: Response): Promise<void> {
  const { id } = request.validated!.params as UserIdParams;
  sendSuccess(response, await updateOwner(id, request.body as UpdateAccountInput));
}

export async function updateStatus(request: Request, response: Response): Promise<void> {
  const { id } = request.validated!.params as UserIdParams;
  const { isActive } = request.body as UpdateStatusInput;
  sendSuccess(response, await setOwnerStatus(id, isActive));
}
