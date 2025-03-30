// import { Server } from 'socket.io';
// import { Server as HttpServer } from 'http';
// import { getRepository } from 'typeorm';
// import { User } from '../entities/User';
// import { verifyToken } from '../utils/jwt';
// import { createChat, sendMessage } from '../services/chat.service';
// import { UserRole } from '../constants/userRole';
// import { QueueService } from '../services/queue.service';

// let io: Server;

// export const initWebSocket = (server: HttpServer) => {
//     io = new Server(server, {
//         cors: {
//             origin: process.env.APP_ORIGIN,
//             credentials: true
//         }
//     });

//     io.use(async (socket, next) => {
//         try {
//             const token = socket.handshake.auth.token;
//             const { payload } = verifyToken(token);
//             if (!payload) {
//                 throw new Error("Unauthorized");
//             }
//             const user = await getRepository(User).findOne({ where: { id: payload.userId } });
//             if (user) {
//                 socket.data.user = user;
//                 next();
//             } else {
//                 next(new Error("Unauthorized"));
//             }
//         } catch (error) {
//             next(new Error("Unauthorized"));
//         }
//     });

//     return io;
// };

// export const getIO = () => {
//     if (!io) throw new Error('Socket.io not initialized!');
//     return io;
// };

// export const setupSocketHandlers = () => {
//     const io = getIO();

//     io.on('connection', (socket) => {
//         console.log(`User connected: ${socket.data.user?.email}`);

//         let typingTimeout: NodeJS.Timeout;

//         socket.on('typing-start', (chatId) => {
//             socket.to(`chat-${chatId}`).emit('user-typing', {
//                 userId: socket.data.user.id,
//                 isTyping: true
//             });
    
//             clearTimeout(typingTimeout);
//             typingTimeout = setTimeout(() => {
//                 socket.to(`chat-${chatId}`).emit('user-typing', {
//                     userId: socket.data.user.id,
//                     isTyping: false
//                 });
//             }, 2000);
//         });
    
//         socket.on('typing-stop', (chatId) => {
//             clearTimeout(typingTimeout);
//             socket.to(`chat-${chatId}`).emit('user-typing', {
//                 userId: socket.data.user.id,
//                 isTyping: false
//             });
//         });

//         if (socket.data.user.role === UserRole.POLICY) {
//             socket.on('request-chat', async () => {
//                 try {
//                     const chat = await QueueService.getNextChat(socket.data.user.id);
//                     if (chat) {
//                         socket.emit('chat-assigned', chat);
//                     } else {
//                         socket.emit('no-chats-available');
//                     }
//                 } catch (error) {
//                     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//                     socket.emit('error', { message: errorMessage });
//                 }
//             });
//         }

//         socket.on('join-user-room', () => {
//             socket.join(`user-${socket.data.user.id}`);
//             console.log(`User ${socket.data.user.email} joined their room`);
//         });

//         socket.on('join-chat', (chatId) => {
//             socket.join(`chat-${chatId}`);
//             console.log(`User joined chat ${chatId}`);
//         });

//         socket.on('create-chat', async (data) => {
//             try {
//                 const chat = await createChat(
//                     socket.data.user.id,
//                     data.isAnonymous,
//                     data.displayName
//                 );
//                 socket.emit('chat-created', chat);
//             } catch (error) {
//                 const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//                 socket.emit('error', { message: errorMessage });
//             }
//         });

//         socket.on('send-message', async ({ chatId, content }) => {
//             try {
//                 const isOperator = socket.data.user.role === UserRole.POLICY;
//                 await sendMessage(
//                     chatId,
//                     socket.data.user.id,
//                     content,
//                     isOperator
//                 );
//             } catch (error) {
//                 const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//                 socket.emit('error', { message: errorMessage });
//             }
//         });

//         socket.on('disconnect', () => {
//             console.log(`User disconnected: ${socket.data.user?.email}`);
//         });
//     });
// };