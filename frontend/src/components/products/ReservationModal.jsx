import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Store,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  Banknote,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import api from '../../services/api.js';
import PlantImage from '../common/PlantImage.jsx';

export default function ReservationModal({ product, onClose, onSuccess }) {
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('Morning (9:00 AM - 1:00 PM)');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_PICKUP'); // 'CASH_ON_PICKUP' or 'UPI'
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableStock = product?.stockQuantity || 0;
  const unitPrice = Number(product?.price || 0);
  const totalAmount = (quantity * unitPrice).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (quantity < 1) {
      setError('Please select at least 1 plant.');
      return;
    }

    if (quantity > availableStock) {
      setError(`Requested quantity (${quantity}) exceeds currently available nursery stock (${availableStock}).`);
      return;
    }

    if (!pickupDate) {
      setError('Please select a pickup date.');
      return;
    }

    setLoading(true);

    try {
      // Backend validates stock, price, calculates total and sets up order + reservation
      const res = await api.post('/orders', {
        nurseryId: product.nurseryId,
        productId: product.id,
        quantity: Number(quantity),
        pickupDate,
        pickupTimeSlot,
        paymentMethod,
        notes: notes.trim(),
      });

      if (res.data?.success && res.data.order) {
        if (onSuccess) {
          onSuccess(res.data.order);
        }
        // Redirect directly to the live Order Tracking page
        navigate(`/orders/${res.data.order.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not complete reservation and checkout. Please verify your login status.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Reserve & Checkout</h3>
            <p className="text-xs text-slate-500">Secure nursery pickup with verified reservation</p>
          </div>
        </div>

        {/* Plant Snapshot */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0">
            <PlantImage
              src={product.images && product.images.length > 0 ? product.images[0].url : null}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-emerald-700 font-bold">₹{unitPrice}</span>
              <span className="text-xs text-slate-400">/ {product.unit || 'plant'}</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
              <Store className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {product.nursery?.name || 'Verified Nursery'}
            </p>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
              In Stock: {availableStock} {product.unit || 'plants'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Selector with Live Calculation */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Quantity <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">Units to reserve</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-emerald-300 rounded-lg overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  disabled={loading || quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={availableStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.min(Math.max(1, val), availableStock || 1));
                  }}
                  className="w-12 text-center text-sm font-bold text-slate-900 border-none focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  className="px-3 py-1 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  disabled={loading || quantity >= availableStock}
                >
                  +
                </button>
              </div>
              <div className="text-right min-w-[70px]">
                <div className="text-xs text-slate-400">Total</div>
                <div className="text-sm font-black text-emerald-800">₹{totalAmount}</div>
              </div>
            </div>
          </div>

          {/* Pickup Date & Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Pickup Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Pickup Slot
              </label>
              <select
                value={pickupTimeSlot}
                onChange={(e) => setPickupTimeSlot(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-white"
              >
                <option value="Morning (9:00 AM - 1:00 PM)">Morning (9 AM - 1 PM)</option>
                <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1 PM - 4 PM)</option>
                <option value="Evening (4:00 PM - 7:00 PM)">Evening (4 PM - 7 PM)</option>
              </select>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                  paymentMethod === 'CASH_ON_PICKUP'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Cash on Pickup</span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_PICKUP"
                    checked={paymentMethod === 'CASH_ON_PICKUP'}
                    onChange={() => setPaymentMethod('CASH_ON_PICKUP')}
                    className="accent-emerald-600"
                    disabled={loading}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pay cash or scanning nursery QR upon plant inspection at nursery.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>UPI Payment</span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="accent-emerald-600"
                    disabled={loading}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pay via GPay, PhonePe, Paytm with verified 12-digit UTR reference.
                </p>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Instructions for Nursery (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Please select healthy flowering plants"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
            />
          </div>

          {/* Pricing summary */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Payable Amount:</span>
            <span className="text-base font-extrabold text-slate-900">₹{totalAmount}</span>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableStock === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 flex items-center gap-2 disabled:bg-slate-300 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Order...
                </>
              ) : (
                `Confirm & Reserve (₹${totalAmount})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
