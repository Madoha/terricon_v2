// // src/services/queue.service.ts
// import Redis from 'ioredis';
// import { assignOperator } from './chat.service';

// const redis = new Redis(process.env.REDIS_URL!);

// redis.on('error', (err) => {
//     console.error('Redis error:', err);
// });

// redis.on('connect', () => {
//     console.log('Connected to Redis');
// });

// export const QueueService = {
//     addChatToQueue: async (chatId: string) => {
//         await redis.lpush('chat-queue', chatId);
//     },

//     getNextChat: async (operatorId: string) => {
//         const chatId = await redis.rpop('chat-queue');
//         if (!chatId) return null;
        
//         const chat = await assignOperator(chatId, operatorId);
//         return chat;
//     },

//     getQueueLength: async () => {
//         return await redis.llen('chat-queue');
//     },

//     removeFromQueue: async (chatId: string) => {
//         await redis.lrem('chat-queue', 0, chatId);
//     }
// };