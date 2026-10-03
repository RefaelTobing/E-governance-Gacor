import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfilContext = createContext();

export const ProfilProvider = ({ children }) => {
  // Bookmark ruang publik tersimpan
  const [savedSpaces, setSavedSpaces] = useState(() => {
    try {
      const stored = localStorage.getItem('ruka_saved_spaces');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Tema aplikasi (light | dark | system)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ruka_theme') || 'light';
  });

  // Tema yang benar-benar dipasang: mode "system" di-resolve ke light/dark
  // berdasarkan preferensi OS, lalu dipantau saat OS berganti tema.
  const resolveSystemTheme = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === 'system' ? resolveSystemTheme() : theme
  );

  // Data profil lokal warga (untuk edit profil)
  const [localProfile, setLocalProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('ruka_local_profile');
      return stored ? JSON.parse(stored) : { wilayah: 'Jakarta Pusat', phone: '' };
    } catch {
      return { wilayah: 'Jakarta Pusat', phone: '' };
    }
  });

  useEffect(() => {
    localStorage.setItem('ruka_saved_spaces', JSON.stringify(savedSpaces));
  }, [savedSpaces]);

  useEffect(() => {
    localStorage.setItem('ruka_theme', theme);

    const next = theme === 'system' ? resolveSystemTheme() : theme;
    setResolvedTheme(next);
    document.documentElement.setAttribute('data-theme', next);

    if (theme !== 'system') return undefined;

    // Mode "system": ikuti perubahan tema OS secara langsung.
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      const value = event.matches ? 'dark' : 'light';
      setResolvedTheme(value);
      document.documentElement.setAttribute('data-theme', value);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ruka_local_profile', JSON.stringify(localProfile));
  }, [localProfile]);

  const toggleSaveSpace = (spaceId) => {
    setSavedSpaces((prev) =>
      prev.includes(spaceId) ? prev.filter((id) => id !== spaceId) : [...prev, spaceId]
    );
  };

  const isSpaceSaved = (spaceId) => savedSpaces.includes(spaceId);

  const updateProfileData = (newData) => {
    setLocalProfile((prev) => ({ ...prev, ...newData }));
  };

  return (
    <ProfilContext.Provider
      value={{
        savedSpaces,
        toggleSaveSpace,
        isSpaceSaved,
        theme,
        setTheme,
        resolvedTheme,
        localProfile,
        updateProfileData,
      }}
    >
      {children}
    </ProfilContext.Provider>
  );
};

export const useProfil = () => useContext(ProfilContext);
