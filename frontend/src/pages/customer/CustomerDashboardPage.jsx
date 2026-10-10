import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import {
  Stethoscope,
  ShoppingBag,
  Bookmark,
  Bell,
  User,
  LogOut,
  Package,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.allSettled([
      api.get('/orders'),
      api.get('/reservations'),
      api.get('/notifications'),
    ]).then(([ordersRes, resRes, notifRes]) => {
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.orders) {
        setOrders(ordersRes.value.data.orders);
      }
      if (resRes.status === 'fulfilled' && resRes.value.data?.reservations) {
        setReservations(resRes.value.data.reservations);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.data?.notifications) {
        setNotifications(notifRes.value.data.notifications);
      }
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
        <p className="text-sm text-slate-600 mt-2">
          Please sign in to view your orders, reservations, and profile.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* User Header Profile */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            Role: {user.role}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user.email} {user.phone ? `• ${user.phone}` : ''}
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Prominent Plant Doctor AI Banner */}
      <div className="mb-10 bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3 backdrop-blur-sm">
            <Stethoscope className="w-3.5 h-3.5" />
            AI Diagnostic Tool
          </div>
          <h2 className="text-2xl font-bold">Have an unhealthy or infected plant?</h2>
          <p className="mt-1 text-emerald-50 text-sm max-w-xl">
            Use Plant Doctor AI to diagnose diseases from your phone camera or gallery, receive reliable treatment advice, and buy suitable remedies from verified Karnataka nurseries.
          </p>
        </div>
        <Link
          to="/plant-doctor"
          className="px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl shadow-md transition-all whitespace-nowrap flex items-center gap-2"
        >
          <Stethoscope className="w-5 h-5 text-emerald-600" />
          Launch Plant Doctor AI
        </Link>
      </div>

      {/* Sections based on real database records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">My Orders</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                {orders.length} order(s)
              </span>
              <Link
                to="/orders"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                View All
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-100 flex-1 flex flex-col items-center justify-center">
              <Package className="w-8 h-8 text-slate-300 mb-2" />
              <p>No orders placed yet.</p>
              <Link
                to="/plants"
                className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Browse Plants to Reserve
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <span>Order #{order.id.slice(0, 8)}</span>
                      <span className="text-emerald-700 font-bold">₹{order.totalAmount}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Status: <span className="font-medium text-slate-700">{order.status}</span> • {order.items?.length || 1} item(s)
                    </div>
                  </div>
                  <Link
                    to={`/orders/${order.id}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm whitespace-nowrap transition-colors"
                  >
                    Track
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reservations Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Nursery Reservations</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                {reservations.length} reservation(s)
              </span>
              <Link
                to="/reservations"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                View All
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-100 flex-1 flex flex-col items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-300 mb-2" />
              <p>No reservations booked yet.</p>
              <Link
                to="/plants"
                className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Reserve Nursery Plants
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {reservations.slice(0, 3).map((res) => (
                <div key={res.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <span>{res.nursery?.name || 'Nursery'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {res.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Pickup: {new Date(res.pickupDate).toLocaleDateString()} ({res.pickupTimeSlot})
                    </div>
                  </div>
                  {res.order?.id && (
                    <Link
                      to={`/orders/${res.order.id}`}
                      className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold whitespace-nowrap transition-colors"
                    >
                      Track Order
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
