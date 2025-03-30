// services/chat.service.ts
import { getRepository, Not } from "typeorm";
import { Chat } from "../entities/Chat";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { ChatStatus } from "../constants/chatStatus";
import { UserRole } from "../constants/userRole";
import * as crypto from "crypto";

const ENCRYPTION_KEY = Buffer.from("12345678901234567890123456789012", "utf8");
const IV_LENGTH = 16;

export const encryptText = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decryptText = (text: string): string => {
    const [iv, encryptedText] = text.split(":").map(part => Buffer.from(part, "hex"));
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

export const createChat = async (userId?: string, isAnonymous: boolean = false) => {
    const chatRepository = getRepository(Chat);
    const userRepository = getRepository(User);

    const chatData: Partial<Chat> = { isAnonymous, status: ChatStatus.OPEN };

    if (!isAnonymous && userId) {
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");
        chatData.user = user;
    }

    const chat = chatRepository.create(chatData);
    return chatRepository.save(chat);
};

export const sendMessage = async (chatId: string, text: string, senderId?: string): Promise<Message> => {
    const chatRepository = getRepository(Chat);
    const messageRepository = getRepository(Message);
    const userRepository = getRepository(User);

    const chat = await chatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new Error("Чат не найден");

    const sender = senderId ? await userRepository.findOne({ where: { id: senderId } }) : undefined;

    const encryptedText = encryptText(text);

    const message = messageRepository.create({
        text: encryptedText,
        chat,
        sender: sender || undefined,
        createdAt: new Date(),
    });

    return messageRepository.save(message);
};

export const getPendingChats = async (): Promise<Chat[]> => {
    const chatRepository = getRepository(Chat);
    return chatRepository.find({ where: { status: Not(ChatStatus.CLOSED) }, relations: ["user"] });
};


export const getPendingChatsUser = async (userId: string): Promise<Chat[]> => {
    const chatRepository = getRepository(Chat);
    return chatRepository.find({ where: { user: { id: userId }, status: Not(ChatStatus.CLOSED) }, relations: ["user"] });
};

export const joinChat = async (chatId: string, officerId: string): Promise<Chat> => {
    const chatRepository = getRepository(Chat);
    const userRepository = getRepository(User);

    const chat = await chatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new Error("Чат не найден");

    const officer = await userRepository.findOne({ where: { id: officerId, role: UserRole.POLICY } });
    if (!officer) throw new Error("Офицер не найден или не имеет прав");

    if (chat.status !== ChatStatus.OPEN && chat.status !== ChatStatus.IN_PROGRESS) throw new Error("Чат уже активен или закрыт");

    chat.status = ChatStatus.IN_PROGRESS;
    chat.officer = officer;
    return chatRepository.save(chat);
};

export const joinUserChat = async (chatId: string, officerId: string): Promise<Chat> => {
    const chatRepository = getRepository(Chat);
    const userRepository = getRepository(User);

    const chat = await chatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new Error("Чат не найден");

    // const officer = await userRepository.findOne({ where: { id: officerId, role: UserRole.POLICY } });
    // if (!officer) throw new Error("Офицер не найден или не имеет прав");

    // if (chat.status !== ChatStatus.OPEN) throw new Error("Чат уже активен или закрыт");

    // chat.status = ChatStatus.IN_PROGRESS;
    // chat.officer = officer;
    return chatRepository.save(chat);
};
