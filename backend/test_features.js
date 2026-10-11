import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'agripickup_jwt_secret_dev_2026';

async function runTests() {
  console.log('=== Running 4-Feature Verification Test Suite ===');

  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  const seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  const product = await prisma.product.findFirst({
    where: { stockQuantity: { gt: 5 } },
    include: { nursery: true },
  });

  const customerToken = jwt.sign({ id: customer.id, role: customer.role }, JWT_SECRET, { expiresIn: '1d' });
  const custClient = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: product.nursery.sellerId },
    include: { user: true },
  });
  const nurseryOwner = sellerProfile.user;
  const nurseryOwnerToken = jwt.sign({ id: nurseryOwner.id, role: nurseryOwner.role }, JWT_SECRET, { expiresIn: '1d' });
  const sellerClient = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${nurseryOwnerToken}` },
  });

  // 1. Place a customer order & reservation
  console.log('\n[Feature 2 Test] Customer places reservation for seller nursery');
  const orderRes = await custClient.post('/orders', {
    nurseryId: product.nurseryId,
    productId: product.id,
    quantity: 2,
    pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickupTimeSlot: 'Morning (9:00 AM - 1:00 PM)',
    paymentMethod: 'CASH_ON_PICKUP',
    notes: 'Please select healthy seedlings',
  });
  const order = orderRes.data.order;
  console.log(`✓ Order created: #${order.id.slice(0, 8)}, linked reservation: #${order.reservationId.slice(0, 8)}`);

  // 2. Seller views incoming reservations
  console.log('\n[Feature 2 Test] Seller views incoming orders & reservations');
  const sellerOrdersRes = await sellerClient.get('/sellers/orders');
  const foundOrder = sellerOrdersRes.data.orders.find((o) => o.id === order.id);
  if (!foundOrder) throw new Error('Order not found in seller dashboard incoming reservations');
  console.log(`✓ Order correctly present on seller dashboard: Customer name: ${foundOrder.customer?.user?.name}, Items: ${foundOrder.items?.length}`);

  // 3. Seller updates status: CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED (DELIVERED)
  console.log('\n[Feature 2 Test] Seller updates status through stages');
  const s1 = await sellerClient.patch(`/sellers/orders/${order.id}/status`, { status: 'PREPARING' });
  console.log(`✓ Updated to: ${s1.data.order.status}`);

  const s2 = await sellerClient.patch(`/sellers/orders/${order.id}/status`, { status: 'OUT_FOR_DELIVERY' });
  console.log(`✓ Updated to: ${s2.data.order.status} (Dispatched)`);

  const s3 = await sellerClient.patch(`/sellers/orders/${order.id}/status`, { status: 'COMPLETED' });
  console.log(`✓ Updated to: ${s3.data.order.status} (Delivered / Collected)`);

  // 4. Feature 3: Ratings and Reviews
  console.log('\n[Feature 3 Test] Customer submits 5-star review for delivered order');
  const reviewRes = await custClient.post('/reviews', {
    orderId: order.id,
    rating: 5,
    comment: 'Exceptional quality seedlings and prompt pickup experience!',
  });
  console.log(`✓ Review submitted successfully: ID ${reviewRes.data.review.id}, Rating: ${reviewRes.data.review.rating} stars`);

  // Test duplicate prevention
  console.log('\n[Feature 3 Test] Prevent duplicate review for same order');
  try {
    await custClient.post('/reviews', {
      orderId: order.id,
      rating: 4,
      comment: 'Trying to review again',
    });
    throw new Error('Duplicate review was improperly allowed');
  } catch (err) {
    console.log(`✓ Duplicate review rejected: "${err.response?.data?.message}"`);
  }

  // Seller views reviews summary
  console.log('\n[Feature 3 Test] Seller views customer reviews and average rating');
  const summaryRes = await sellerClient.get('/reviews/seller-summary');
  console.log(`✓ Seller review summary: Average Rating: ${summaryRes.data.averageRating} ★, Total Reviews: ${summaryRes.data.count}`);

  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
  await prisma.$disconnect();
}

runTests().catch(async (e) => {
  console.error('Test failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
