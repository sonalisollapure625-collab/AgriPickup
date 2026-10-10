import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PlantImage from '../../components/common/PlantImage.jsx';
import {
  ShoppingBag,
  Package,
  Calendar,
  Store,
  MapPin,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Eye,
  XCircle,
} from 'lucide-react';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      } else {
        setError(res.data?.message || 'Could not load your orders.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load orders from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
        <p className="text-sm text-slate-600 mt-2">
          Please sign in to view your plant orders and pickup tracking.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm inline-block"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Nursery Order Records
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track confirmed plant orders, pickup timeline, and payment statuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/plants"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>Browse Plants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to Load Orders</p>
            <p className="text-xs mt-0.5">{error}</p>
            <button onClick={fetchOrders} className="mt-2 text-xs font-bold text-red-700 underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-sm">Loading your orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-lg mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Orders Yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            You haven't reserved or ordered any plants yet. Browse available saplings from Karnataka nurseries to get started!
          </p>
          <Link
            to="/plants"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm inline-flex items-center gap-2"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const firstItem = order.items?.[0];
            const product = firstItem?.product;
            const primaryImg = product?.images?.[0]?.url;

            const statusColors = {
              CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              READY_FOR_PICKUP: 'bg-blue-100 text-blue-800 border-blue-200',
              COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
              CANCELLED: 'bg-red-100 text-red-800 border-red-200',
              PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
            };

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                    <PlantImage
                      src={primaryImg}
                      alt={product?.name || 'Plant'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          statusColors[order.status] || 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {order.status === 'READY_FOR_PICKUP' ? 'Ready for Pickup' : order.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {product?.name || 'Plant Order'}
                      {order.items?.length > 1 && (
                        <span className="text-xs font-normal text-slate-500 ml-1.5">
                          (+{order.items.length - 1} more item)
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.nursery?.name || 'Verified Nursery'} • {order.nursery?.city}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>Quantity: <strong className="text-slate-800">{firstItem?.quantity || 1}</strong></span>
                      <span>Total: <strong className="text-emerald-700">₹{order.totalAmount}</strong></span>
                      <span>Payment: <strong className="text-slate-700">{order.payment?.paymentMethod === 'UPI' ? 'UPI' : 'Cash on Pickup'} ({order.payment?.status || 'PENDING'})</strong></span>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center gap-3 self-end lg:self-center border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
