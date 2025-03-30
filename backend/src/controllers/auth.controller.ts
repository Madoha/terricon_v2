import catchErrors from "../utils/catchErrors";
import { createAccount, loginUser, refreshUserAccessToken, resetPassword, sendForgotPasswordEmail, verifyEmail } from '../services/auth.service';
import { CREATED, OK, UNAUTHORIZED } from '../constants/http';
import { clearAuthCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthCookies } from '../utils/cookies';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verificationCodeSchema } from './auth.schemas';
import { verifyToken } from "../utils/jwt";
import appAssert from "../utils/appAssert";
import { getRepository } from "typeorm";
import { Session } from "../entities/Session"; 

export const registerHandler = catchErrors(async (req, res) => {
        const request = registerSchema.parse({
            ...req.body,
            userAgent: req.headers["user-agent"],
        });

        const { user } = await createAccount(request);

        return res
            .status(CREATED)
            .json(user);
    }
)

export const loginHandler = catchErrors(async (req, res) => {
        const request = loginSchema.parse({...req.body, userAgent: req.headers["user-agent"]});
        const { user, accessToken, refreshToken } = await loginUser(request);

        return setAuthCookies({res, accessToken, refreshToken}).status(OK).json({
            message: "Login successful",
        });
    }
)

export const logoutHandler = catchErrors(async (req, res) => {
        const accessToken = req.cookies.accessToken as string|undefined;
        const { payload, } = verifyToken(accessToken || "");

        if (payload) {
            const sessionRepository = getRepository(Session);
            await sessionRepository.delete({ id: payload.sessionId });
        }

        return clearAuthCookies(res)
            .status(OK).json({
                message: "Logout successful",
            })
    }
)

export const refreshHandler = catchErrors(async (req, res) => {
        const refreshToken = req.cookies.refreshToken as string|undefined;
        appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

        const {
            accessToken,
            newRefreshToken
        } = await refreshUserAccessToken(refreshToken);

        if (newRefreshToken) res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());

        return res
            .status(OK)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
            .json({
                message: "Access token refreshed",
        })
    }
)

export const verifyEmailHandler = catchErrors(async (req, res) => {
        const verificationCode = verificationCodeSchema.parse(req.params.code);

        await verifyEmail(verificationCode);

        return res.status(OK).json({
            message: "Emailwas successfully verified",
        });
    }
)

export const forgotPasswordHandler = catchErrors(async (req, res) => {
        const email = forgotPasswordSchema.parse(req.body.email);

        await sendForgotPasswordEmail(email);

        return res.status(OK).json({
            message: "Password reset email sent",
        });
    }
)

export const resetPasswordHandler = catchErrors(async (req, res) => {
        const request = resetPasswordSchema.parse(req.body);

        await resetPassword(request);

        return clearAuthCookies(res).status(OK).json({
            message: "Password reset successfully",
        });
    }
)