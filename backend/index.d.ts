import mongoose from "mongoose";

declare global {
    namespace Express {
        interface Request {
            userId: string;
            sessionId: string;
            role: string;
            user?: User
        }
    }
}
export {};