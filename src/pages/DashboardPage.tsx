import { useEffect, useState } from 'react';
import { Users, Package, ShoppingCart, Building2, TrendingUp, Clock } from 'lucide-react';
import api from '../services/api';

interface Stats {
  users: number;
  products: number;
  orders: number;
  organizations: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, orders: 0, organizations: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, productsRes, ordersRes, orgsRes] = await Promise.all([
          api.get('/users?limit=1'),
          api.get('/products?limit=1'),
          api.get('/orders?limit=1'),
          api.get('/organizations?limit=1'),
        ]);
        
        setStats({
          users: usersRes.data.total || 0,
          products: productsRes.data.total || 0,
          orders: ordersRes.data.total || 0,
          organizations: orgsRes.data.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: 'Пользователи', value: stats.users, icon: Users, color: 'bg-blue-500' },
    { name: 'Товары', value: stats.products, icon: Package, color: 'bg-green-500' },
    { name: 'Заказы', value: stats.orders, icon: ShoppingCart, color: 'bg-yellow-500' },
    { name: 'Организации', value: stats.organizations, icon: Building2, color: 'bg-purple-500' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Главная</h1>
        <p className="text-slate-500">Добро пожаловать в панель управления Heat Stand-Art</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.name}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {isLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} shadow-lg shadow-${stat.color.split('-')[1]}-500/30`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100 hover:border-slate-200">
            <TrendingUp className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-slate-700 font-medium">Синхронизация с iiko</span>
          </button>
          <button className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100 hover:border-slate-200">
            <Users className="w-5 h-5 text-blue-500 mr-3" />
            <span className="text-slate-700 font-medium">Управление пользователями</span>
          </button>
          <button className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100 hover:border-slate-200">
            <Clock className="w-5 h-5 text-yellow-500 mr-3" />
            <span className="text-slate-700 font-medium">Последние заказы</span>
          </button>
        </div>
      </div>
    </div>
  );
}
