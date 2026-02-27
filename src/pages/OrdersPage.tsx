import { useEffect, useState } from 'react';
import type { Order, PaginatedResponse } from '../types';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, Search, Eye } from 'lucide-react';

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'Ожидает' },
  confirmed: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Подтвержден' },
  declined: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Отклонен' },
};

const statusFilters: Record<string, string> = {
  all: 'Все',
  pending: 'Ожидает',
  confirmed: 'Подтвержден',
  declined: 'Отклонен',
};

// Format price with $ and smart decimals
const formatPrice = (amount: number): string => {
  if (amount === Math.floor(amount)) {
    return `$${amount.toLocaleString()}`;
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'all') params.status = filter;
      
      const response = await api.get<PaginatedResponse<Order>>('/orders', { params });
      setOrders(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  // Filter orders by search query (order number)
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().replace('#', '');
    return order.order_number?.toString().includes(query) ||
           order.customer_name.toLowerCase().includes(query) ||
           order.customer_phone.includes(query);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Заказы</h1>
          <p className="text-slate-500">Отслеживание и управление заказами</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по № заказа или клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusFilters).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === status
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">Заказы не найдены</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">№ Заказа</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Клиент</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 hidden md:table-cell">Телефон</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Сумма</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Статус</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 hidden md:table-cell">Дата</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                
                return (
                  <tr 
                    key={order.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold text-red-600">#{order.order_number || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{order.customer_name}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-slate-600">{order.customer_phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{formatPrice(order.total_amount || 0)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-slate-500 text-sm">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}`);
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Открыть
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-slate-500">
        Показано {filteredOrders.length} из {total} заказов
      </div>
    </div>
  );
}
