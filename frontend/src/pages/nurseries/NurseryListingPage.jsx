import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import {
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function NurseryListingPage() {
  const [nurseries, setNurseries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/nurseries')
      .then((res) => {
        if (res.data?.success) {
          setNurseries(res.data.nurseries || []);
        }
      })
      .catch((err) => {
        setError('Failed to load nurseries from database.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Verified Karnataka Sellers & Nurseries
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Nearby & Verified Nurseries
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Discover verified local plant suppliers, certified garden centers, and hi-tech nurseries across Karnataka
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-sm">Fetching verified nurseries from database...</span>
        </div>
      ) : nurseries.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto p-8 shadow-sm">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No nurseries registered yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Registered nurseries from Karnataka will appear here once onboarded.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nurseries.map((nursery) => (
            <div
              key={nursery.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  {nursery.isApproved && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900">{nursery.name}</h3>
                {nursery.seller?.ownerName && (
                  <p className="text-xs text-slate-500 mt-0.5">Proprietor: {nursery.seller.ownerName}</p>
                )}

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{nursery.address ? `${nursery.address}, ` : ''}{nursery.city}, {nursery.state}</span>
                  </p>
                  {nursery.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{nursery.phone}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-emerald-700">
                      {nursery._count?.products || 0} plant variety available
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/plants?nurseryId=${nursery.id}`}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Browse Available Plants</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
