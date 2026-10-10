import { useState, useEffect } from 'react';
import { OSRM_BASE_URL } from '../config/constants';

// Titik valid: dua-duanya angka dan berada di rentang bumi.
const titikValid = (titik) =>
  titik != null &&
  Number.isFinite(titik.lat) &&
  Number.isFinite(titik.lng) &&
  titik.lat >= -90 &&
  titik.lat <= 90 &&
  titik.lng >= -180 &&
  titik.lng <= 180;

/**
 * Hitung rute perjalanan (driving) antara `asal` dan `tujuan` memakai OSRM publik.
 *
 * OSRM meminta urutan koordinat `lng,lat`, sedangkan GeoJSON mengembalikan
 * `[lng, lat]`. Hook ini mengurus kedua konversi tersebut sehingga konsumen
 * (Leaflet) menerima `Array<[lat, lng]>` yang siap digambar sebagai Polyline.
 *
 * Tanpa fallback mock: kegagalan layanan eksternal ditampilkan apa adanya
 * (degradasi aman = peta & tombol Google Maps tetap jalan).
 *
 * @param {{lat:number,lng:number}|null} asal   - lokasi pengguna
 * @param {{lat:number,lng:number}|null} tujuan - lokasi tujuan
 * @returns {{ rute: Array<[number,number]>|null, isLoading: boolean, galat: string, tidakDitemukan: boolean }}
 */
export const useRuteOsrm = (asal, tujuan) => {
  const [rute, setRute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [galat, setGalat] = useState('');
  const [tidakDitemukan, setTidakDitemukan] = useState(false);

  const siap = titikValid(asal) && titikValid(tujuan);

  useEffect(() => {
    // Belum ada titik lengkap -> tak ada rute, tak ada request.
    if (!siap) {
      setRute(null);
      setIsLoading(false);
      setGalat('');
      setTidakDitemukan(false);
      return undefined;
    }

    const controller = new AbortController();
    let masihBerlaku = true;

    const hitung = async () => {
      setIsLoading(true);
      setGalat('');
      setTidakDitemukan(false);
      setRute(null);

      // OSRM: urutan WAJIB {lng},{lat}. Jangan ditukar.
      const url = `${OSRM_BASE_URL}/route/v1/driving/${asal.lng},${asal.lat};${tujuan.lng},${tujuan.lat}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Layanan rute menolak permintaan (${res.status}).`);
        }
        const data = await res.json();

        if (!masihBerlaku) return;

        const jalur = data?.routes?.[0];
        if (data?.code !== 'Ok' || !jalur?.geometry?.coordinates?.length) {
          setTidakDitemukan(true);
          setRute(null);
          return;
        }

        // GeoJSON [lng,lat] -> Leaflet [lat,lng].
        const koordinat = jalur.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRute(koordinat);
      } catch (err) {
        if (!masihBerlaku || err.name === 'AbortError') return;
        setGalat(err.message || 'Rute gagal dihitung.');
      } finally {
        if (masihBerlaku) setIsLoading(false);
      }
    };

    hitung();

    return () => {
      masihBerlaku = false;
      controller.abort();
    };
  }, [siap, asal?.lat, asal?.lng, tujuan?.lat, tujuan?.lng]);

  return { rute, isLoading, galat, tidakDitemukan };
};

export default useRuteOsrm;
