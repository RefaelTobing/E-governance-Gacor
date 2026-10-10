import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRuteOsrm } from './useRuteOsrm';

const ASAL = { lat: -6.2088, lng: 106.8456 };
const TUJUAN = { lat: -6.1951, lng: 106.8272 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRuteOsrm', () => {
  it('tidak memanggil fetch bila titik tidak lengkap', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useRuteOsrm(null, TUJUAN));
    expect(result.current.rute).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('mengonversi GeoJSON [lng,lat] menjadi [lat,lng]', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{
          geometry: { type: 'LineString', coordinates: [[106.8456, -6.2088], [106.8272, -6.1951]] },
        }],
      }),
    });

    const { result } = renderHook(() => useRuteOsrm(ASAL, TUJUAN));

    await waitFor(() => expect(result.current.rute).not.toBeNull());
    expect(result.current.rute).toEqual([[-6.2088, 106.8456], [-6.1951, 106.8272]]);
    expect(result.current.galat).toBe('');
    expect(result.current.tidakDitemukan).toBe(false);
  });

  it('memanggil URL OSRM dengan urutan lng,lat', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'Ok', routes: [{ geometry: { coordinates: [[106.8456, -6.2088]] } }] }),
    });

    const { result } = renderHook(() => useRuteOsrm(ASAL, TUJUAN));
    await waitFor(() => expect(result.current.rute).not.toBeNull());

    const url = fetchSpy.mock.calls[0][0];
    expect(url).toContain('106.8456,-6.2088;106.8272,-6.1951');
    expect(url).toContain('geometries=geojson');
  });

  it('menandai tidakDitemukan bila code bukan Ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'NoRoute', routes: [] }),
    });

    const { result } = renderHook(() => useRuteOsrm(ASAL, TUJUAN));
    await waitFor(() => expect(result.current.tidakDitemukan).toBe(true));
    expect(result.current.rute).toBeNull();
  });

  it('mengisi galat bila fetch gagal', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fetch failed'));

    const { result } = renderHook(() => useRuteOsrm(ASAL, TUJUAN));
    await waitFor(() => expect(result.current.galat).toBe('fetch failed'));
    expect(result.current.rute).toBeNull();
  });

  it('mengisi galat bila respons HTTP tidak ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const { result } = renderHook(() => useRuteOsrm(ASAL, TUJUAN));
    await waitFor(() => expect(result.current.galat).not.toBe(''));
    expect(result.current.rute).toBeNull();
  });
});
