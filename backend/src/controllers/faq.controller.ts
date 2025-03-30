import { OK, CREATED } from "../constants/http";
import catchErrors from "../utils/catchErrors";
import { getAllFAQs, getFAQById, createFAQ, updateFAQ, deleteFAQ } from "../services/faq.service";
import { z } from "zod";
import { faqIdSchema, faqSchema } from "./faq.schema";

export const getAllFAQsHandler = catchErrors(async (req, res) => {
    const faqs = await getAllFAQs();
    return res.status(OK).json(faqs);
});

export const getFAQByIdHandler = catchErrors(async (req, res) => {
    const id = faqIdSchema.parse(req.params.id);
    const faq = await getFAQById(id);
    return res.status(OK).json(faq);
});

// for admins only

export const createFAQHandler = catchErrors(async (req, res) => {
    const request = faqSchema.parse(req.body);
    const faq = await createFAQ(request);
    return res.status(CREATED).json(faq);
});

export const updateFAQHandler = catchErrors(async (req, res) => {
    const id = faqIdSchema.parse(req.params.id);
    const data = faqSchema.partial().parse(req.body);
    const faq = await updateFAQ(id, data);
    return res.status(OK).json(faq);
});

export const deleteFAQHandler = catchErrors(async (req, res) => {
    const id = faqIdSchema.parse(req.params.id);
    const result = await deleteFAQ(id);
    return res.status(OK).json(result);
});