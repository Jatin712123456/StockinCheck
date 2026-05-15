import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ScrollText,
  User,
  Shield,
  Package,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Package className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold text-gray-900">
          Material Manager
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Home" />
        <NavItem to="/materials" icon={Boxes} label="Materials" />
        <NavItem to="/logs" icon={ScrollText} label="Logs" />
        <NavItem to="/profile" icon={User} label="Profile" />
        {isAdmin && <NavItem to="/admin" icon={Shield} label="Admin" />}
      </nav>
      <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
        {profile?.name || profile?.email}
        {profile?.role && (
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 capitalize">
            {profile.role}
          </span>
        )}
      </div>
    </aside>
  );
}
