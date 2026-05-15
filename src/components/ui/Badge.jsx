const tones = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
};

export default function Badge({ tone = 'gray', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
