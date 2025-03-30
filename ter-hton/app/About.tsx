import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import api from '@/app/api/axios';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FAQItem {
    id: number;
    question: string;
    answer: string;
    isOpen: boolean;
}

interface FeatureItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
}

export default function Notifications() {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const features: FeatureItem[] = [
        { id: '1', icon: 'alert-circle', text: 'Экстренный вызов' },
        { id: '2', icon: 'camera', text: 'Фото/видео доказательства' },
        { id: '3', icon: 'chatbubbles', text: 'Чат с оператором' },
        { id: '4', icon: 'map', text: 'Карта происшествий' },
        { id: '5', icon: 'document-text', text: 'Официальные сводки' },
        { id: '6', icon: 'shield-checkmark', text: 'Проверка информации' },
        { id: '7', icon: 'time', text: 'История обращений' },
        { id: '8', icon: 'notifications', text: 'Оповещения' }
    ];

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const response = await api.get('/faqs');
                setFaqs(response.data.map((faq: any) => ({
                    ...faq,
                    isOpen: false
                })));
            } catch (err) {
                setError('Не удалось загрузить FAQ');
                console.error('Ошибка при загрузке FAQ:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    const toggleFAQ = (id: number) => {
        setFaqs(faqs.map(faq =>
            faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq
        ));
    };

    const renderFeature = ({ item }: { item: FeatureItem }) => (
        <View className="w-40 mr-2 p-4 bg-gray-50 rounded-lg items-center">
            <Ionicons name={item.icon} size={28} color="#3b82f6" />
            <Text className="mt-2 text-gray-700 text-center">{item.text}</Text>
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-red-500">{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 20
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Заголовок с градиентом */}
                <View className="p-6">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="shield" size={32} color="black" />
                        <Text className="text-3xl font-bold text-black ml-3">SafeConnect</Text>
                    </View>
                    <Text className="text-black text-lg mb-1">
                        Официальное мобильное приложение для оперативного взаимодействия граждан
                        с правоохранительными органами вашего региона
                    </Text>
                    <Text className="text-black">
                        Быстро • Анонимно • Надёжно
                    </Text>
                </View>

                {/* Горизонтальный скролл функций */}
                <View className="py-4">
                    <Text className="text-xl font-bold text-gray-800 px-6 mb-3">Основные функции</Text>
                    <FlatList
                        data={features}
                        renderItem={renderFeature}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        className="mb-4"
                    />
                </View>

                {/* Преимущества */}
                <View className="px-6 py-4 bg-blue-50 mx-6 rounded-xl mb-6">
                    <Text className="text-xl font-bold text-gray-800 mb-3">Почему выбирают нас?</Text>
                    {[
                        "Мгновенная реакция на вызовы",
                        "Полная конфиденциальность",
                        "Прямая связь с оператором",
                        "Реальные отзывы пользователей",
                        "Поддержка 24/7"
                    ].map((item, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                            <Ionicons name="checkmark-circle" size={18} color="#10b981" className="mt-1" />
                            <Text className="ml-2 text-gray-700 flex-1">{item}</Text>
                        </View>
                    ))}
                </View>

                {/* FAQ раздел */}
                <View className="px-6 pb-6">
                    <View className="flex-row items-center mb-6">
                        <Ionicons name="help-circle" size={24} color="#3b82f6" />
                        <Text className="text-2xl font-bold text-gray-800 ml-2">Частые вопросы</Text>
                    </View>

                    {faqs.length > 0 ? (
                        faqs.map((faq) => (
                            <View key={faq.id} className="mb-4 bg-gray-50 rounded-lg p-4">
                                <TouchableOpacity
                                    onPress={() => toggleFAQ(faq.id)}
                                    className="flex-row justify-between items-center"
                                >
                                    <Text className="text-lg font-semibold text-gray-700 flex-1 pr-2">
                                        {faq.question}
                                    </Text>
                                    <Ionicons
                                        name={faq.isOpen ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#6b7280"
                                    />
                                </TouchableOpacity>

                                {faq.isOpen && (
                                    <Text className="text-gray-600 mt-3 pt-3 border-t border-gray-200">
                                        {faq.answer}
                                    </Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <View className="bg-gray-50 p-4 rounded-lg">
                            <Text className="text-gray-500 text-center">Нет доступных вопросов</Text>
                        </View>
                    )}
                </View>

                {/* Футер */}
                <View className="p-6 bg-gray-100 border-t border-gray-200">
                    <Text className="text-gray-600 text-center">
                        SafeConnect - сделайте ваш город безопаснее!
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}