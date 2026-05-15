import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { listProfiles, updateUserRole } from '../services/usersService';
import { formatDateTime } from '../utils/formatters';
import { friendlyError } from '../utils/validators';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setProfiles(await listProfiles());
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(p) {
    if (p.id === user.id) return; // can't change own role
    const next = p.role === 'admin' ? 'staff' : 'admin';
    setSavingId(p.id);
    try {
      const updated = await updateUserRole(p.id, next);
      setProfiles((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      toast.success(`${updated.name || updated.email} is now ${next}`);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500">Manage user roles.</p>
      </div>

      <Card>
        <ul className="divide-y divide-gray-100">
          {profiles.map((p) => {
            const isSelf = p.id === user.id;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {p.name || '—'}
                    </p>
                    <Badge tone={p.role === 'admin' ? 'blue' : 'gray'}>
                      {p.role === 'admin' ? 'Admin' : 'Staff'}
                    </Badge>
                    {isSelf && <Badge tone="amber">You</Badge>}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {p.email} · Joined {formatDateTime(p.created_at)}
                  </p>
                </div>
                <div>
                  <Button
                    size="sm"
                    variant={p.role === 'admin' ? 'secondary' : 'primary'}
                    onClick={() => toggleRole(p)}
                    disabled={isSelf}
                    loading={savingId === p.id}
                  >
                    {p.role === 'admin' ? 'Make Staff' : 'Make Admin'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
