import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import PlantSearchBar from '../../components/common/PlantSearchBar.jsx';
import PlantImage from '../../components/common/PlantImage.jsx';
import ReservationModal from '../../components/products/ReservationModal.jsx';
import {
  Store,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Tag,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservingProduct, setReservingProduct] = useState(null);
  const [reservationSuccess, setReservationSuccess] = useState('');

  // Fetch categories once
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.data?.success) setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  // Fetch products with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setLoading(true);
      setError('');

      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory) params.category = selectedCategory;

      api.get('/products', { params })
        .then((res) => {
          if (res.data?.success) {
            setProducts(res.data.products || []);
          }
        })
        .catch((err) => {
          setError('Failed to load plants from database. Please check connection.');
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCategory]);

  const handleClear = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Browse Plants & Agricultural Inputs
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Search real plants, saplings, seeds, and farm inputs directly from verified Karnataka nurseries
        </p>
      </div>

      {/* Real Search Bar */}
      <div className="mb-8">
        <PlantSearchBar
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            if (val) setSearchParams({ search: val });
            else setSearchParams({});
          }}
          onClear={handleClear}
          loading={loading}
        />
      </div>

      {/* Category Pills Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none justify-start sm:justify-center">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === ''
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Success banner */}
      {reservationSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{reservationSuccess}</span>
          </div>
          <Link to="/customer/dashboard" className="text-xs font-bold underline hover:text-emerald-900">
            View in Dashboard →
          </Link>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Plant Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-sm">Searching verified nursery inventory...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
            🌱
          </div>
          <h3 className="text-lg font-bold text-slate-900">No plants found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm
              ? `No plant listings matched "${searchTerm}". Try checking spelling or searching a category.`
              : 'No products are currently available in this category.'}
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSearchParams({});
              }}
              className="mt-4 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors"
            >
              Clear Search & Show All Plants
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Actual Seller Photo */}
              <div className="h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                <PlantImage
                  src={prod.images && prod.images.length > 0 ? prod.images[0].url : null}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-800/80 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wide">
                  {prod.category?.name || 'Plant'}
                </span>
                {prod.nursery?.isApproved && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold shadow-sm">
                    Verified
                  </span>
                )}
              </div>

              {/* Plant Meta */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                  {prod.name}
                </h3>
                {prod.variety && (
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">{prod.variety}</p>
                )}
                {prod.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{prod.description}</p>
                )}

                {/* Seller & Location */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                    <Store className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {prod.nursery?.name || 'Nursery'}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {prod.nursery?.city || 'Karnataka'}
                  </span>
                </div>

                {/* Price and Stock */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">₹{prod.price}</span>
                    <span className="text-xs text-slate-500 ml-1">/{prod.unit}</span>
                  </div>
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                    {prod.stockQuantity} in stock
                  </span>
                </div>

                {/* Reserve & Pickup Action */}
                <button
                  onClick={() => setReservingProduct(prod)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shadow-emerald-100"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Reserve for Pickup
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservation Modal */}
      {reservingProduct && (
        <ReservationModal
          product={reservingProduct}
          onClose={() => setReservingProduct(null)}
          onSuccess={(res) => {
            setReservingProduct(null);
            setReservationSuccess(
              `Pickup reservation successfully booked at ${res.nursery?.name} for ${new Date(res.pickupDate).toLocaleDateString()}!`
            );
          }}
        />
      )}
    </div>
  );
}
