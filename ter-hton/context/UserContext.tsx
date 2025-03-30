import React, { createContext, useState, useContext, ReactNode } from 'react';

type UserContextType = {
    userId: string | null;
    setUserId: (id: string | null) => void;
    role: string | null ;
    setRole: (id: string | null) => void;
    latitude: number | null;
    longitude: number | null;
    setCoordinates: (lat: number, lon: number) => void;
    clearCoordinates: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    const setCoordinates = (lat: number, lon: number) => {
        setLatitude(lat);
        setLongitude(lon);
    };

    const clearCoordinates = () => {
        setLatitude(null);
        setLongitude(null);
    };

    return (
        <UserContext.Provider value={{ userId, setUserId, role, setRole, latitude, longitude, setCoordinates, clearCoordinates }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
