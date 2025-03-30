import { z } from "zod";
import { UserRole } from "../constants/userRole";

const userRoleValues = Object.values(UserRole).filter((value) => typeof value === "string") as [string, ...string[]];

const emailSchema = z.string().email().min(1).max(255);
const passwordSchema = z.string().min(6).max(255);

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
    .extend({
        confirmPassword: passwordSchema,
        username: z.string().min(1).max(50),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phoneNumber: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        role: z.enum(userRoleValues).default(UserRole.USER),
    }).refine(
        (data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }
);

export const verificationCodeSchema = z.string().min(1).max(24);

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    verificationCode: verificationCodeSchema,
});

export const forgotPasswordSchema = emailSchema;