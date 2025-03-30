// import { getRepository } from 'typeorm';
// import { getIO } from '../config/socket';
// import { Chat } from '../entities/Chat';
// import { decrypt } from '../utils/crypto';
// import { QueueService } from './queue.service';
// import { sendMessage } from './chat.service';

// export const setupSocketHandlers = () => {
//     const io = getIO();

//     io.on('connection', (socket) => {
//         // Присоединение к чатам пользователя
//         socket.on('join-chats', async () => {
//             const user = socket.data.user;
//             const chats = await getRepository(Chat)
//                 .find({ where: [{ user: user.id }, { operator: user.id }] });

//             chats.forEach(chat => {
//                 socket.join(`chat-${chat.id}`);
//             });
//         });

//         // Обработка новых сообщений
//         socket.on('send-message', async ({ chatId, content, isOperator }) => {
//             try {
//                 const message = await sendMessage(
//                     chatId,
//                     socket.data.user.id,
//                     content,
//                     isOperator
//                 );
                
//                 // Исправить дешифровку
//                 const decryptedContent = message.encrypted 
//                     ? decrypt({
//                         iv: message.content.split(':')[0],
//                         content: message.content.split(':')[1]
//                       })
//                     : message.content;
        
//                 io.to(`chat-${chatId}`).emit('new-message', {
//                     ...message,
//                     content: decryptedContent
//                 });
//             } catch (error) {
//                 console.error("Error sending message:", error);
//             }
//         });

//         // Уведомления для операторов
//         socket.on('subscribe-queue', async () => {
//             const queueLength = await QueueService.getQueueLength();
//             socket.emit('queue-update', queueLength);
//         });
//     });
// };