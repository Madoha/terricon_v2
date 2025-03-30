import { Router } from "express";
import { 
    getUserHandler,
    getAllUsersHandler,
    updateUserhandler
} from "../controllers/user.controller";
import authenticate from "../middleware/authenticate";
import verifyRole from "../middleware/verifyRole";
import { UserRole } from "../constants/userRole";

const userRoutes = Router();

userRoutes.get("/", authenticate, getUserHandler);
userRoutes.get("/users", authenticate, verifyRole(UserRole.ADMIN), getAllUsersHandler);
userRoutes.put("/", authenticate, updateUserhandler);

export default userRoutes;