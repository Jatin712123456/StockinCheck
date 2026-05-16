import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Boxes, ScrollText, User, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition ${
          isActive ? 'text-blue-700' : 'text-gray-500 hover:text-gray-800'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-100 bg-white md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Item to="/dashboard" icon={LayoutDashboard} label="Home" />
      <Item to="/materials" icon={Boxes} label="Materials" />
      <Item to="/logs" icon={ScrollText} label="Logs" />
      <Item to="/profile" icon={User} label="Profile" />
      {isAdmin && <Item to="/admin" icon={Shield} label="Admin" />}
    </nav>
  );
}
