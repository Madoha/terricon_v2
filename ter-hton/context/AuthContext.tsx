// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import api from '@/app/api/axios';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";

const UNAUTHORIZED = 401;

type AuthContextType = {
    token: string | null;
    setToken: (token: string | null) => void;
    refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
    token: null,
    setToken: () => {},
    refreshToken: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

    // Secure storage functions
    const setSecureItem = async (key: string, value: string) => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            await AsyncStorage.setItem(key, value);
        }
    };

    const getSecureItem = async (key: string) => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return await AsyncStorage.getItem(key);
    };

    const removeSecureItem = async (key: string) => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            await AsyncStorage.removeItem(key);
        }
    };

    // Enhanced token refresh logic with your requested pattern
    const refreshToken = async (): Promise<boolean> => {
        try {
            const response = await api.get('/auth/refresh');
            const newToken = response.data.accessToken;

            setToken(newToken);
            await setSecureItem('accessToken', newToken);
            return true;
        } catch (error: any) {
            if (error.response?.status === UNAUTHORIZED &&
                error.response?.data?.errorCode === "InvalidAccessToken") {
                try {
                    // Attempt to refresh the access token
                    await api.get('auth/refresh');
                    return true;
                } catch (refreshError) {
                    // Handle refresh errors by clearing auth and redirecting
                    await clearAuth();
                    router.push({
                        pathname: '/login'
                    });
                    return false;
                }
            }
            console.error('Token refresh failed:', error);
            return false;
        }
    };

    // Clear all auth data
    const clearAuth = async () => {
        setToken(null);
        await removeSecureItem('accessToken');
        await removeSecureItem('refreshToken');
    };

    // Initialize auth state
    const initAuth = async () => {
        const storedToken = await getSecureItem('accessToken');
        if (storedToken) {
            setToken(storedToken);
        }
    };

    return (
        <AuthContext.Provider value={{ token, setToken, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);