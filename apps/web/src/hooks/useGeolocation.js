import { useState, useCallback, useEffect, useRef } from 'react';

// Nilai kode baku GeolocationPositionError (spec W3C), dipakai langsung supaya
// pemetaan pesan tidak bergantung pada error yang dilempar browser.
const DITOLAK = 1;
const TIDAK_TERSEDIA = 2;
const HABIS_WAKTU = 3;

const OPSI_AKURASI_TINGGI = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
const OPSI_AKURASI_JARINGAN = { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 };
const OPSI_HEMAT = { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 };

const KUNCI_LOKASI = 'ruangterbuka.lokasi';

const PESAN_IZIN_BLOKIR =
  'Izin lokasi diblokir untuk halaman ini. Klik ikon gembok di bilah alamat, buka Pengaturan situs, ubah Lokasi jadi Izinkan, lalu muat ulang halaman.';

const pesanDariKode = (code) => {
  switch (code) {
    case DITOLAK:
      return PESAN_IZIN_BLOKIR;
    case TIDAK_TERSEDIA:
      return 'Lokasi tidak bisa ditentukan perangkat ini. Coba lagi beberapa saat.';
    case HABIS_WAKTU:
      return 'Pembacaan lokasi memakan waktu terlalu lama. Coba lagi.';
    default:
      return 'Lokasi gagal diambil. Coba lagi, atau atur ulang izin lokasi halaman ini lewat ikon gembok di bilah alamat.';
  }
};

// Lokasi terakhir disimpan per tab supaya pin tetap ada saat halaman di-refresh.
// sessionStorage dipakai, bukan localStorage, agar lokasi tidak melewati penutupan tab.
const bacaLokasiTersimpan = () => {
  try {
    const mentah = sessionStorage.getItem(KUNCI_LOKASI);
    if (!mentah) return null;
    const data = JSON.parse(mentah);
    if (!Number.isFinite(data?.lat) || !Number.isFinite(data?.lng)) return null;
    return { lat: data.lat, lng: data.lng };
  } catch {
    return null;
  }
};

const simpanLokasi = (lokasi) => {
  try {
    sessionStorage.setItem(KUNCI_LOKASI, JSON.stringify(lokasi));
  } catch {
    // Penyimpanan penuh atau diblokir: pin tetap jalan, hanya tidak selamat dari refresh.
  }
};

export const useGeolocation = () => {
  const [location, setLocation] = useState(() => bacaLokasiTersimpan() ?? { lat: null, lng: null });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setiap kali lokasi dibaca, nomor urut ini bertambah. Hasil dari permintaan
  // lama yang sampai belakangan dibuang supaya tidak menimpa hasil yang lebih baru.
  const nomorPermintaan = useRef(0);

  const baca = useCallback((opsi, senyap, sudahCobaUlang) => {
    const permintaan = ++nomorPermintaan.current;
    const masihBerlaku = () => nomorPermintaan.current === permintaan;

    const selesai = (lat, lng) => {
      if (!masihBerlaku()) return;
      const koordinat = { lat, lng };
      setLocation(koordinat);
      simpanLokasi(koordinat);
      if (!senyap) {
        setError(null);
        setIsLoading(false);
      }
    };

    const gagal = (err) => {
      console.warn('[useGeolocation] kode:', err.code, 'pesan:', err.message);
      if (!masihBerlaku()) return;

      // Akurasi tinggi sering gagal di laptop tanpa GPS; fallback ke
      // perkiraan berbasis jaringan sebelum menyatakan gagal.
      if (!sudahCobaUlang && (err.code === TIDAK_TERSEDIA || err.code === HABIS_WAKTU)) {
        baca(OPSI_AKURASI_JARINGAN, senyap, true);
        return;
      }

      if (senyap) return;
      setIsLoading(false);
      setError(pesanDariKode(err.code));
    };

    navigator.geolocation.getCurrentPosition(
      (position) => selesai(position.coords.latitude, position.coords.longitude),
      gagal,
      opsi
    );
  }, []);

  // Saat halaman dibuka ulang, baca lagi lokasi terkini tanpa menampilkan prompt:
  // hanya dijalankan kalau izin sudah "granted", jadi pengunjung yang belum
  // pernah mengizinkan tidak dimintai lokasi begitu halaman dimuat.
  useEffect(() => {
    if (!navigator.geolocation || !window.isSecureContext || !navigator.permissions?.query) return;

    navigator.permissions.query({ name: 'geolocation' })
      .then((status) => {
        if (status.state === 'granted') baca(OPSI_HEMAT, true, false);
      })
      .catch(() => {});
  }, [baca]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser ini tidak mendukung pembacaan lokasi.');
      return;
    }

    if (!window.isSecureContext) {
      setError('Lokasi hanya bisa dibaca lewat localhost atau HTTPS.');
      return;
    }

    setIsLoading(true);
    setError(null);
    baca(OPSI_AKURASI_TINGGI, false, false);
  }, [baca]);

  return { location, error, isLoading, requestLocation };
};

export default useGeolocation;
