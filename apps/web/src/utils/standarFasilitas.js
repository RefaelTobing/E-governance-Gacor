export const STANDAR_FASILITAS = [
  'Pohon peneduh',
  'Tanaman perdu',
  'Area resapan air alami',
  'Bangku taman',
  'Jalur pejalan kaki',
  'Tempat sampah terpilah',
  'Lampu penerangan taman',
  'Jalur pemandu disabilitas',
  'Jalur landai tanpa undakan',
  'Alat permainan anak sederhana',
  'Sarana olahraga mandiri',
  'Papan informasi tata tertib taman'
];

export const STANDAR_FASILITAS_SET = new Set(
  STANDAR_FASILITAS.map((nama) => nama.trim().toLowerCase())
);

/**
 * Group fasilitas by ruang publik id.
 * Return format:
 * {
 *   [ruangPublikId]: [
 *     { nama, status, kategori, deskripsi }
 *   ]
 * }
 */
export const groupFacilitiesByRuang = (facilities) => {
  const groups = {};
  facilities.forEach((f) => {
    const ruangId = f.ruangPublikId;
    if (!groups[ruangId]) groups[ruangId] = [];
    groups[ruangId].push({
      id: f.id,
      nama: f.nama,
      status: f.status,
      kategori: f.kategori,
      deskripsi: f.deskripsi,
      createdAt: f.createdAt
    });
  });
  return groups;
};

/**
 * Map standar fasilitas to actual data for a ruang publik.
 * Returns array of objects with:
 * {
 *   nama: string,
 *   status: 'baik' | 'perlu_perhatian' | 'rusak' | null,
 *   fasilitasId: string | null,
 *   data: fasilitas object or null
 * }
 */
export const mapStandarFasilitas = (standarList, fasilitasArray) => {
  const mapByNama = {};
  fasilitasArray?.forEach((f) => {
    mapByNama[f.nama.trim()] = f;
  });

  return standarList.map((namaStandar) => {
    const lowerStandar = namaStandar.trim().toLowerCase();
    const match = fasilitasArray?.find((f) => 
      f.nama.trim().toLowerCase() === lowerStandar
    );

    return {
      nama: namaStandar,
      status: match ? match.status : null,
      fasilitasId: match ? match.id : null,
      data: match || null
    };
  });
};

/**
 * Filter fasilitas non‑standar.
 */
export const filterFasilitasNonStandar = (fasilitasArray, standarList) => {
  const lowerStandar = standarList.map(s => s.trim().toLowerCase());
  return fasilitasArray?.filter(f => 
    !lowerStandar.includes(f.nama.trim().toLowerCase())
  ) || [];
};
