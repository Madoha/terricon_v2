// src/index.ts
import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectToDatabase from "./config/db";
import { PORT, NODE_ENV, APP_ORIGIN } from "./constants/env";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";
import { OK } from "./constants/http";
import authRoutes from "./routes/auth.route";
import chatRoutes from "./routes/chat.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";
import faqRoutes from "./routes/faq.route";
import incidentRoutes from "./routes/incident.route";
import { getRepository } from "typeorm";
import { Chat } from "./entities/Chat";
import { Message } from "./entities/Message";
import { User } from "./entities/User";
import { decryptText, sendMessage } from "./services/chat.service";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: APP_ORIGIN,
        credentials: true,
        methods: ["GET", "POST"],
    },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: APP_ORIGIN,
        credentials: true,
    })
);
app.use(cookieParser());

// WebSocket без аутентификации
io.on("connection", (socket) => {
    console.log("Пользователь подключился (без аутентификации)");

    socket.on("joinChat", async (data: { chatId: string; userId: string }) => {
        const { chatId, userId } = data;
        console.log(`Пользователь ${userId} пытается присоединиться к чату ${chatId}`);
        const chatRepository = getRepository(Chat);
        const chat = await chatRepository.findOne({ where: { id: chatId }, relations: ["user", "officer"] });
        if (!chat) {
            console.error(`Чат ${chatId} не найден`);
            socket.emit("error", "Чат не найден");
            return;
        }

        const isUser = chat.user?.id === userId;
        const isOfficer = chat.officer?.id === userId;
        if (!isUser && !isOfficer) {
            console.error(`Пользователь ${userId} не имеет доступа к чату ${chatId}`);
            socket.emit("error", "У вас нет доступа к этому чату");
            return;
        }

        socket.join(chatId);
        console.log(`Пользователь ${userId} присоединился к чату ${chatId}`);

        const messageRepository = getRepository(Message);
        const messages = await messageRepository.find({ where: { chat: { id: chatId } }, relations: ["sender"] });
        const decryptedMessages = messages.map((msg) => ({
            id: msg.id,
            chatId: chatId,
            text: decryptText(msg.text),
            senderId: msg.sender?.id || null,
            createdAt: msg.createdAt,
        }));
        socket.emit("messageHistory", decryptedMessages);
    });

    socket.on("sendMessage", async (data: { chatId: string; text: string; userId: string }) => {
        const { chatId, text, userId } = data;
        console.log(`Пользователь ${userId} отправляет сообщение в чат ${chatId}`);

        if (!text || typeof text !== "string" || text.trim() === "") {
            console.error("Текст сообщения обязателен");
            socket.emit("error", "Текст сообщения обязателен");
            return;
        }

        try {
            const message = await sendMessage(chatId, text, userId);
            const decryptedText = decryptText(message.text);
            io.to(chatId).emit("newMessage", {
                id: message.id,
                chatId,
                text: decryptedText,
                senderId: message.sender?.id || null,
                createdAt: message.createdAt,
            });
        } catch (error) {
            console.error(`Ошибка при отправке сообщения: ${(error as Error).message}`);
            socket.emit("error", (error as Error).message);
        }
    });

    // socket.on("emergencyUpdate", (data: any) => {
    //     console.log(`Получено событие emergencyUpdate от клиента: ${JSON.stringify(data)}`);
    // });

    socket.on("disconnect", () => {
        console.log("Пользователь отключился");
    });

    socket.on("error", (error) => {
        console.error(`WebSocket ошибка: ${error.message}`);
    });
});

app.post("/emergency", catchErrors(async (req, res, next) => {
    const emergencyData = req.body;

    // Валидация данных
    if (!emergencyData || typeof emergencyData !== "object" || !emergencyData.title || !emergencyData.body) {
        console.error("Некорректные данные о ЧП:", emergencyData);
        return res.status(400).json({ status: "error", message: "Некорректные данные о ЧП" });
    }

    console.log("Получены данные о ЧП от Python:", emergencyData);

    // Транслируем данные о ЧП всем подключённым клиентам
    io.emit("emergencyUpdate", emergencyData);

    return res.status(OK).json({
        status: "success",
        message: "Данные о ЧП приняты и переданы клиентам",
    });
}));

app.get("/", catchErrors(async (req, res, next) => {
    return res.status(OK).json({
        status: "working",
    });
}));

app.use("/uploads", express.static("uploads"));

app.use("/auth", authRoutes);
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);
app.use("/faqs", authenticate, faqRoutes);
app.use("/incidents", authenticate, incidentRoutes);
app.use("/chats", authenticate, chatRoutes);

app.use(errorHandler);

server.listen(Number(PORT), "0.0.0.0", async () => {
    console.log(`Server is running on ${PORT} in ${NODE_ENV} env.`);
    await connectToDatabase();
});