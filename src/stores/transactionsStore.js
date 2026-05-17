import { create } from 'zustand';
import {
  listTransactions,
  listTransactionsForMaterial,
} from '../services/transactionsService';
import { startOfTodayIso } from '../utils/formatters';

// Shared cache for transactions data used by Dashboard and Logs pages.
// Pages render whatever is currently in the store immediately on mount and
// kick off a background refresh — the "stale-while-revalidate" pattern.

const PAGE_SIZE = 50;

function rangeSinceIso(key) {
  if (key === 'all') return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (key === 'week') d.setDate(d.getDate() - 6);
  return d.toISOString();
}

export const useTransactionsStore = create((set, get) => ({
  // Dashboard slots
  recent: [],
  today: [],
  dashboardLoaded: false,
  dashboardRefreshing: false,

  // Logs slots
  logsRange: 'week',
  logsItems: [],
  logsHasMore: true,
  logsLoaded: false,
  logsRefreshing: false,
  logsLoadingMore: false,

  // Per-material transaction cache (Material detail page).
  // Keyed by material id; value: { items: [], fetchedAt: number }.
  byMaterial: {},
  materialRefreshing: {},

  async refreshDashboard() {
    set({ dashboardRefreshing: true });
    try {
      const [recent, today] = await Promise.all([
        listTransactions({ limit: 10 }),
        listTransactions({ limit: 1000, sinceIso: startOfTodayIso() }),
      ]);
      set({
        recent,
        today,
        dashboardLoaded: true,
        dashboardRefreshing: false,
      });
    } catch (e) {
      set({ dashboardRefreshing: false });
      throw e;
    }
  },

  async refreshLogs(range) {
    const r = range || get().logsRange;
    const sinceIso = rangeSinceIso(r);
    set({ logsRefreshing: true, logsRange: r });
    try {
      const rows = await listTransactions({
        limit: PAGE_SIZE,
        offset: 0,
        sinceIso,
      });
      set({
        logsItems: rows,
        logsHasMore: rows.length === PAGE_SIZE,
        logsLoaded: true,
        logsRefreshing: false,
      });
    } catch (e) {
      set({ logsRefreshing: false });
      throw e;
    }
  },

  async loadMoreLogs() {
    const { logsItems, logsRange, logsLoadingMore } = get();
    if (logsLoadingMore) return;
    set({ logsLoadingMore: true });
    try {
      const sinceIso = rangeSinceIso(logsRange);
      const rows = await listTransactions({
        limit: PAGE_SIZE,
        offset: logsItems.length,
        sinceIso,
      });
      set({
        logsItems: [...logsItems, ...rows],
        logsHasMore: rows.length === PAGE_SIZE,
        logsLoadingMore: false,
      });
    } catch (e) {
      set({ logsLoadingMore: false });
      throw e;
    }
  },

  async refreshMaterialTransactions(materialId, limit = 20) {
    set((s) => ({
      materialRefreshing: { ...s.materialRefreshing, [materialId]: true },
    }));
    try {
      const items = await listTransactionsForMaterial(materialId, limit);
      set((s) => ({
        byMaterial: {
          ...s.byMaterial,
          [materialId]: { items, fetchedAt: Date.now() },
        },
        materialRefreshing: { ...s.materialRefreshing, [materialId]: false },
      }));
      return items;
    } catch (e) {
      set((s) => ({
        materialRefreshing: { ...s.materialRefreshing, [materialId]: false },
      }));
      throw e;
    }
  },
}));
