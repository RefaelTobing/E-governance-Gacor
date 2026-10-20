import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Zoom pinch trackpad untuk peta Leaflet (FE-45).
 *
 * Chromium mengirim pinch trackpad sebagai event `wheel` dengan `ctrlKey = true`.
 * Ketika peta memakai `scrollWheelZoom={false}`, Leaflet tidak memasang handler
 * `wheel` sama sekali, sehingga browser menjalankan aksi defaultnya: mengezoom
 * halaman, bukan peta.
 *
 * Komponen ini sengaja HANYA menangani event dengan `ctrlKey = true`. Scroll biasa
 * (dua jari geser) dibiarkan lewat supaya halaman tetap bisa digulir ketika kursor
 * kebetulan berada di atas peta.
 *
 * Harus dirender DI DALAM <MapContainer> karena memakai useMap().
 */

// Jeda pengumpulan delta sebelum satu langkah zoom diterapkan, dalam milidetik.
// Meniru wheelDebounceTime bawaan Leaflet (40 ms) agar terasa sama dengan peta
// Leaflet lain: beberapa event kecil dari satu gesture digabung jadi satu langkah.
// Timer tidak pernah mundur lebih dari JEDA_MS dari event pertama, sehingga pinch
// yang mengalir terus tetap responsif, tidak menunggu gesture selesai.
const JEDA_MS = 40;

// Satu langkah zoom per pengumpulan. Leaflet memakai zoomSnap = 1, jadi nilai
// pecahan akan dibulatkan dan tidak berpengaruh.
const LANGKAH = 1;

const PetaZoomPinch = () => {
  const map = useMap();
  const akumulasiRef = useRef(0);
  const titikRef = useRef(null);
  const waktuMulaiRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const container = map.getContainer();

    const terapkan = () => {
      const akumulasi = akumulasiRef.current;
      const titik = titikRef.current;
      akumulasiRef.current = 0;

      if (akumulasi === 0 || !titik) return;

      // deltaY negatif = jari membuka = zoom masuk, mengikuti konvensi peramban.
      const tujuanZoom = map.getZoom() + (akumulasi < 0 ? LANGKAH : -LANGKAH);

      // setZoomAround menghormati minZoom/maxZoom peta lewat _limitZoom, jadi
      // zoom berhenti sendiri di batas tanpa perlu penjagaan tambahan di sini.
      map.setZoomAround(titik, tujuanZoom);
    };

    const saatWheel = (event) => {
      if (!event.ctrlKey) return;

      // Menahan aksi default peramban (zoom halaman). Hanya bisa dilakukan karena
      // listener ini dipasang dengan { passive: false }.
      event.preventDefault();

      const sekarang = Date.now();
      if (akumulasiRef.current === 0) waktuMulaiRef.current = sekarang;

      akumulasiRef.current += event.deltaY;
      titikRef.current = map.mouseEventToContainerPoint(event);

      const sisaTunggu = Math.max(JEDA_MS - (sekarang - waktuMulaiRef.current), 0);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(terapkan, sisaTunggu);
    };

    container.addEventListener('wheel', saatWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', saatWheel);
      clearTimeout(timerRef.current);
      akumulasiRef.current = 0;
      titikRef.current = null;
      waktuMulaiRef.current = 0;
    };
  }, [map]);

  return null;
};

export default PetaZoomPinch;
