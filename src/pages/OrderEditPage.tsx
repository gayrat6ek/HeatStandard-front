import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import type { Order, OrderItemResponse } from '../types';

// Defining OrderDetail type extending Order to include items if not already in generic type
interface OrderDetail extends Order {
  items: OrderItemResponse[];
  notes?: string;
}

export default function OrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get<OrderDetail>(`/orders/${id}`);
        const data = response.data;
        setOrder(data);
        setFormData({
          status: data.status,
          notes: data.notes || '',
        });
      } catch (err) {
        setError('Failed to load order');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await api.put(`/orders/${id}`, formData);
      navigate('/orders');
    } catch (err) {
      setError('Failed to update order');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
            <p className="text-slate-500 font-mono text-sm">ID: {order.id}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Customer Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Customer Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="text-slate-900">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-900">{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="text-slate-900 text-right truncate max-w-[200px]">{order.customer_address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
             <div className="space-y-2 text-sm">
               <div className="flex justify-between">
                 <span className="text-slate-500">Total Amount:</span>
                 <span className="text-slate-900 font-bold">{order.total_amount?.toLocaleString()} UZS</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Created At:</span>
                 <span className="text-slate-900">{new Date(order.created_at).toLocaleString()}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Updated At:</span>
                 <span className="text-slate-900">{new Date(order.updated_at).toLocaleString()}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Items</h3>
          <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-slate-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.price?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-medium">{item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
              placeholder="Add internal notes..."
            />
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center px-6 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Update Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
