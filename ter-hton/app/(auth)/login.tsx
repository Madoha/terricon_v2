import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import api from "../api/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import {jwtDecode} from 'jwt-decode';
import {useUser} from "@/context/UserContext";

interface DecodedToken {
    userId: string;
}

export default function Login() {
    const { setToken } = useAuth();
    const { setUserId } = useUser();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        try {
            const response = await api.post("auth/login", { email, password });
            if (response.status === 200) {
                // Получаем токен из cookies ответа
                const cookieHeader = response.headers['set-cookie'];
                const accessToken = cookieHeader?.find(c => c.includes('accessToken'))?.split(';')[0].split('=')[1];

                if (accessToken) {
                    try {
                        // Декодируем токен
                        const decodedToken = jwtDecode<DecodedToken>(accessToken);

                        // Проверяем наличие userId в декодированном токене
                        if (!decodedToken.userId) {
                            throw new Error("userId не найден в токене");
                        }

                        // Сохраняем токен через AuthContext
                        await setToken(accessToken);

                        // Сохраняем user ID из декодированного токена
                        await setUserId(decodedToken.userId);

                        // Переходим на страницу профиля
                        router.push("/profile");
                    } catch (error) {
                        console.error("Ошибка декодирования токена:", error);
                        Alert.alert("Ошибка", "Не удалось обработать токен авторизации");
                    }
                } else {
                    Alert.alert("Ошибка", "Токен не найден в cookies");
                }
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                Alert.alert("Error", "Invalid email or password");
            } else {
                Alert.alert("Error", "Login Failed: " + (error.message || "Unknown error"));
            }
            console.error("Login error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50 px-6 justify-center">
            <View className="bg-white p-8 rounded-xl shadow-sm">
                <Text className="text-3xl font-bold text-gray-900 mb-8 text-center">Welcome Back</Text>

                {/* Email Input */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                    <TextInput
                        className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoFocus
                    />
                </View>

                {/* Password Input */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                    <View className="relative">
                        <TextInput
                            className="w-full h-12 border border-gray-300 rounded-lg px-4 pr-12 focus:border-blue-500"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity
                            className="absolute right-3 top-3"
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text className="text-blue-500 text-sm">{showPassword ? "Hide" : "Show"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    className={`w-full h-12 bg-blue-600 rounded-lg justify-center items-center`}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text className="text-white font-medium text-lg">Sign In</Text>
                    )}
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="px-3 text-gray-500">or</Text>
                    <View className="flex-1 h-px bg-gray-200" />
                </View>

                {/* Register Link */}
                <View className="flex-row justify-center">
                    <Text className="text-gray-600">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                        <Text className="text-blue-600 font-medium">Sign up</Text>
                    </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                    className="mt-4 self-center"
                    onPress={() => router.push("/(auth)/forgot-password")}
                >
                    <Text className="text-blue-600 text-sm">Forgot password?</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}