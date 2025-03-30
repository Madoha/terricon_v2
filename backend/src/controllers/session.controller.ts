import { z } from "zod";
import { OK } from "../constants/http";
import { getRepository } from "typeorm";
import { Session } from "../entities/Session";
import { MoreThan } from "typeorm";
import catchErrors from "../utils/catchErrors";
import appAssert from "../utils/appAssert";

export const getSessionsHandler = catchErrors(async (req, res) => {
    const sessionRepository = getRepository(Session);
    const userId = req.userId.toString();
    const sessions = await sessionRepository.find({
        where: {
            user: { id: userId },
            expiresAt: MoreThan(new Date())
        },
        select: ["id", "userAgent", "createdAt"],
        order: { createdAt: "DESC" }
    });
    return res.status(OK).json(
        sessions.map((session) => ({
            id: session.id,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            ...(session.id.toString() === req.sessionId.toString() && { isCurrent: true })
        }))
    );
});

export const deleteSessionHandler = catchErrors(async (req, res) => {
    const sessionRepository = getRepository(Session);
    const sessionId = z.string().parse(req.params.id);
    const result = await sessionRepository.delete({ id: sessionId, user: { id: req.userId.toString() } });
    appAssert(result.affected && result.affected > 0, 404, "Session not found or already deleted");
    return res.status(OK).json({ message: "Session deleted successfully" });
});