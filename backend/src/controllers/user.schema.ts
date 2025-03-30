import { z } from "zod";

export const userSchema = z.object({
    username: z.string().min(1).max(50),
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    phoneNumber: z.string().min(1).max(255),
    address: z.string().min(1).max(255),
    region: z.string().min(1).max(255),
    city: z.string().min(1).max(255),
})

export const userIdSchema = z.string().uuid();