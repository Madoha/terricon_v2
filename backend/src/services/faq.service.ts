import { getRepository } from "typeorm";
import { FAQ } from "../entities/FAQ";
import { NOT_FOUND } from "../constants/http";
import appAssert from "../utils/appAssert";

export const getAllFAQs = async () => {
    const faqRepository = getRepository(FAQ);
    const faqs = await faqRepository.find();
    return faqs;
}

export const getFAQById = async (id: string) => {
    const faqRepository = getRepository(FAQ);
    const faq = await faqRepository.findOne({ where: { id } });
    appAssert(faq, NOT_FOUND, "FAQ not found");
    return faq;
}

export const createFAQ = async (data: { question: string, answer: string }) => {
    const faqRepository = getRepository(FAQ);
    const faq = faqRepository.create(data);
    await faqRepository.save(faq);
    return faq;
}

export const updateFAQ = async (id: string, data: Partial<{ question: string; answer: string }>) => {
    const faqRepository = getRepository(FAQ);
    const faq = await getFAQById(id);
    Object.assign(faq, data);
    await faqRepository.save(faq);
    return faq;
}

export const deleteFAQ = async (id: string) => {
    const faqRepository = getRepository(FAQ);
    const faq = await getFAQById(id);
    await faqRepository.remove(faq);
    return faq;
}