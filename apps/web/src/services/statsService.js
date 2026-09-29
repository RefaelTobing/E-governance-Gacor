import { api } from '../config/api';
import { MOCK_STATISTICS, TESTIMONIALS, HERO_SLIDES } from '../data/mockData';

const IS_DEV = import.meta.env.DEV;

/**
 * Ambil data statistik umum homepage (total ruang publik, laporan selesai, dll).
 */
export const getHomeStatistics = async () => {
  try {
    return await api.get('/api/v1/statistics/summary');
  } catch (error) {
    if (IS_DEV) {
      return MOCK_STATISTICS;
    }
    throw error;
  }
};

/**
 * Ambil data testimoni warga.
 */
export const getTestimonials = async () => {
  try {
    return await api.get('/api/v1/testimonials');
  } catch (error) {
    if (IS_DEV) {
      return TESTIMONIALS;
    }
    throw error;
  }
};

/**
 * Ambil data slider hero image.
 */
export const getHeroSlides = async () => {
  try {
    return await api.get('/api/v1/hero-slides');
  } catch (error) {
    if (IS_DEV) {
      return HERO_SLIDES;
    }
    throw error;
  }
};
