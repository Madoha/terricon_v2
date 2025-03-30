import { CREATED, OK } from "../constants/http";
import { createIncident, getAllIncidents, getUserIncidents, getAllLessons } from "../services/incident.service";
import catchErrors from "../utils/catchErrors";
import { incidentSchema } from "./incident.schema";

export const createIncidentHandler = catchErrors(async (req, res) => {
    const data = incidentSchema.parse(req.body);
    const mediaFiles = (req.files as Express.Multer.File[]).filter(file =>
        file.fieldname.startsWith("media_")
    );

    const incident = await createIncident({
        ...data,
        mediaFiles,
        userId: data.isAnonymous ? undefined : req.userId
    });

    return res.status(CREATED).json(incident);
});

export const getUserIncidentsHandler = catchErrors(async (req, res) => {
    const incidents = await getUserIncidents(req.userId);
    return res.status(OK).json(incidents);
});

// admins only

export const getAllIncidentsHandler = catchErrors(async (req, res) => {
    const incidents = await getAllIncidents();
    return res.status(OK).json(incidents);
});

export const getAllLessonsHandler = catchErrors(async (req, res) => {
    const lessons = await getAllLessons();
    return res.status(OK).json(lessons);
});