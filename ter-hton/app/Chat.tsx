// components/Chat.js
import React, { useState, useEffect } from "react";
import {
    View,
    TextInput,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import io, { Socket } from "socket.io-client";

type Message = {
    id: string;
    text: string;
    senderId: string;
};

type ChatProps = {
    chatId: string;
    userId: string;
    socket: Socket;
};

const Chat = ({ chatId, userId, socket }: ChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        console.log("Joining chat with chatId:", chatId);

        // Присоединение к чату
        socket.emit("joinChat", chatId);

        // Получение истории сообщений
        socket.on("messageHistory", (chatMessages: Message[]) => {
            console.log("Received messageHistory:", chatMessages);
            setMessages(chatMessages || []);
        });

        // Получение новых сообщений
        socket.on("newMessage", (message: Message) => {
            console.log("Received newMessage:", message);
            setMessages((prev) => [...prev, message]);
        });

        // Обработка ошибок
        socket.on("error", (errorMessage: string) => {
            console.error("WebSocket error:", errorMessage);
        });

        // Очистка при размонтировании
        return () => {
            socket.off("messageHistory");
            socket.off("newMessage");
            socket.off("error");
        };
    }, [chatId, socket]);

    const sendMessage = () => {
        if (!input.trim()) return;

        // Формируем плоский объект для отправки
        const message = {
            chatId: chatId,
            text: input,
            senderId: userId,
        };
        console.log("Sending message:", message);
        socket.emit("sendMessage", message); // Отправляем плоский объект
        setInput("");
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-gray-100"
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <View className="flex-1 p-4">
                <ScrollView className="flex-1 mb-4">
                    {messages.length > 0 ? (
                        messages.map((msg) => (
                            <View
                                key={msg.id}
                                className={`p-3 mb-2 rounded-lg ${
                                    msg.senderId ? "bg-blue-200 self-start" : "bg-white self-end"
                                }`}
                            >
                                <Text className="text-base text-gray-800">
                                    {msg.senderId ? "Вы: " : "Полицай: "}
                                    {msg.text}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-center text-gray-500">Нет сообщений</Text>
                    )}
                </ScrollView>
                <View className="flex-row items-center mb-4">
                    <TextInput
                        className="flex-1 p-4 border border-gray-300 rounded-lg bg-white mr-2"
                        value={input}
                        onChangeText={setInput}
                        placeholder="Введите сообщение"
                    />
                    <TouchableOpacity
                        className="bg-blue-500 p-4 rounded-lg"
                        onPress={sendMessage}
                    >
                        <Text className="text-white font-medium">Отправить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default Chat;