import { NOT_FOUND, OK } from "../constants/http";
import appAssert from "../utils/appAssert";
import { getRepository } from "typeorm";
import { User } from "../entities/User";
import catchErrors from "../utils/catchErrors";
import { userSchema } from "./user.schema";
import { updateUser } from "../services/user.service";


export const getUserHandler = catchErrors(async (req, res) => {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.userId.toString() } });
    appAssert(user, NOT_FOUND, "User not found");
    return res.status(OK).json(user.omitPassword());
});

export const getAllUsersHandler = catchErrors(async (req, res) => {
    const userRepository = getRepository(User);
    const users = await userRepository.find();
    return res.status(OK).json(users.map(user => user.omitPassword()));
});

export const updateUserhandler = catchErrors(async (req, res) => {
    const data = userSchema.partial().parse(req.body);
    const user = await updateUser(req.userId, data);
    return res.status(OK).json(user);
});