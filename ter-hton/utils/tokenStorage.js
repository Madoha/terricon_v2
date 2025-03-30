// utils/tokenStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAccessToken = async () => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        return token;
    } catch (error) {
        console.error('Ошибка при получении токена:', error);
        return null;
    }
};

export const setAccessToken = async (token) => {
    try {
        await AsyncStorage.setItem('accessToken', token);
    } catch (error) {
        console.error('Ошибка при сохранении токена:', error);
    }
};

export const clearAccessToken = async () => {
    try {
        await AsyncStorage.removeItem('accessToken');
    } catch (error) {
        console.error('Ошибка при удалении токена:', error);
    }
};