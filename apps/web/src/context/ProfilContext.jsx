import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfilContext = createContext();

// Bookmark dipisahkan per akun supaya browser yang sama tidak berbagi
// daftar tersimpan antar pengguna. Tamu (belum login) tidak menyimpan apa pun.
const bacaUserId = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    const user = JSON.parse(storedUser);
    return user?.id || null;
  } catch {
    return null;
  }
};

const kunciSavedSpaces = (userId) => `ruka_saved_spaces_${userId}`;

export const ProfilProvider = ({ children }) => {
  const [storageOwner, setStorageOwner] = useState(bacaUserId);

  // Bookmark ruang publik tersimpan milik pengguna yang sedang login.
  const [savedSpaces, setSavedSpaces] = useState(() => {
    const userId = bacaUserId();
    if (!userId) return [];
    try {
      const stored = localStorage.getItem(kunciSavedSpaces(userId));
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

  // Ikuti pergantian akun: saat user login/logout, muat ulang bookmark milik
  // akun tersebut (atau kosongkan untuk tamu) sebelum menulis kembali.
  useEffect(() => {
    const userId = bacaUserId();
    if (userId === storageOwner) return;
    setStorageOwner(userId);
    if (!userId) {
      setSavedSpaces([]);
      return;
    }
    try {
      const stored = localStorage.getItem(kunciSavedSpaces(userId));
      setSavedSpaces(stored ? JSON.parse(stored) : []);
    } catch {
      setSavedSpaces([]);
    }
  }, [storageOwner]);

  useEffect(() => {
    if (!storageOwner) return;
    localStorage.setItem(kunciSavedSpaces(storageOwner), JSON.stringify(savedSpaces));
  }, [savedSpaces, storageOwner]);

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
    // Bookmark hanya untuk pengguna terautentikasi; tamu tidak boleh menyimpan.
    const userId = bacaUserId();
    if (!userId) return;
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
