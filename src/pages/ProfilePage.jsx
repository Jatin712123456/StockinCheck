import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabaseClient';
import { friendlyError } from '../utils/validators';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();
  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  async function onChangePassword(e) {
    e.preventDefault();
    const errs = {};
    if (!current) errs.current = 'Current password is required';
    if (!next || next.length < 6)
      errs.next = 'New password must be at least 6 characters';
    if (next !== confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      // Verify current password by reauthenticating.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInErr) {
        setErrors({ current: 'Current password is incorrect' });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success('Password updated');
      setPwOpen(false);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Manage your account.</p>
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-gray-900">
              {profile?.name || '—'}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <Badge tone={profile?.role === 'admin' ? 'blue' : 'gray'}>
            {profile?.role === 'admin' ? 'Admin' : 'Staff'}
          </Badge>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setPwOpen(true)}>
            <KeyRound className="h-4 w-4" /> Change password
          </Button>
          <Button variant="danger" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </Card>

      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change password"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onChangePassword} loading={submitting}>
              Update
            </Button>
          </>
        }
      >
        <form onSubmit={onChangePassword} className="space-y-3">
          <Input
            label="Current password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            error={errors.current}
          />
          <Input
            label="New password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            error={errors.next}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
        </form>
      </Modal>
    </div>
  );
}
