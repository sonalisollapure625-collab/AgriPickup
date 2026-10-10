import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlantSearchBar from '../../components/common/PlantSearchBar.jsx';
import { Sprout, Stethoscope, Store, ShieldCheck, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage({ apiHealth }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (val) => {
    if (val.trim()) {
      navigate(`/plants?search=${encodeURIComponent(val.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-emerald-50/20 to-white pt-12 pb-20 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Verified Karnataka Nurseries & Farm Inputs
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Find Nearby. Reserve Easily. <br />
            <span className="text-emerald-600">Grow Better.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-600">
            AgriPickup connects farmers and garden lovers with nearby government-approved and verified Karnataka nurseries. Browse healthy saplings, diagnose crop diseases with AI, and order with pickup or home delivery.
          </p>

          {/* Plant Search Bar in Hero */}
          <div className="mt-8 max-w-2xl mx-auto">
            <PlantSearchBar
              searchTerm={searchTerm}
              onSearchChange={(val) => setSearchTerm(val)}
              onClear={() => setSearchTerm('')}
              placeholder="Search plants by name, category, or nursery…"
            />
            {searchTerm.trim() && (
              <button
                onClick={() => handleSearchSubmit(searchTerm)}
                className="mt-3 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition-all inline-flex items-center gap-1.5"
              >
                <span>Search "{searchTerm}" in Plants</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/plants"
              className="px-6 py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Sprout className="w-5 h-5" />
              Browse Plants
            </Link>
            <Link
              to="/nurseries"
              className="px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-2 transition-all"
            >
              <Store className="w-5 h-5 text-emerald-600" />
              Explore Verified Nurseries
            </Link>
            <Link
              to="/plant-doctor"
              className="px-6 py-3.5 rounded-xl font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 shadow-sm flex items-center gap-2 transition-all"
            >
              <Stethoscope className="w-5 h-5 text-emerald-700" />
              Plant Doctor AI
            </Link>
          </div>

          {/* Backend Status Chip */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 shadow-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${apiHealth?.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
            <span>API Foundation Status: <strong>{apiHealth?.status === 'ok' ? 'Online & Healthy (/api/health)' : 'Connecting to Express API...'}</strong></span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Plant Doctor AI</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Upload plant photos to receive genuine preliminary AI assessments for crop diseases, pests, and deficiencies with matched remedies.
            </p>
            <Link to="/plant-doctor" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 gap-1">
              Start diagnosis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nearby Nurseries</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Locate verified Karnataka plant nurseries in Bangalore, Mandya, Mysore, and beyond with transparent pricing and stock.
            </p>
            <Link to="/nurseries" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 gap-1">
              Browse nurseries <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reserve & Pickup</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Lock in your favorite saplings and fertilizers ahead of time for easy scheduled drive-by nursery pickup or home delivery.
            </p>
            <Link to="/plants" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 gap-1">
              View plants & reserve <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
