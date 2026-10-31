import { z } from "zod";

const accountFields = {
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(6).max(128),
};

export const createAccountSchema = z.object({
  ...accountFields,
  phone: accountFields.phone.optional(),
});

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
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
