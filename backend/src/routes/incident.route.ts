import { Router } from "express";
import { createIncidentHandler, getAllIncidentsHandler, getUserIncidentsHandler, getAllLessonsHandler } from "../controllers/incident.controller";
import { UserRole } from "../constants/userRole";
import verifyRole from "../middleware/verifyRole";
import { upload } from "../utils/fileUpload";

const incidentRoutes = Router();

incidentRoutes.get("/", getUserIncidentsHandler);
incidentRoutes.post("/", upload.any(), createIncidentHandler);
incidentRoutes.get("/all", verifyRole(UserRole.POLICY), getAllIncidentsHandler); 
incidentRoutes.get("/learn", getAllLessonsHandler);

export default incidentRoutes;