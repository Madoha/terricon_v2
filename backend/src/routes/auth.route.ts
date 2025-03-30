import { Router } from "express";
import { 
    registerHandler, 
    loginHandler, 
    logoutHandler,
    refreshHandler,
    verifyEmailHandler,
    forgotPasswordHandler,
    resetPasswordHandler
 } from "../controllers/auth.controller";


const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.get('/refresh', refreshHandler);
authRoutes.get('/logout', logoutHandler);
authRoutes.get('/email/verify/:code', verifyEmailHandler);
authRoutes.post('/password/forgot', forgotPasswordHandler);
authRoutes.post('/password/reset', resetPasswordHandler);

export default authRoutes;