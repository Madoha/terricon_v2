import { APP_ORIGIN } from "../constants/env";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constants/http";
import VerificationCodeType from "../constants/verificationCodeTypes";
import appAssert from "../utils/appAssert";
import { hashValue } from "../utils/bcrypt";
import { fiveMinutesAge, ONE_DAY_MS, oneHourFromNow, oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../utils/emailTemplates";
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt";
import { sendMail } from "../utils/sendMail";
import { getRepository } from "typeorm";
import { User } from "../entities/User";
import { Session } from "../entities/Session";
import { VerificationCode } from "../entities/VerificationCode";
import { MoreThan } from "typeorm";
import { UserRole } from "../constants/userRole";

export type CreateAccountParams = {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    region?: string;
    role: string;
    userAgent?: string;
};

export const createAccount = async (data: CreateAccountParams) => {
    const userRepository = getRepository(User);
    const verificationCodeRepository = getRepository(VerificationCode);
    const sessionRepository = getRepository(Session);

    const existingUser = await userRepository.findOne({ where: { email: data.email } });
    appAssert(
        !existingUser, CONFLICT, "Email already in use"
    )

    const hashedPassword = await hashValue(data.password);
    const user = userRepository.create({ 
        ...data,
        password: hashedPassword,
        role: data.role as UserRole,
    });
    await userRepository.save(user);

    const verificationCode = await verificationCodeRepository.create({
        user,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow()
    })
    await verificationCodeRepository.save(verificationCode);

    const url = `${APP_ORIGIN}/email/verify/${verificationCode.id}`;
    const { error } = await sendMail({ to: user.email, ...getVerifyEmailTemplate(url) });
    if (error) console.error("Failed to send verification email:", error);

    const session = sessionRepository.create({
        user,
        userAgent: data.userAgent,
        expiresAt: thirtyDaysFromNow()
    });
    await sessionRepository.save(session);

    // const refreshToken = signToken({ sessionId: session.id }, refreshTokenSignOptions);
    // const accessToken = signToken({ userId: user.id, sessionId: session.id, role: user.role });

    return { user: user.omitPassword() };
}

export type LoginParams = {
    email: string;
    password: string;
    userAgent?: string;
};

export const loginUser = async ({ email, password, userAgent }:LoginParams) => {
    const userRepository = getRepository(User);
    const sessionRepository = getRepository(Session);

    const user = await userRepository.findOne({ where: { email } });
    appAssert(user, UNAUTHORIZED, "Invalid email or password");

    const isValidPassword = await user.comparePassword(password);
    appAssert(isValidPassword, UNAUTHORIZED, "Invalid email or password");

    const session = sessionRepository.create({ user, userAgent, expiresAt: thirtyDaysFromNow() });
    await sessionRepository.save(session);

    const refreshToken = signToken({ sessionId: session.id }, refreshTokenSignOptions);
    const accessToken = signToken({ userId: user.id, sessionId: session.id, role: user.role });

    return { user: user.omitPassword(), accessToken, refreshToken };
}

export const refreshUserAccessToken = async (refreshToken: string) => {
    const sessionRepository = getRepository(Session);
    const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, { secret: refreshTokenSignOptions.secret });
    appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

    const sessionId = payload.sessionId as string;
    // appAssert(typeof sessionId === 'string', UNAUTHORIZED, "Invalid session ID");

    const session = await sessionRepository.findOne({ where: { id: sessionId } });
    const now = Date.now();
    appAssert(session && session.expiresAt.getTime() > now, UNAUTHORIZED, "Session expired");

    const sessionNeedsRefresh = session.expiresAt.getTime() - now < ONE_DAY_MS;
    if (sessionNeedsRefresh) {
        session.expiresAt = thirtyDaysFromNow();
        await sessionRepository.save(session);
    }

    const newRefreshToken = sessionNeedsRefresh ? signToken({ sessionId: session.id }, refreshTokenSignOptions) : undefined;
    const accessToken = signToken({ userId: session.user.id, sessionId: session.id });

    return { accessToken, newRefreshToken };
}

export const verifyEmail = async (verificationCode: string) => {
    const verificationCodeRepository = getRepository(VerificationCode);
    const userRepository = getRepository(User);

    const verifyCode = await verificationCodeRepository.findOne({
        where: {
            id: verificationCode,
            type: VerificationCodeType.EmailVerification,
            expiresAt: MoreThan(new Date())
        }
    });
    appAssert(verifyCode, NOT_FOUND, "Invalid or expired verification code");

    const updatedUser = await userRepository.findOne({ where: { id: verifyCode.user.id } });
    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");
    updatedUser.verified = true;
    await userRepository.save(updatedUser);

    await verificationCodeRepository.delete(verifyCode.id);

    return { user: updatedUser.omitPassword() };
}

export const sendForgotPasswordEmail = async (email: string) => {
    const userRepository = getRepository(User);
    const verificationCodeRepository = getRepository(VerificationCode);

    const user = await userRepository.findOne({ where: { email } });
    appAssert(user, NOT_FOUND, "User not found");

    const fiveMinAge = fiveMinutesAge();
    const count = await verificationCodeRepository.count({
        where: {
            user: { id: user.id },
            type: VerificationCodeType.PasswordReset,
            createdAt: MoreThan(fiveMinAge)
        }
    });
    appAssert(count <= 1, TOO_MANY_REQUESTS, "Too many requests, please try again later");

    const expiresAt = oneHourFromNow();
    const verificationCode = verificationCodeRepository.create({
        user,
        type: VerificationCodeType.PasswordReset,
        expiresAt
    });
    await verificationCodeRepository.save(verificationCode);

    const url = `${APP_ORIGIN}/password/reset?code=${verificationCode.id}&exp=${expiresAt.getTime()}`;
    const { data, error } = await sendMail({ to: user.email, ...getPasswordResetTemplate(url) });
    appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);

    return { url, emailId: data?.id };
}

type ResetPasswordParams = {
    password: string;
    verificationCode: string;
}

export const resetPassword = async (
    { password, verificationCode }:ResetPasswordParams
) => {
    const verificationCodeRepository = getRepository(VerificationCode);
    const userRepository = getRepository(User);
    const sessionRepository = getRepository(Session);

    const validCode = await verificationCodeRepository.findOne({
        where: {
            id: verificationCode,
            type: VerificationCodeType.PasswordReset,
            expiresAt: MoreThan(new Date())
        }
    });
    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

    const updatedUser = await userRepository.findOne({ where: { id: validCode.user.id } });
    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");
    updatedUser.password = await hashValue(password);
    await userRepository.save(updatedUser);

    await verificationCodeRepository.delete(validCode.id);
    await sessionRepository.delete({ user: { id: updatedUser.id } });

    return { user: updatedUser.omitPassword() };
}