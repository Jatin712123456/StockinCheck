import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, PackageOpen } from 'lucide-react';
import { useMaterialsStore } from '../stores/materialsStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabaseClient';
import { formatQuantity, formatDateTime } from '../utils/formatters';
import { friendlyError } from '../utils/validators';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { materials, isLoading, error, fetchMaterials } = useMaterialsStore();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('name');

  useEffect(() => {
    fetchMaterials().catch(() => {});
    const channel = supabase
      .channel('materials-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        () => fetchMaterials()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearchChange(v) {
    setSearch(v);
    if (v) setSearchParams({ search: v });
    else setSearchParams({});
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = materials;
    if (q) {
      rows = rows.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.supplier || '').toLowerCase().includes(q)
      );
    }
    rows = [...rows];
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'quantity')
      rows.sort((a, b) => Number(b.quantity) - Number(a.quantity));
    if (sort === 'updated')
      rows.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    return rows;
  }, [materials, search, sort]);

  if (isLoading && materials.length === 0) return <Spinner />;
  if (error && materials.length === 0)
    return (
      <ErrorState message={friendlyError(error)} onRetry={fetchMaterials} />
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Materials</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/materials/add')}>
            <Plus className="h-4 w-4" />
            Add material
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or supplier…"
            className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="name">Sort: Name</option>
          <option value="quantity">Sort: Quantity</option>
          <option value="updated">Sort: Last updated</option>
        </select>
      </div>

      {materials.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No materials yet."
          description="Add your first material to start tracking stock."
          action={
            isAdmin ? (
              <Button onClick={() => navigate('/materials/add')}>
                <Plus className="h-4 w-4" />
                Add material
              </Button>
            ) : null
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search term."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const low = Number(m.quantity) < Number(m.minimum_stock);
            return (
              <button
                key={m.id}
                onClick={() => navigate(`/materials/${m.id}`)}
                className="text-left"
              >
                <Card className="h-full p-4 transition hover:border-blue-200 hover:shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-gray-900">
                        {m.name}
                      </h3>
                      {m.supplier && (
                        <p className="truncate text-xs text-gray-500">
                          {m.supplier}
                        </p>
                      )}
                    </div>
                    {low && <Badge tone="red">Low stock</Badge>}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatQuantity(m.quantity, m.unit)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Updated {formatDateTime(m.updated_at)}
                    </p>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
