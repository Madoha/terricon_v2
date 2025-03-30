import { Router } from "express";
import { getSessionsHandler, deleteSessionHandler } from "../controllers/session.controller";

const sessionRoutes = Router();

sessionRoutes.get("/", getSessionsHandler);
sessionRoutes.delete("/:id", deleteSessionHandler);

export default sessionRoutes;