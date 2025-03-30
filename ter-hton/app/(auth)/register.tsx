import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import api from "../api/axios";

export default function Register() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateField = (name: string, value: string) => {
        let error = '';

        switch (name) {
            case 'email':
                if (!value.includes('@')) error = 'Invalid email address';
                break;
            case 'password':
                if (value.length < 8) error = 'Password must be at least 8 characters';
                break;
            case 'confirmPassword':
                if (value !== formData.password) error = 'Passwords do not match';
                break;
        }

        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) validateField(name, value);
    };

    const handleSubmit = async () => {
        Keyboard.dismiss();

        const isValid = Object.entries(formData).every(([key, value]) => {
            if (!value && key !== 'confirmPassword') {
                setErrors(prev => ({ ...prev, [key]: 'This field is required' }));
                return false;
            }
            return validateField(key, value);
        });

        if (!isValid) return;

        setIsLoading(true);

        try {
            const response = await api.post('auth/register', {
                ...formData,
                roleId: 2 // Default role to "user"
            });

            if (response.status === 201) {
                Alert.alert('Success', 'Registration Successful!');
                router.push('/login');
            } else {
                Alert.alert('Error', 'Registration not successful');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Registration Failed');
            console.error('Registration error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50 px-6 justify-center">
            <View className="bg-white p-8 rounded-xl shadow-sm">
                <Text className="text-3xl font-bold text-gray-900 mb-6 text-center">Create Account</Text>

                {/* Two Column Name Fields */}
                {/*<View className="flex-row mb-4">*/}
                {/*    <View className="flex-1 mr-2">*/}
                {/*        <Text className="text-sm font-medium text-gray-700 mb-1">First Name*</Text>*/}
                {/*        <TextInput*/}
                {/*            className={`w-full h-12 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 focus:border-blue-500`}*/}
                {/*            placeholder="First Name"*/}
                {/*            value={formData.firstName}*/}
                {/*            onChangeText={(text) => handleChange('firstName', text)}*/}
                {/*            autoCapitalize="words"*/}
                {/*        />*/}
                {/*        {errors.firstName && <Text className="text-red-500 text-xs mt-1">{errors.firstName}</Text>}*/}
                {/*    </View>*/}
                {/*    <View className="flex-1 ml-2">*/}
                {/*        <Text className="text-sm font-medium text-gray-700 mb-1">Last Name*</Text>*/}
                {/*        <TextInput*/}
                {/*            className={`w-full h-12 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 focus:border-blue-500`}*/}
                {/*            placeholder="Last Name"*/}
                {/*            value={formData.lastName}*/}
                {/*            onChangeText={(text) => handleChange('lastName', text)}*/}
                {/*            autoCapitalize="words"*/}
                {/*        />*/}
                {/*        {errors.lastName && <Text className="text-red-500 text-xs mt-1">{errors.lastName}</Text>}*/}
                {/*    </View>*/}
                {/*</View>*/}

                {/*/!* Username *!/*/}
                {/*<View className="mb-4">*/}
                {/*    <Text className="text-sm font-medium text-gray-700 mb-1">Username*</Text>*/}
                {/*    <TextInput*/}
                {/*        className={`w-full h-12 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 focus:border-blue-500`}*/}
                {/*        placeholder="Username"*/}
                {/*        value={formData.username}*/}
                {/*        onChangeText={(text) => handleChange('username', text)}*/}
                {/*        autoCapitalize="none"*/}
                {/*    />*/}
                {/*    {errors.username && <Text className="text-red-500 text-xs mt-1">{errors.username}</Text>}*/}
                {/*</View>*/}

                {/* Username */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Username*</Text>
                    <TextInput
                        className={`w-full h-12 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 focus:border-blue-500`}
                        placeholder="Username"
                        value={formData.username}
                        onChangeText={(text) => handleChange('username', text)}
                        autoCapitalize="none"
                    />
                    {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.username}</Text>}
                </View>

                {/* Email */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Email*</Text>
                    <TextInput
                        className={`w-full h-12 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 focus:border-blue-500`}
                        placeholder="Email"
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>}
                </View>

                {/* Password */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Password*</Text>
                    <View className="relative">
                        <TextInput
                            className={`w-full h-12 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 pr-12 focus:border-blue-500`}
                            placeholder="Password (min 8 characters)"
                            value={formData.password}
                            onChangeText={(text) => handleChange('password', text)}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            className="absolute right-3 top-3"
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text className="text-blue-500 text-sm">
                                {showPassword ? 'Hide' : 'Show'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>}
                </View>

                {/* Confirm Password */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password*</Text>
                    <View className="relative">
                        <TextInput
                            className={`w-full h-12 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 pr-12 focus:border-blue-500`}
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChangeText={(text) => handleChange('confirmPassword', text)}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            onSubmitEditing={handleSubmit}
                        />
                        <TouchableOpacity
                            className="absolute right-3 top-3"
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Text className="text-blue-500 text-sm">
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>}
                </View>

                {/* Register Button */}
                <TouchableOpacity
                    className={`w-full h-12 bg-blue-600 rounded-lg justify-center items-center ${isLoading ? 'opacity-80' : ''}`}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-medium text-lg">Create Account</Text>
                    )}
                </TouchableOpacity>

                {/* Login Link */}
                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-600">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text className="text-blue-600 font-medium">Sign in</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}