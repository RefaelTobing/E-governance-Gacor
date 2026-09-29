import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState('guest');
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setRole(parsedUser.role || 'guest');
        }
    }, []);

    const login = (userData, accessToken) => {
        setUser(userData);
        setRole(userData.role || 'guest');
        setToken(accessToken);
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setRole('guest');
        setToken(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, role, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
