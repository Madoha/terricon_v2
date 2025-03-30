import io, { Socket } from 'socket.io-client';

const SOCKET_URL = "http://192.168.0.163:4004";

let socket: Socket;

export const initSocket = () => {
    socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
};