import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 focus:ring-blue-500',
  secondary:
    'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 focus:ring-gray-300',
  success:
    'bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-emerald-300 focus:ring-emerald-500',
  danger:
    'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 focus:ring-red-500',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50 focus:ring-gray-300',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
