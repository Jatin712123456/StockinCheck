import { Package } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function TopBar() {
  const { profile } = useAuthStore();
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 md:hidden"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
          <Package className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-gray-900">
          Material Manager
        </span>
      </div>
      {profile?.role && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
          {profile.role}
        </span>
      )}
    </header>
  );
}
