import { api } from '../config/api';
import { IS_DEV } from '../config/constants';
import { MOCK_CATEGORIES } from '../data/mockData';

/**
 * Ambil daftar kategori dari backend (tabel categories).
 * Dipakai chip filter di halaman daftar dan hero.
 *
 * @returns {Promise<Array<{id: string, label: string, iconName: string}>>}
 */
export const getCategories = async () => {
  try {
    const data = await api.get('/api/v1/categories');
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) {
      throw new Error('kategori kosong');
    }
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      iconName: item.icon_name || item.iconName
    }));
  } catch (error) {
    if (IS_DEV) {
      console.info('[categoryService] FastAPI belum terhubung, memakai kategori mock.');
      return MOCK_CATEGORIES.filter((cat) => cat.id !== 'semua');
    }
    throw error;
  }
};

export default getCategories;
