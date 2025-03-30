// import { RequestHandler } from "express";
// import appAssert from "../utils/appAssert";
// import { FORBIDDEN } from "../constants/http";

// export const checkAnonymity: RequestHandler = (req, res, next) => {
//     const { isAnonymous } = req.body;
    
//     if (!isAnonymous) {
//         appAssert(
//             req.user?.verified, 
//             FORBIDDEN, 
//             'You must verify your account to use non-anonymous chat'
//         );
//     }
    
//     next();
// };