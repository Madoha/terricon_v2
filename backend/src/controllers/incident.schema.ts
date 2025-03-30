import { z } from "zod";

export const incidentSchema = z.object({
    description: z.string().min(1, "Description is required"),
    latitude: z.string().transform(val => parseFloat(val)).optional(),
    longitude: z.string().transform(val => parseFloat(val)).optional(),
    timestamp: z.string().transform(val => new Date(parseInt(val))),
    address: z.string().min(1, "Address is required").optional(),
    isAnonymous: z.string().transform(val => val === "true").optional().default("false"),
});
