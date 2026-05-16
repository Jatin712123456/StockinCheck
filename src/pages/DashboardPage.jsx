import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useMaterialsStore } from '../stores/materialsStore';
import { supabase } from '../services/supabaseClient';
import {
  listTransactions,
  listTransactionsSince,
} from '../services/transactionsService';
import {
  formatQuantity,
  formatTime,
  startOfTodayIso,
} from '../utils/formatters';
import { debounce } from '../utils/debounce';
import { friendlyError } from '../utils/validators';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';

function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { materials, fetchMaterials } = useMaterialsStore();
  const [todayTx, setTodayTx] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await fetchMaterials();
      const [todays, recentTx] = await Promise.all([
        listTransactionsSince(startOfTodayIso()),
        listTransactions({ limit: 10 }),
      ]);
      setTodayTx(todays);
      setRecent(recentTx);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // Coalesce bursts of realtime events into one refetch so rapid stock
    // movements from multiple users don't thrash the network.
    const debouncedFetchMaterials = debounce(() => fetchMaterials(), 500);
    const debouncedLoadAll = debounce(loadAll, 500);

    const channel = supabase
      .channel('materials-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        debouncedFetchMaterials
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        debouncedLoadAll
      )
      .subscribe();
    return () => {
      debouncedFetchMaterials.cancel();
      debouncedLoadAll.cancel();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = materials.length;
    const low = materials.filter(
      (m) => Number(m.quantity) < Number(m.minimum_stock)
    ).length;
    const addedToday = todayTx
      .filter((t) => t.type === 'IN')
      .reduce((s, t) => s + Number(t.quantity), 0);
    const removedToday = todayTx
      .filter((t) => t.type === 'OUT')
      .reduce((s, t) => s + Number(t.quantity), 0);
    return { total, low, addedToday, removedToday };
  }, [materials, todayTx]);

  function onSearchSubmit(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/materials?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/materials');
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={loadAll} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your inventory.</p>
      </div>

      <form onSubmit={onSearchSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search materials…"
          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Total materials" value={stats.total} />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={stats.low}
          tone="red"
        />
        <StatCard
          icon={TrendingUp}
          label="Stock in today"
          value={stats.addedToday}
          tone="green"
        />
        <StatCard
          icon={TrendingDown}
          label="Stock out today"
          value={stats.removedToday}
          tone="amber"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent activity
          </h2>
          <button
            onClick={() => navigate('/logs')}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            No activity yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge tone={t.type === 'IN' ? 'green' : 'red'}>
                    {t.type}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {t.material_name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {formatQuantity(t.quantity)} · {t.user_name}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-500">
                  {formatTime(t.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
