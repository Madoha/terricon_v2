// src/controllers/chat.controller.ts
import { Request, Response } from "express";
import { createChat, sendMessage, joinChat, joinUserChat, getPendingChats, getPendingChatsUser } from "../services/chat.service";
import { getRepository } from "typeorm";
import { Chat } from "../entities/Chat";
import appAssert from "../utils/appAssert";
import { NOT_FOUND } from "../constants/http";

export const createChatHandler = async (req: Request, res: Response): Promise<void> => {
    const isAnonymous = req.body.isAnonymous ?? false;
    const chat = await createChat(req.userId, isAnonymous);
    res.status(201).json(chat);
};

export const sendMessageHandler = async (req: Request, res: Response): Promise<void> => {
    const { chatId, text } = req.body;
    const chatRepository = getRepository(Chat);
    const chat = await chatRepository.findOne({ where: { id: chatId }, relations: ["user", "officer"] });
    if (!chat) throw new Error("Чат не найден");

    const isUser = chat.user?.id === req.userId;
    const isOfficer = chat.officer?.id === req.userId;
    if (!isUser && !isOfficer) throw new Error("У вас нет доступа к этому чату");

    const message = await sendMessage(chatId, text, req.userId);
    res.status(201).json(message);
};

export const getChatsForPoliceHandler = async (req: Request, res: Response): Promise<void> => {
    const chats = await getPendingChats();
    res.status(200).json(chats);
};

export const getChatsForUserHandler = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    appAssert(userId, NOT_FOUND, "User not found");
    const chats = await getPendingChatsUser(userId);
    res.status(200).json(chats);
};

export const joinChatHandler = async (req: Request, res: Response): Promise<void> => {
    const { chatId } = req.body;
    const chat = await joinChat(chatId, req.userId);
    res.status(200).json(chat);
};

export const joinUserChatHandler = async (req: Request, res: Response): Promise<void> => {
    const { chatId } = req.body;
    const chat = await joinUserChat(chatId, req.userId);
    res.status(200).json(chat);
}