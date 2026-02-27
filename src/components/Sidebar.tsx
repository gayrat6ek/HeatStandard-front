import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart,
  Building2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Главная', href: '/', icon: LayoutDashboard },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Товары', href: '/products', icon: Package },
  { name: 'Заказы', href: '/orders', icon: ShoppingCart },
  { name: 'Организации', href: '/organizations', icon: Building2 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <img src="/logo.jpg" alt="Heat Stand-Art" className="h-10 w-10 rounded-lg object-cover" />
        <div className="ml-3">
          <h1 className="text-lg font-bold text-slate-900">Heat Stand-Art</h1>
          <p className="text-xs text-slate-500">Панель управления</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-50 text-red-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">
            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.username}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
