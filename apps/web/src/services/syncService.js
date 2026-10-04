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

export const triggerSync = async () => {
  const data = await api.post('/api/v1/admin/sync-data');
  return keTampilan(data);
};

export default triggerSync;
