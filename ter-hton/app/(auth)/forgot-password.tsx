import {useState} from "react";
import {View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard} from "react-native";
import {router} from "expo-router";
import api from "../api/axios";

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSubmit = async () => {
        Keyboard.dismiss();

        if (!validateEmail(email)) return;

        try {
            const response = await api.post("auth/forgot-password", {email});

            if (response.data.success) {
                Alert.alert(
                    'Email Sent',
                    'If an account exists with this email, you will receive password reset instructions',
                    [{text: 'OK', onPress: () => router.replace('/login')}]
                );
            }
        } catch (error: any) {
            // Generic error message to avoid revealing if email exists
            Alert.alert(
                'Email Sent',
                'If an account exists with this email, you will receive password reset instructions'
            );
        }
    };

    return (
        <View className="flex-1 bg-gray-50 px-6 justify-center">
            <View className="bg-white p-8 rounded-xl shadow-sm">
                <Text className="text-3xl font-bold text-gray-900 mb-8 text-center">Reset Password</Text>

                <Text className="text-gray-600 mb-8 text-center">
                    Enter your email address to receive password reset instructions
                </Text>

                {/* Email Input */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Email Address</Text>
                    <TextInput
                        className={`w-full h-12 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 focus:border-blue-500`}
                        placeholder="Enter your registered email"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (emailError) validateEmail(text);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoFocus
                        onSubmitEditing={handleSubmit}
                    />
                    {emailError && (
                        <Text className="text-red-500 text-xs mt-1">{emailError}</Text>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    className={`w-full h-12 bg-blue-600 rounded-lg justify-center items-center`}
                    onPress={handleSubmit}
                >
                    <Text className="text-white font-medium text-lg">Send Reset Link</Text>
                </TouchableOpacity>

                {/* Divider - Matching Login Page */}
                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-gray-200"/>
                    <Text className="px-3 text-gray-500">or</Text>
                    <View className="flex-1 h-px bg-gray-200"/>
                </View>

                {/* Back to Login Link - Styled Like Register Link */}
                <View className="flex-row justify-center">
                    <Text className="text-gray-600">Remember your password? </Text>
                    <TouchableOpacity onPress={() => router.replace('/login')}>
                        <Text className="text-blue-600 font-medium">Sign in</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}