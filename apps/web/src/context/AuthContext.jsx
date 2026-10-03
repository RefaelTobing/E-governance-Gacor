import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const readStoredAuth = () => {
    try {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        if (!storedToken || !storedUser) return { token: null, user: null };

        const user = JSON.parse(storedUser);
        if (!user || typeof user !== 'object') return { token: null, user: null };

        return { token: storedToken, user };
    } catch (e) {
        return { token: null, user: null };
    }
};

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(readStoredAuth);

    const { user, token } = auth;
    const role = user?.role || 'guest';

    const login = (userData, accessToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setAuth({ user: userData, token: accessToken });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setAuth({ user: null, token: null });
    };

    return (
        <AuthContext.Provider value={{ user, role, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
