import { useCallback, useEffect, useMemo, useState } from 'react';
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

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'all', label: 'All' },
];

function rangeStartIso(key) {
  if (key === 'all') return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (key === 'week') {
    // Last 7 days inclusive of today.
    d.setDate(d.getDate() - 6);
  }
  return d.toISOString();
}

export default function LogsPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState('week');
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async (r) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listTransactions({
        limit: PAGE_SIZE,
        offset: 0,
        sinceIso: rangeStartIso(r),
      });
      setTxs(rows);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial(range);
  }, [range, loadInitial]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const rows = await listTransactions({
        limit: PAGE_SIZE,
        offset: txs.length,
        sinceIso: rangeStartIso(range),
      });
      setTxs((prev) => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoadingMore(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of txs) {
      const key = formatRelativeDay(t.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return Array.from(map.entries());
  }, [txs]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Logs</h1>
        <p className="text-sm text-gray-500">
          Every stock movement, newest first.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              range === r.key
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error && txs.length === 0 ? (
        <ErrorState message={error} onRetry={() => loadInitial(range)} />
      ) : txs.length === 0 ? (
        <EmptyState
          title="No activity"
          description={
            range === 'all'
              ? 'Stock movements will appear here once they’re recorded.'
              : 'Nothing in this range. Try widening the filter.'
          }
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
                      style={{
                        contentVisibility: 'auto',
                        containIntrinsicSize: '0 56px',
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Badge tone={t.type === 'IN' ? 'green' : 'red'}>
                          {t.type}
                        </Badge>
                        <div className="min-w-0">
                          <button
                            onClick={() =>
                              navigate(`/materials/${t.material_id}`)
                            }
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
