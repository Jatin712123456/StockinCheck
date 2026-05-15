import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { validEmail, friendlyError } from '../utils/validators';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    const emailErr = validEmail(email);
    if (emailErr) errs.email = emailErr;
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReset(e) {
    e.preventDefault();
    if (validEmail(forgotEmail)) {
      toast.error('Enter a valid email');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      setForgotSent(true);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Package className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Material Manager
          </h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Supabase not configured</p>
              <p className="mt-1">
                Create a <code className="rounded bg-amber-100 px-1">.env</code>{' '}
                file in the project root with{' '}
                <code className="rounded bg-amber-100 px-1">
                  REACT_APP_SUPABASE_URL
                </code>{' '}
                and{' '}
                <code className="rounded bg-amber-100 px-1">
                  REACT_APP_SUPABASE_ANON_KEY
                </code>
                , then restart the dev server. See <code>README.md</code>.
              </p>
            </div>
          </div>
        )}

        {!forgotOpen ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Button
              type="submit"
              className="w-full"
              loading={submitting}
              disabled={submitting}
            >
              Sign in
            </Button>
            <button
              type="button"
              onClick={() => {
                setForgotOpen(true);
                setForgotEmail(email);
                setForgotSent(false);
              }}
              className="block w-full text-center text-xs font-medium text-blue-600 hover:underline"
            >
              Forgot your password?
            </button>
          </form>
        ) : (
          <form onSubmit={sendReset} className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Reset password
            </h2>
            {forgotSent ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                If that email exists, a reset link has been sent.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  Enter your email and we’ll send you a reset link.
                </p>
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <Button type="submit" className="w-full">
                  Send reset link
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="block w-full text-center text-xs font-medium text-gray-600 hover:underline"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
