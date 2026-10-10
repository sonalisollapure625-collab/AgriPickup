import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PlantImage from '../../components/common/PlantImage.jsx';
import {
  Bookmark,
  Calendar,
  Clock,
  Store,
  MapPin,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

export default function MyReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reservations');
      if (res.data?.success) {
        setReservations(res.data.reservations || []);
      } else {
        setError(res.data?.message || 'Could not load your reservations.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reservations from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
        <p className="text-sm text-slate-600 mt-2">
          Please sign in to view your nursery pickup reservations.
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
            <Bookmark className="w-3.5 h-3.5" />
            Nursery Pickup Schedule
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">My Reservations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View confirmed visit dates and scheduled plant collections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReservations}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh reservations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/plants"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>Browse More Plants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to Load Reservations</p>
            <p className="text-xs mt-0.5">{error}</p>
            <button
              onClick={fetchReservations}
              className="mt-2 text-xs font-bold text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-sm">Loading your pickup reservations...</span>
        </div>
      ) : reservations.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-lg mx-auto">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Reservations Yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            When you reserve plants for pickup from Karnataka nurseries, they will appear here with pickup timings.
          </p>
          <Link
            to="/plants"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm inline-flex items-center gap-2"
          >
            <span>Explore Plants to Reserve</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const pickupDt = new Date(res.pickupDate);
            const isPast = pickupDt < new Date() && res.status !== 'FULFILLED';
            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        res.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.status === 'FULFILLED'
                          ? 'bg-blue-100 text-blue-800'
                          : res.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {res.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: #{res.id.slice(0, 8)} • Booked on {new Date(res.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-600" />
                      {res.nursery?.name || 'Verified Nursery'}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.nursery?.address ? `${res.nursery.address}, ` : ''}{res.nursery?.city || 'Karnataka'}</span>
                    </p>
                    {res.nursery?.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Contact: {res.nursery.phone}</span>
                      </p>
                    )}
                  </div>

                  {res.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                      <span className="font-semibold text-slate-800">Items / Notes: </span>
                      {res.notes}
                    </div>
                  )}
                </div>

                {/* Pickup Timing Block */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:min-w-[240px] flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span>{pickupDt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{res.pickupTimeSlot || 'Morning'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                    <Link
                      to="/orders"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>View Orders</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
