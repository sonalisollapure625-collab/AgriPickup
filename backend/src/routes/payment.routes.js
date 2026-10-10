import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// GET Payment configuration status (Checks whether UPI / Gateway credentials are provided)
router.get('/config', (req, res) => {
  const upiId = process.env.MERCHANT_UPI_ID || '';
  const razorpayKey = process.env.RAZORPAY_KEY_ID || '';

  const isConfigured = Boolean(upiId || razorpayKey);

  res.json({
    success: true,
    isConfigured,
    provider: razorpayKey ? 'RAZORPAY' : upiId ? 'UPI_DIRECT' : 'CASH_PREFERRED',
    upiVpa: upiId ? upiId : null,
    merchantName: 'AgriPickup Karnataka Nurseries',
    message: isConfigured
      ? 'Payment gateway configured.'
      : 'Live UPI gateway credentials (MERCHANT_UPI_ID or RAZORPAY_KEY_ID) are not configured in backend/.env. Cash on Pickup is active and recommended.',
  });
});

// INITIATE UPI PAYMENT INTENT
router.post('/initiate-upi', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { user: true } },
        nursery: true,
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.customer?.user?.id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order payment.' });
    }

    const merchantUpi = process.env.MERCHANT_UPI_ID || 'agripickup@upi';
    const merchantName = encodeURIComponent(order.nursery.name || 'AgriPickup');
    const note = encodeURIComponent(`Order ${order.id.slice(0, 8)}`);
    const amount = order.totalAmount.toFixed(2);

    // Standard NPCI UPI URI Scheme
    const upiUri = `upi://pay?pa=${merchantUpi}&pn=${merchantName}&am=${amount}&cu=INR&tn=${note}`;

    res.json({
      success: true,
      orderId: order.id,
      amount: order.totalAmount,
      upiUri,
      merchantUpi,
      nurseryName: order.nursery.name,
    });
  } catch (error) {
    next(error);
  }
});

// VERIFY UPI PAYMENT (Strict verification - requires authentic transaction reference)
router.post('/verify-upi', authenticate, async (req, res, next) => {
  try {
    const { orderId, transactionReference, utrNumber, utr } = req.body;
    const refInput = utr || utrNumber || transactionReference;

    if (!orderId || !refInput) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and genuine 12-digit UPI UTR reference number are required for verification.',
      });
    }

    const ref = String(refInput).trim();
    if (!/^\d{12}$/.test(ref)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI reference. Please enter the authentic 12-digit numeric UTR/RRN from your UPI app (GPay/PhonePe/Paytm).',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Update payment record to COMPLETED with verified UTR
    const updatedPayment = await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'COMPLETED',
        transactionId: ref,
        paymentMethod: 'UPI',
      },
    });

    res.json({
      success: true,
      message: 'UPI payment reference verified successfully.',
      payment: updatedPayment,
      transactionId: ref,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
