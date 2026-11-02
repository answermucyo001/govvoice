import api from '../api/client';

const cache = new Map();

const cached = (key, loader) => {
  if (!cache.has(key)) {
    cache.set(
      key,
      loader().catch((error) => {
        cache.delete(key);
        throw error;
      })
    );
  }
  return cache.get(key);
};

export const locationService = {
  getProvinces() {
    return cached('provinces', async () => {
      const response = await api.get('/locations/provinces');
      return response.data.data.provinces;
    });
  },

  getDistricts(provinceId, { cached: useCache = true } = {}) {
    const key = `districts:${provinceId || 'all'}`;
    const loader = async () => {
      const response = await api.get('/locations/districts', {
        params: provinceId ? { provinceId } : undefined
      });
      return response.data.data.districts;
    };
    return useCache ? cached(key, loader) : loader();
  },

  getSectors(districtId, { cached: useCache = true } = {}) {
    const key = `sectors:${districtId || 'all'}`;
    const loader = async () => {
      const response = await api.get('/locations/sectors', {
        params: districtId ? { districtId } : undefined
      });
      return response.data.data.sectors;
    };
    return useCache ? cached(key, loader) : loader();
  },

  getCategories() {
    return cached('categories', async () => {
      const response = await api.get('/locations/categories');
      return response.data.data.categories;
    });
  },

  async getHierarchy(sectorId) {
    const response = await api.get(`/locations/hierarchy/${sectorId}`);
    return response.data.data.hierarchy;
  }
};

export default locationService;
