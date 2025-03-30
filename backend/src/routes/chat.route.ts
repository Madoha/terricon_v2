import { Router } from 'express';
import { createChatHandler, getChatsForPoliceHandler, joinUserChatHandler, getChatsForUserHandler, joinChatHandler, sendMessageHandler } from '../controllers/chat.controller';
import authenticate from '../middleware/authenticate';
import verifyRole from '../middleware/verifyRole';
import { UserRole } from '../constants/userRole';

const chatRoutes = Router();

chatRoutes.post("/", authenticate, createChatHandler);
chatRoutes.post("/messages", authenticate, sendMessageHandler);
chatRoutes.get("/pending", authenticate, verifyRole(UserRole.POLICY), getChatsForPoliceHandler);
chatRoutes.get("/pending-user", authenticate, getChatsForUserHandler);
chatRoutes.post("/join", authenticate, verifyRole(UserRole.POLICY), joinChatHandler);
chatRoutes.post("/join-user", authenticate, joinUserChatHandler);

export default chatRoutes;