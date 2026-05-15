import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-gray-400" />
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
