import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import { FORBIDDEN } from "../constants/http";
import { verifyToken } from "../utils/jwt";
import { UserRole } from "../constants/userRole";

const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 3,
    [UserRole.POLICY]: 2,
    [UserRole.USER]: 1,
}

const verifyRole = (requiredRole: UserRole): RequestHandler => {
    return (req, res, next) => {
        const accessToken = req.cookies.accessToken as string | undefined;
        appAssert(accessToken, FORBIDDEN, "Missing access token");

        const { payload } = verifyToken(accessToken);
        appAssert(payload, FORBIDDEN, "Invalid token");

        const userRoleLevel = roleHierarchy[payload.role as UserRole];
        appAssert(userRoleLevel, FORBIDDEN, "Invalid user role");

        const requiredRoleLevel = roleHierarchy[requiredRole];
        appAssert(
            userRoleLevel >= requiredRoleLevel,
            FORBIDDEN,
            "Insufficient permissions"
        );

        req.role = payload.role;

        next();
    }
}

export default verifyRole;