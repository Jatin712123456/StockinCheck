import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className = '', as = 'input', ...rest },
  ref
) {
  const Tag = as;
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <Tag
        ref={ref}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${as === 'textarea' ? 'min-h-[88px] resize-y' : ''} ${className}`}
        {...rest}
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      ) : null}
    </label>
  );
});

export default Input;
