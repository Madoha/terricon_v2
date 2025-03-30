// components/UserChat.tsx
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
    View,
    TextInput,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { Socket } from "socket.io-client";
import {useNavigation} from "@react-navigation/native";


type Message = {
    id: string;
    chatId: string;
    text: string;
    senderId: string | null;
};

type UserChatProps = {
    chatId: string;
    userId: string;
    isAnonymous: boolean;
    socket: Socket;
};

const UserChat: React.FC<UserChatProps> = ({ chatId, userId, isAnonymous, socket }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const router = useRouter();
    const navigation = useNavigation();

    useEffect(() => {
        console.log("Joining chat with chatId:", chatId);

        // Присоединение к чату с передачей userId
        socket.emit("joinChat", { chatId, userId });

        socket.on("messageHistory", (chatMessages: Message[]) => {
            console.log("Received messageHistory:", chatMessages);
            setMessages(chatMessages || []);
        });

        socket.on("newMessage", (message: Message) => {
            console.log("Received newMessage:", message);
            setMessages((prev) => [...prev, message]);
        });

        socket.on("error", (errorMessage: string) => {
            console.error("WebSocket error:", errorMessage);
            Alert.alert("Ошибка", errorMessage);
        });

        return () => {
            socket.off("messageHistory");
            socket.off("newMessage");
            socket.off("error");
        };
    }, [chatId, socket, userId]);

    const sendMessage = () => {
        if (!input.trim()) {
            Alert.alert("Ошибка", "Введите текст сообщения");
            return;
        }

        const message = {
            chatId,
            text: input,
            userId,
        };
        console.log("Sending message:", message);
        socket.emit("sendMessage", message);
        setInput("");
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
        >
            <View className="flex-1 px-4 mb-8">
                <ScrollView className="flex-1 mb-4 mt-4">
                    {messages.length > 0 ? (
                        messages.map((msg) => (
                            <View
                                key={msg.id}
                                className={`p-3 mb-2 rounded-lg ${
                                    msg.senderId === userId ? "bg-white self-end" : "bg-blue-200 self-start"
                                }`}
                            >
                                <Text className="text-base text-gray-800">
                                    {msg.senderId ? `Пользователь ${msg.senderId}: ` : "Аноним: "}
                                    {msg.text}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-center text-gray-500">Нет сообщений</Text>
                    )}
                </ScrollView>
                <View className="flex-row items-center mb-2">
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

export default UserChat;
