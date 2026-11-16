import { z } from "zod";
import { emailSchema, indianMobileSchema, passwordSchema } from "../../lib/validators";
import { salonSchema } from "../salons/salons.schema";

const accountFields = {
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  phone: indianMobileSchema,
  password: passwordSchema,
};

export const createAccountSchema = z.object({
  ...accountFields,
  phone: accountFields.phone.optional(),
});

export const createOwnerSchema = createAccountSchema.extend({ salon: salonSchema });

export const updateAccountSchema = z
  .object({
    ...accountFields,
    phone: accountFields.phone.nullable(),
  })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  });

export const updateStatusSchema = z.object({ isActive: z.boolean() });

export const userIdParamsSchema = z.object({ id: z.uuid() });

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
