import { getRepository } from "typeorm";
import { User } from "../entities/User";
import appAssert from "../utils/appAssert";
import { NOT_FOUND } from "../constants/http";

export const getUserById = async (id: string) => {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id }})
    appAssert(user, NOT_FOUND, `User not found with id: ${id}`);
    return user;
}

export const updateUser = async (id: string, data: Partial<{ firstName: string, lastName: string, phoneNumber: string, address: string, region: string, city: string }>) => {
    const userRepository = getRepository(User);
    const user = await getUserById(id);
    appAssert(user, NOT_FOUND, "User not found");
    Object.assign(user, data);
    await userRepository.save(user);
    return user;
}
