import { create } from 'zustand';
import * as service from '../services/materialsService';

export const useMaterialsStore = create((set, get) => ({
  materials: [],
  isLoading: false,
  error: null,

  async fetchMaterials() {
    set({ isLoading: true, error: null });
    try {
      const materials = await service.listMaterials();
      set({ materials, isLoading: false });
    } catch (e) {
      set({ error: e, isLoading: false });
      throw e;
    }
  },

  async addMaterial(data) {
    const created = await service.createMaterial(data);
    set({ materials: [...get().materials, created] });
    return created;
  },

  async updateMaterial(id, data) {
    const updated = await service.updateMaterial(id, data);
    set({
      materials: get().materials.map((m) => (m.id === id ? updated : m)),
    });
    return updated;
  },

  async deleteMaterial(id) {
    await service.deleteMaterial(id);
    set({ materials: get().materials.filter((m) => m.id !== id) });
  },
}));
