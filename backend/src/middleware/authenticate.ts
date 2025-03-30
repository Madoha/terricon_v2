import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";
import { verifyToken } from "../utils/jwt";


const authenticate:RequestHandler = (req, res, next) => {
    const accessToken = req.cookies.accessToken as string|undefined;
    appAssert(accessToken, UNAUTHORIZED, "Not authenticated", AppErrorCode.InvalidAccessToken);

    const { error, payload } = verifyToken(accessToken || "");
    appAssert(payload, UNAUTHORIZED, error === 'jwt expired' ? "Token expired" : "Invalid token", AppErrorCode.InvalidAccessToken);

    // if (payload.userId) {
    req.userId = payload.userId as string;
    // }
    // if (payload.sessionId) {
    req.sessionId = payload.sessionId as string;
    // }
    next();
}

export default authenticate;