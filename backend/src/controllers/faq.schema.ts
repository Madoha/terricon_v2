import { z } from "zod";

export const faqSchema = z.object({
    question: z.string().min(1).max(255),
    answer: z.string().min(1).max(255),
})

export const faqIdSchema = z.string().uuid();