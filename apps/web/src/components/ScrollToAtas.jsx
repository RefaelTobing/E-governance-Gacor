import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Mereset posisi gulir ke paling atas setiap kali rute berpindah (FE-49).
 * Hanya merespons perubahan pathname: perubahan query string, mis. filter
 * pada /ruang-publik, tidak melempar pengguna ke atas halaman.
 * `behavior: 'instant'` dipakai, bukan `smooth`, agar tidak bertabrakan dengan
 * `scrollIntoView({ behavior: 'smooth' })` saat membuka peta di halaman detail.
 */
const ScrollToAtas = () => {
  const { pathname } = useLocation();
  const pathnameTerakhir = useRef(pathname);

  useEffect(() => {
    if (pathnameTerakhir.current === pathname) return;
    pathnameTerakhir.current = pathname;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToAtas;
