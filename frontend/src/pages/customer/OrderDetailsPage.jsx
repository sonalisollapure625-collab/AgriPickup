import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PlantImage from '../../components/common/PlantImage.jsx';
import {
  Package,
  Calendar,
  Store,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  XCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // UPI Payment State
  const [upiData, setUpiData] = useState(null);
  const [upiLoading, setUpiLoading] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [upiSuccessMsg, setUpiSuccessMsg] = useState('');
  const [upiErrorMsg, setUpiErrorMsg] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data?.success) {
        setOrder(res.data.order);
      } else {
        setError(res.data?.message || 'Could not load order details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to retrieve order from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
      if (res.data?.success) {
        setShowCancelModal(false);
        fetchOrder();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleInitiateUpi = async () => {
    setUpiLoading(true);
    setUpiErrorMsg('');
    try {
      const res = await api.post('/payments/initiate-upi', { orderId: id });
      if (res.data?.success) {
        setUpiData(res.data);
      }
    } catch (err) {
      setUpiErrorMsg(err.response?.data?.message || 'Could not initiate UPI intent.');
    } finally {
      setUpiLoading(false);
    }
  };

  const handleVerifyUpi = async () => {
    if (!utrInput.trim()) {
      setUpiErrorMsg('Please enter the 12-digit UPI UTR number from your payment receipt.');
      return;
    }

    setVerifyingUpi(true);
    setUpiErrorMsg('');
    try {
      const res = await api.post('/payments/verify-upi', {
        orderId: id,
        utrNumber: utrInput.trim(),
      });
      if (res.data?.success) {
        setUpiSuccessMsg('Payment verified successfully!');
        fetchOrder();
      }
    } catch (err) {
      setUpiErrorMsg(err.response?.data?.message || 'Verification failed. Please double check your UTR.');
    } finally {
      setVerifyingUpi(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span className="text-sm">Fetching order & tracking details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm text-slate-600 mt-2">{error || 'This order could not be located.'}</p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Orders
        </Link>
      </div>
    );
  }

  // Define Tracking Stages for Nursery Pickup Flow
  const stages = [
    { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Plant reservation submitted' },
    { key: 'CONFIRMED', label: 'Reservation Confirmed', desc: 'Nursery confirmed reservation' },
    { key: 'PREPARING', label: 'Preparing Your Plants', desc: 'Inspection, packing, hardening' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Available at nursery desk' },
    { key: 'COMPLETED', label: 'Collected / Completed', desc: 'Plant collected by buyer' },
  ];

  // Map order status to stage index
  const statusStageMap = {
    PENDING: 0,
    CONFIRMED: 1,
    PREPARING: 2,
    READY_FOR_PICKUP: 3,
    COMPLETED: 4,
  };

  const isCancelled = order.status === 'CANCELLED';
  const currentStageIndex = isCancelled ? -1 : (statusStageMap[order.status] ?? 1);

  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const historyArray = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Back Navigation */}
      <div className="mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Orders
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
              <Package className="w-3.5 h-3.5" />
              Nursery Pickup Order
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
              >
                Cancel Order
              </button>
            )}
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Total Amount</span>
              <span className="text-2xl font-black text-emerald-700">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Online Shopping-Style Visual Progress Timeline */}
        <div className="my-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">
            Live Order Status & Pickup Progress
          </h3>

          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Order Cancelled</p>
                <p className="text-xs text-red-700 mt-0.5">This plant reservation was cancelled and inventory has been restocked.</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Progress Line */}
              <div className="hidden sm:block absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentStageIndex / (stages.length - 1)) * 100))}%`,
                  }}
                />
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                {stages.map((stg, idx) => {
                  const isDone = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stg.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all flex-shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>

                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-emerald-700'
                              : isDone
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {stg.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{stg.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status History Logs with Genuine Timestamps */}
        {historyArray.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Activity History & Verification Log
            </h4>
            <div className="space-y-2">
              {historyArray.map((hist, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{hist.label || hist.status}: </span>
                    <span className="text-slate-600">{hist.note}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(hist.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Plant Items + Nursery Pickup Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Plant Items */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>Reserved Plants</span>
          </h3>

          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3.5 pb-3 border-b border-slate-100 last:border-b-0">
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                  <PlantImage
                    src={item.product?.images?.[0]?.url}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{item.product?.name}</h4>
                  {item.product?.variety && (
                    <p className="text-xs text-slate-500">Variety: {item.product.variety}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5">
                    {item.quantity} × ₹{item.unitPrice}
                  </p>
                </div>
                <div className="text-right font-bold text-emerald-700 text-sm">
                  ₹{item.totalPrice}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-700">Subtotal:</span>
            <span className="text-slate-900">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Nursery & Pickup Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>Nursery Pickup Location</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-900 text-sm">{order.nursery?.name}</p>
                <p className="mt-0.5 text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.nursery?.address ? `${order.nursery.address}, ` : ''}{order.nursery?.city}, Karnataka</span>
                </p>
                {order.nursery?.phone && (
                  <p className="mt-1 text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nursery Contact: <strong>{order.nursery.phone}</strong></span>
                  </p>
                )}
              </div>

              {order.reservation && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    Pickup Schedule
                  </p>
                  <p>Date: {new Date(order.reservation.pickupDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p>Slot: {order.reservation.pickupTimeSlot || 'Morning'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Badge */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Option:</span>
              <span className="font-bold text-slate-800">
                {order.payment?.paymentMethod === 'UPI' ? 'UPI Payment' : 'Cash on Pickup'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-500">Payment Status:</span>
              <span
                className={`font-bold ${
                  order.payment?.status === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-600'
                }`}
              >
                {order.payment?.status || 'PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Gateway Section if method was UPI and still pending */}
      {order.payment?.paymentMethod === 'UPI' && order.payment?.status === 'PENDING' && !isCancelled && (
        <div className="bg-white rounded-3xl border border-purple-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pay Online via UPI</h3>
              <p className="text-xs text-slate-500">Fast, instant payment verification directly to verified nursery account</p>
            </div>
          </div>

          {!upiData ? (
            <div>
              <p className="text-xs text-slate-600 mb-4">
                Click below to generate the secure UPI QR link for ₹{order.totalAmount}.
              </p>
              <button
                onClick={handleInitiateUpi}
                disabled={upiLoading}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
              >
                {upiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Generate UPI Payment Link
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-xs text-purple-900 space-y-2">
                <p><strong>Merchant VPA:</strong> {upiData.merchantUpi}</p>
                <p><strong>Amount:</strong> ₹{upiData.amount}</p>
                <a
                  href={upiData.upiUri}
                  className="inline-block mt-2 px-4 py-2 bg-purple-700 text-white font-bold rounded-lg"
                >
                  Open in UPI App (GPay / PhonePe / Paytm)
                </a>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 12-Digit UPI UTR Reference Number:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="e.g. 428910284712"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleVerifyUpi}
                    disabled={verifyingUpi}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    {verifyingUpi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Verify Payment
                  </button>
                </div>
              </div>

              {upiSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold">
                  {upiSuccessMsg}
                </div>
              )}
              {upiErrorMsg && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl font-semibold">
                  {upiErrorMsg}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Plant Reservation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure? Your reserved saplings will be returned to nursery stock for other farmers.
            </p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
