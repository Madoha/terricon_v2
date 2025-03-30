import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { Socket } from "socket.io-client";
import UserChat from "./UserChat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth} from "@/context/AuthContext";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

type Chat = {
    id: string;
    isAnonymous: boolean;
    user?: {
        id: string;
    };
};

type PoliceDashboardProps = {
    officerId: string;
    socket: Socket;
};

const PoliceDashboard: React.FC<PoliceDashboardProps> = ({ officerId, socket }) => {
    const [pendingChats, setPendingChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const {token} = useAuth();
    const navigation = useNavigation();
    const router = useRouter();

    const fetchPendingChats = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://192.168.0.163:4004/chats/pending", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const chats: Chat[] = await response.json();
            setPendingChats(chats);
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось загрузить чаты");
            console.error("Fetch pending chats error:", error);
        } finally {
            setLoading(false);
        }
    };

    const joinChat = async (chatId: string) => {
        try {
            const response = await fetch("http://192.168.0.163:4004/chats/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId }),
            });
            if (response.ok) {
                setSelectedChatId(chatId);
            } else {
                Alert.alert("Ошибка", "Не удалось присоединиться к чату");
            }
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось присоединиться к чату");
            console.error("Join chat error:", error);
        }
    };

    useEffect(() => {
        fetchPendingChats();
        const interval = setInterval(fetchPendingChats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (selectedChatId) {
        return <UserChat chatId={selectedChatId} userId={officerId} isAnonymous={false} socket={socket} />;
    }

    const handleLeaveChat = () => {
        Alert.alert(
            "Выход из чата",
            "Вы уверены, что хотите выйти?",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Выйти",
                    onPress: () => router.push({
                        pathname: '/(tabs)/chat',
                        params: { animation: 'slide_from_left' }
                    })
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-gray-100">
            {/* Заголовок с кнопкой назад */}
            <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-800">Ожидающие чаты</Text>
            </View>

            {/* Основное содержимое */}
            <View className="flex-1 p-4 mb-2">
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text className="mt-2 text-gray-500">Загрузка...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={pendingChats}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View className="p-2 border-b border-gray-300 bg-white rounded-lg mb-2">
                                <Text className="text-base text-gray-700">
                                    {item.isAnonymous ? "Анонимный пользователь" : `Пользователь ${item.user?.id}`}
                                </Text>
                                <TouchableOpacity
                                    className="mt-2 bg-blue-500 py-2 px-4 rounded-lg"
                                    onPress={() => joinChat(item.id)}
                                >
                                    <Text className="text-white text-center font-medium">Присоединиться</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text className="text-center text-gray-500 mt-4">Нет ожидающих чатов</Text>
                        }
                    />
                )}
            </View>
            <View className="mb-6">
                <TouchableOpacity
                    className="bg-red-500 py-4 px-4 rounded-lg"
                    onPress={handleLeaveChat}
                >
                    <Text className="text-white text-center font-medium">Выйти из чата</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PoliceDashboard;