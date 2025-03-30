import { getConnection, getRepository } from "typeorm";
import { Incident } from "../entities/Incident";
import { Media } from "../entities/Media";
import { User } from "../entities/User";
import { NOT_FOUND, UNAUTHORIZED } from "../constants/http";
import appAssert from "../utils/appAssert";

interface CreateIncidentData {
    description: string;
    latitude?: number;
    longitude?: number;
    timestamp: Date;
    address?: string;
    isAnonymous: boolean;
    userId?: string;
    mediaFiles?: Express.Multer.File[];
}

export const createIncident = async (params: CreateIncidentData) => {
    const { description, latitude, longitude, timestamp, address, mediaFiles, userId, isAnonymous } = params;

    const userRepository = getRepository(User);
    const incidentRepository = getRepository(Incident);
    const mediaRepository = getRepository(Media);

    const incidentData: Partial<Incident> = {
        description,
        latitude,
        longitude,
        timestamp,
        address,
        isAnonymous
    };

    if (!isAnonymous && userId) {
        const user = await userRepository.findOne({ where: { id: userId } });
        appAssert(user, UNAUTHORIZED, "User not found");
        incidentData.user = user;
    }

    const incident = incidentRepository.create(incidentData);
    const savedIncident = await incidentRepository.save(incident);

    let mediaEntities: Media[] = [];
    if (mediaFiles && mediaFiles.length > 0) {
        mediaEntities = mediaFiles.map(file => {
            const media = mediaRepository.create({
                url: `/uploads/${file.filename}`,
                type: file.mimetype,
                incident: savedIncident,
            });
            return media;
        });
    }

    await mediaRepository.save(mediaEntities);

    return savedIncident;
};


export const getUserIncidents = async (userId: string) => {
    const incidentRepository = getRepository(Incident);
    return incidentRepository.find({
        where: { user: { id: userId }, isAnonymous: false },
        relations: ["mediaFiles"],
    });
};

export const getAllIncidents = async () => {
    const incidentRepository = getRepository(Incident);
    return incidentRepository.find({ relations: ["mediaFiles"] });
};

export const getAllLessons = async () => {
    const connection = getConnection();
    const news = await connection.query("SELECT * FROM news");
    return news;
};