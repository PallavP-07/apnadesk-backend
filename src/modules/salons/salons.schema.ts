import { z } from "zod";
import {
  INDIAN_STATES,
  emailSchema,
  gstinSchema,
  indianMobileSchema,
  pincodeSchema,
} from "../../lib/validators";

const salonFields = {
  name: z.string().trim().min(1).max(150),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.enum(INDIAN_STATES),
  pincode: pincodeSchema,
  phone: indianMobileSchema,
  email: emailSchema,
  gstin: gstinSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
};

const coordinatesTogether = {
  check: (input: { latitude?: number | null; longitude?: number | null }) =>
    (input.latitude == null) === (input.longitude == null),
  params: {
    message: "Latitude and longitude must be provided together",
    path: ["latitude"],
  },
};

export const salonSchema = z
  .object({
    ...salonFields,
    addressLine2: salonFields.addressLine2.optional(),
    phone: salonFields.phone.optional(),
    email: salonFields.email.optional(),
    gstin: salonFields.gstin.optional(),
    latitude: salonFields.latitude.optional(),
    longitude: salonFields.longitude.optional(),
  })
  .refine(coordinatesTogether.check, coordinatesTogether.params);

export const updateSalonSchema = z
  .object({
    ...salonFields,
    addressLine2: salonFields.addressLine2.nullable(),
    phone: salonFields.phone.nullable(),
    email: salonFields.email.nullable(),
    gstin: salonFields.gstin.nullable(),
    latitude: salonFields.latitude.nullable(),
    longitude: salonFields.longitude.nullable(),
  })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(coordinatesTogether.check, coordinatesTogether.params);

export type SalonInput = z.infer<typeof salonSchema>;
export type UpdateSalonInput = z.infer<typeof updateSalonSchema>;
