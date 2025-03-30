import { Router } from "express";
import { createFAQHandler, deleteFAQHandler, getAllFAQsHandler, getFAQByIdHandler, updateFAQHandler } from "../controllers/faq.controller";
import verifyRole from "../middleware/verifyRole";
import { UserRole } from "../constants/userRole";

const faqRoutes = Router();

faqRoutes.get("/", getAllFAQsHandler);
faqRoutes.get("/:id", getFAQByIdHandler);
faqRoutes.post("/", verifyRole(UserRole.ADMIN), createFAQHandler);
faqRoutes.put("/:id",verifyRole(UserRole.ADMIN), updateFAQHandler);
faqRoutes.delete("/:id", verifyRole(UserRole.ADMIN), deleteFAQHandler);

export default faqRoutes;