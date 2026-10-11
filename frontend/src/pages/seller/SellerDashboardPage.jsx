import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import api from '../../services/api.js';
import PlantImage from '../../components/common/PlantImage.jsx';
import {
  Store,
  Plus,
  Upload,
  Trash2,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  X,
  ShoppingBag,
  Calendar,
  Clock,
  Check,
  XCircle,
  Star,
  MessageSquare,
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'catalog', or 'reviews'
  const [nursery, setNursery] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: 0, count: 0 });
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variety, setVariety] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [unit, setUnit] = useState('plant');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchSellerData = async () => {
    try {
      const [nurseryRes, categoriesRes, ordersRes, reviewsRes] = await Promise.all([
        api.get('/sellers/my-nursery'),
        api.get('/categories'),
        api.get('/sellers/orders').catch(() => ({ data: { success: true, orders: [] } })),
        api.get('/reviews/seller-summary').catch(() => ({ data: { success: true, reviews: [], averageRating: 0, count: 0 } })),
      ]);

      if (nurseryRes.data?.success) {
        setNursery(nurseryRes.data.nursery);
        setProducts(nurseryRes.data.products || []);
      }
      if (categoriesRes.data?.success) {
        setCategories(categoriesRes.data.categories || []);
        if (categoriesRes.data.categories.length > 0 && !categoryId) {
          setCategoryId(categoriesRes.data.categories[0].id);
        }
      }
      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.orders || []);
      }
      if (reviewsRes.data?.success) {
        setReviewsData({
          reviews: reviewsRes.data.reviews || [],
          averageRating: reviewsRes.data.averageRating || 0,
          count: reviewsRes.data.count || 0,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load seller profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/sellers/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        setSuccess(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}.`);
        // Refresh orders list
        const ordersRes = await api.get('/sellers/orders');
        if (ordersRes.data?.success) {
          setOrders(ordersRes.data.orders);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files (JPEG, PNG, WebP) are allowed.');
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        setError('Files must be under 8MB each.');
        return false;
      }
      return true;
    });

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Generate previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setVariety('');
    setDescription('');
    setPrice('');
    setStockQuantity('');
    setUnit('plant');
    setSelectedFiles([]);
    setPreviews([]);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEditForm = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategoryId(prod.categoryId);
    setVariety(prod.variety || '');
    setDescription(prod.description || '');
    setPrice(prod.price);
    setStockQuantity(prod.stockQuantity);
    setUnit(prod.unit || 'plant');
    setSelectedFiles([]);
    setPreviews([]);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !categoryId || !price) {
      setError('Please provide plant name, category, and price.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('categoryId', categoryId);
      formData.append('variety', variety.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('stockQuantity', stockQuantity || '0');
      formData.append('unit', unit);

      for (const file of selectedFiles) {
        formData.append('images', file);
      }

      if (editingProduct) {
        await api.put(`/sellers/products/${editingProduct.id}`, formData);
        setSuccess('Plant listing updated successfully.');
      } else {
        await api.post('/sellers/products', formData);
        setSuccess('Plant listed successfully.');
      }

      setShowForm(false);
      fetchSellerData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save plant listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this plant listing?')) return;

    try {
      await api.delete(`/sellers/products/${productId}`);
      setSuccess('Plant listing removed.');
      fetchSellerData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Store className="w-3.5 h-3.5" />
            Seller Portal • Karnataka
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {nursery?.name || user?.name || 'Seller Dashboard'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your nursery catalog, inventory, and plant photographs
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Plant
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {/* Plant Add/Edit Form Modal */}
      {showForm && (
        <div className="mb-10 bg-white rounded-2xl border border-emerald-200 shadow-md p-6 sm:p-8">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {editingProduct ? 'Edit Plant Listing' : 'Add New Plant to Nursery'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Plant / Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmiri Fragrant Rose, Hybrid Guava"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                {categories.length === 0 ? (
                  <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs">
                    No plant categories loaded. Please check your network connection or refresh.
                  </div>
                ) : (
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="" disabled>-- Select a Plant Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Variety / Breed (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Red Hybrid, Desi organic grafted"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Selling Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                >
                  <option value="plant">per plant</option>
                  <option value="sapling">per sapling</option>
                  <option value="kg">per kg</option>
                  <option value="packet">per packet</option>
                  <option value="bag">per bag</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="150"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Available Quantity in Stock
                </label>
                <input
                  type="number"
                  placeholder="25"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Description & Plant Care Tips
              </label>
              <textarea
                rows={3}
                placeholder="Details on plant age, bag size, sunlight needs, watering..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* Plant Photographs Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Plant Photographs (Upload actual images)
                </label>
                {selectedFiles.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {selectedFiles.length} photo(s) selected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/30 w-36 h-36">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600 text-center">Select Photos</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Previews of newly selected files */}
                {previews.map((src, index) => (
                  <div key={index} className="relative w-36 h-36 rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-semibold">
                      Ready to upload
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Images are saved directly to the server and linked permanently to this plant in your nursery catalog.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm disabled:bg-slate-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Plant Listing'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3.5 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Incoming Nursery Orders & Reservations</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-extrabold">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3.5 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Plant Catalog</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3.5 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reviews'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>Customer Reviews & Ratings</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-extrabold flex items-center gap-1">
            ★ {reviewsData.averageRating || '0'} ({reviewsData.count || 0})
          </span>
        </button>
      </div>

      {/* Tab 1: Incoming Orders & Reservations */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Incoming Nursery Orders</h2>
              <p className="text-xs text-slate-500">Manage real customer reservations and update pickup readiness</p>
            </div>
            <button
              onClick={fetchSellerData}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg bg-emerald-50/50"
            >
              Refresh Orders
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No incoming reservations or orders yet</p>
              <p className="text-xs text-slate-400 mt-1">
                New customer reservations made for your nursery will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-emerald-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">Order #{order.id.slice(0, 8)}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'READY_FOR_PICKUP'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'PREPARING'
                              ? 'bg-amber-100 text-amber-800'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Placed: {new Date(order.createdAt).toLocaleString()}</span>
                        <span>Customer: <strong className="text-slate-700">{order.customer?.name}</strong> ({order.customer?.phone || order.customer?.email})</span>
                      </div>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-base font-extrabold text-slate-900">₹{order.totalAmount}</div>
                      <div className="text-xs text-slate-500">
                        {order.payments?.[0]?.paymentMethod === 'UPI' ? 'UPI Payment' : 'Cash on Pickup'} •{' '}
                        <span className={order.payments?.[0]?.status === 'COMPLETED' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                          {order.payments?.[0]?.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="py-4 space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            <PlantImage
                              src={item.product?.images?.[0]?.url || null}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{item.product?.name}</div>
                            <div className="text-xs text-slate-500">
                              Qty: {item.quantity} × ₹{item.unitPrice}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-800">₹{item.totalPrice}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pickup schedule details */}
                  {order.reservation && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex flex-wrap gap-4 mb-4">
                      <span>
                        <strong>Scheduled Pickup:</strong>{' '}
                        {new Date(order.reservation.pickupDate).toLocaleDateString()}
                      </span>
                      <span>
                        <strong>Slot:</strong> {order.reservation.pickupTimeSlot}
                      </span>
                      {order.reservation.notes && (
                        <span>
                          <strong>Customer Note:</strong> {order.reservation.notes}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status Action Buttons for Seller */}
                  {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-end">
                      <span className="text-xs font-semibold text-slate-500 mr-2">{t('updateStage', 'Update Stage')}:</span>

                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:bg-slate-300"
                        >
                          {t('confirmResAction', 'Accept / Confirm')}
                        </button>
                      )}

                      {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:bg-slate-300"
                        >
                          {t('markPreparing', 'Mark Preparing')}
                        </button>
                      )}

                      {(order.status === 'PREPARING' || order.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:bg-slate-300"
                        >
                          {t('markReady', 'Mark Ready for Pickup')}
                        </button>
                      )}

                      {(order.status === 'READY_FOR_PICKUP' || order.status === 'PREPARING') && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:bg-slate-300"
                        >
                          {t('markDispatched', 'Mark Dispatched')}
                        </button>
                      )}

                      {(order.status === 'READY_FOR_PICKUP' || order.status === 'OUT_FOR_DELIVERY') && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:bg-slate-300"
                        >
                          {t('markDelivered', 'Mark Delivered / Collected')}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to reject/cancel this reservation? Stock will be restocked.')) {
                            handleUpdateOrderStatus(order.id, 'CANCELLED');
                          }
                        }}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {t('rejectResAction', 'Reject / Cancel')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Plant Catalog */}
      {activeTab === 'catalog' && (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">My Plant Catalog</h2>
          <span className="text-xs font-semibold text-slate-500">
            {products.length} listed item(s)
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No plant listings yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Add New Plant" to list your first plant with actual photos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Photo */}
                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <PlantImage
                    src={prod.images && prod.images.length > 0 ? prod.images[0].url : null}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-medium">
                    {prod.category?.name || 'Plant'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 text-base">{prod.name}</h3>
                  {prod.variety && (
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">{prod.variety}</p>
                  )}
                  {prod.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{prod.description}</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900">₹{prod.price}</span>
                      <span className="text-xs text-slate-500 ml-1">/{prod.unit}</span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        prod.stockQuantity > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {prod.stockQuantity > 0 ? `${prod.stockQuantity} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => openEditForm(prod)}
                      className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Tab 3: Customer Reviews & Ratings */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('customerReviews', 'Customer Ratings & Reviews')}</h2>
              <p className="text-xs text-slate-500">Genuine feedback from customers whose plant reservations were delivered</p>
            </div>

            {/* Average Rating Card */}
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
              <div className="text-2xl font-black text-amber-900">{reviewsData.averageRating || '0.0'}</div>
              <div>
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(reviewsData.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-amber-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-amber-800 font-medium">
                  {reviewsData.count || 0} {t('basedOnReviews', 'ratings')}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : !reviewsData.reviews || reviewsData.reviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">{t('noReviewsYet', 'No customer reviews yet')}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Reviews will appear here as soon as customers collect or receive their reserved plants.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsData.reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-slate-700 ml-1">({rev.rating}/5)</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 font-medium italic">
                      "{rev.comment || 'Verified purchase'}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {rev.user?.name || 'Customer'}
                    </span>
                    {rev.product?.name && (
                      <span className="text-emerald-700 font-medium truncate max-w-[160px]">
                        🌱 {rev.product.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
