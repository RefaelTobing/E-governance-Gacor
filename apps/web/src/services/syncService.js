import { api } from '../config/api';

const keTampilan = (data) => ({
  status: data.status,
  mulai: data.mulai,
  selesai: data.selesai,
  totalDetik: data.total_detik,
  tahapGagal: data.tahap_gagal,
  tahap: data.tahap.map((t) => ({
    nama: t.tahap,
    status: t.status,
    detik: t.detik,
    log: t.log,
  })),
});

const keTampilanRiwayat = (run) => ({
  id: run.id,
  pemicu: run.pemicu,
  status: run.status,
  mulai: run.mulai,
  selesai: run.selesai,
  tahapGagal: run.tahap_gagal,
  hitung: run.hitung,
  tahap: (run.tahap || []).map((t) => ({
    nama: t.tahap,
    status: t.status,
    detik: t.detik,
    log: t.log || [],
  })),
});

export const triggerSync = async () => {
  const data = await api.post('/api/v1/admin/sync-data');
  return keTampilan(data);
};

export const riwayatSync = async (limit = 10) => {
  const data = await api.get('/api/v1/admin/sync-data', { limit });
  return data.map(keTampilanRiwayat);
};

export default triggerSync;
