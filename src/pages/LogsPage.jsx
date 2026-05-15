import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTransactions } from '../services/transactionsService';
import {
  formatRelativeDay,
  formatTime,
  formatQuantity,
} from '../utils/formatters';
import { friendlyError } from '../utils/validators';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

const PAGE_SIZE = 50;

export default function LogsPage() {
  const navigate = useNavigate();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listTransactions({ limit: PAGE_SIZE, offset: 0 });
      setTxs(rows);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const rows = await listTransactions({
        limit: PAGE_SIZE,
        offset: txs.length,
      });
      setTxs((prev) => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (e) {
      // surface with toast-less inline fallback
      setError(friendlyError(e));
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of txs) {
      const key = formatRelativeDay(t.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return Array.from(map.entries());
  }, [txs]);

  if (loading) return <Spinner />;
  if (error && txs.length === 0)
    return <ErrorState message={error} onRetry={loadInitial} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Logs</h1>
        <p className="text-sm text-gray-500">Every stock movement, newest first.</p>
      </div>

      {txs.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Stock movements will appear here once they’re recorded."
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([day, rows]) => (
            <div key={day}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {day}
              </h2>
              <Card>
                <ul className="divide-y divide-gray-100">
                  {rows.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Badge tone={t.type === 'IN' ? 'green' : 'red'}>
                          {t.type}
                        </Badge>
                        <div className="min-w-0">
                          <button
                            onClick={() => navigate(`/materials/${t.material_id}`)}
                            className="block truncate text-left font-medium text-gray-900 hover:underline"
                          >
                            {t.material_name}
                          </button>
                          <p className="truncate text-xs text-gray-500">
                            {formatQuantity(t.quantity)} · {t.user_name}
                            {t.note ? ` · ${t.note}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-gray-500">
                        {formatTime(t.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                onClick={loadMore}
                loading={loadingMore}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
