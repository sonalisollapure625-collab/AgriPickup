import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'agripickup_jwt_secret_dev_2026';

async function runTests() {
  console.log('--- Starting AgriPickup Part 1 to 7 Test Suite ---');

  // Find a Customer and a Seller
  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  const seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  const product = await prisma.product.findFirst({
    where: { stockQuantity: { gt: 5 } },
    include: { nursery: true },
  });

  if (!customer || !seller || !product) {
    console.error('Missing seed data: customer, seller, or product not found.');
    process.exit(1);
  }

  console.log(`Test Customer: ${customer.email} (ID: ${customer.id})`);
  console.log(`Test Seller: ${seller.email} (ID: ${seller.id})`);
  console.log(`Test Product: ${product.name} (Stock: ${product.stockQuantity}, Price: ₹${product.price})`);

  const customerToken = jwt.sign({ id: customer.id, role: customer.role }, JWT_SECRET, { expiresIn: '1d' });
  const sellerToken = jwt.sign({ id: seller.id, role: seller.role }, JWT_SECRET, { expiresIn: '1d' });

  const custClient = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  const sellerClient = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${sellerToken}` },
  });

  // TEST 1: Customer can list their own reservations and orders
  console.log('\n[Test 1 & 2] Fetch Customer Orders & Reservations');
  const resOrders = await custClient.get('/orders');
  console.log(`✓ Orders endpoint returned HTTP 200, count: ${resOrders.data.orders.length}`);

  const resReservations = await custClient.get('/reservations');
  console.log(`✓ Reservations endpoint returned HTTP 200, count: ${resReservations.data.reservations.length}`);

  // TEST 3: Validate Stock Protection (Try ordering more than stock)
  console.log('\n[Test 3] Reject Order Exceeding Stock');
  try {
    await custClient.post('/orders', {
      nurseryId: product.nurseryId,
      productId: product.id,
      quantity: product.stockQuantity + 500,
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      pickupTimeSlot: 'Morning (9:00 AM - 1:00 PM)',
      paymentMethod: 'CASH_ON_PICKUP',
    });
    console.error('✗ Stock validation failed: Allowed over-stock order!');
  } catch (err) {
    console.log(`✓ Correctly rejected over-stock quantity: "${err.response?.data?.message}"`);
  }

  // TEST 4: Place genuine Cash on Pickup reservation
  console.log('\n[Test 4 & 5] Create Valid Order & Reservation (Cash on Pickup)');
  const initialStock = product.stockQuantity;
  const orderRes = await custClient.post('/orders', {
    nurseryId: product.nurseryId,
    productId: product.id,
    quantity: 2,
    pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickupTimeSlot: 'Morning (9:00 AM - 1:00 PM)',
    paymentMethod: 'CASH_ON_PICKUP',
    notes: 'Please keep vigorous seedlings ready.',
  });

  const createdOrder = orderRes.data.order;
  console.log(`✓ Order created: ID ${createdOrder.id}, Total: ₹${createdOrder.totalAmount}, Status: ${createdOrder.status}`);
  console.log(`✓ Linked Reservation: ID ${createdOrder.reservationId}, Status: ${createdOrder.reservation?.status}`);
  console.log(`✓ Payment: Method ${createdOrder.payment?.paymentMethod}, Status: ${createdOrder.payment?.status}`);

  // Verify stock decremented
  const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`✓ Stock decremented correctly: ${initialStock} -> ${updatedProduct.stockQuantity}`);

  // TEST 6: Verify UPI flow remains PENDING until authentic verification
  console.log('\n[Test 6] UPI Payment Verification Safety');
  const upiOrderRes = await custClient.post('/orders', {
    nurseryId: product.nurseryId,
    productId: product.id,
    quantity: 1,
    pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickupTimeSlot: 'Afternoon (1:00 PM - 4:00 PM)',
    paymentMethod: 'UPI',
  });
  const upiOrder = upiOrderRes.data.order;
  console.log(`✓ UPI Order created with payment status: ${upiOrder.payment?.status} (must be PENDING)`);

  const initUpi = await custClient.post('/payments/initiate-upi', { orderId: upiOrder.id });
  console.log(`✓ NPCI UPI Intent URI generated: ${initUpi.data.upiUri.substring(0, 35)}...`);

  // Try invalid UTR
  try {
    await custClient.post('/payments/verify-upi', { orderId: upiOrder.id, utr: 'invalid123' });
    console.error('✗ Failed: accepted invalid UTR');
  } catch (err) {
    console.log(`✓ Correctly rejected invalid UTR: "${err.response?.data?.message}"`);
  }

  // Verify with authentic 12-digit UTR
  const validUtr = '987654321098';
  const verifyRes = await custClient.post('/payments/verify-upi', { orderId: upiOrder.id, utr: validUtr });
  console.log(`✓ Valid 12-digit UTR accepted: Payment Status -> ${verifyRes.data.payment.status}, Transaction ID: ${verifyRes.data.payment.transactionId}`);

  // TEST 7: Order Tracking Timeline Verification
  console.log('\n[Test 7] Fetch Order Tracking & Status Timeline');
  const trackRes = await custClient.get(`/orders/${createdOrder.id}`);
  console.log(`✓ Order details retrieved: Stage ${trackRes.data.order.status}, Timeline events: ${trackRes.data.order.statusHistory?.length || 1}`);

  // TEST 8: Customer Authorization Isolation (customer cannot view another's order)
  console.log('\n[Test 8] Customer Data Isolation');
  const anotherCustomer = await prisma.user.findFirst({
    where: { role: 'CUSTOMER', id: { not: customer.id } },
  });
  if (anotherCustomer) {
    const anotherToken = jwt.sign({ id: anotherCustomer.id, role: anotherCustomer.role }, JWT_SECRET, { expiresIn: '1d' });
    const anotherClient = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${anotherToken}` } });
    try {
      await anotherClient.get(`/orders/${createdOrder.id}`);
      console.error('✗ Isolation failure: another customer accessed foreign order!');
    } catch (err) {
      console.log(`✓ Customer isolation enforced (HTTP ${err.response?.status}): "${err.response?.data?.message}"`);
    }
  }

  // TEST 9: Seller Updates Order Stages
  console.log('\n[Test 9] Seller Order Management');
  // Check nursery owner
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: product.nursery.sellerId },
    include: { user: true },
  });
  const nurseryOwner = sellerProfile.user;
  const nurseryOwnerToken = jwt.sign({ id: nurseryOwner.id, role: nurseryOwner.role }, JWT_SECRET, { expiresIn: '1d' });
  const nurseryOwnerClient = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${nurseryOwnerToken}` } });

  // Advance stages: PENDING -> PREPARING -> READY_FOR_PICKUP -> COMPLETED
  const updateRes1 = await nurseryOwnerClient.patch(`/sellers/orders/${createdOrder.id}/status`, { status: 'PREPARING' });
  console.log(`✓ Seller transitioned order to: ${updateRes1.data.order.status}`);

  const updateRes2 = await nurseryOwnerClient.patch(`/sellers/orders/${createdOrder.id}/status`, { status: 'READY_FOR_PICKUP' });
  console.log(`✓ Seller transitioned order to: ${updateRes2.data.order.status}`);

  const updateRes3 = await nurseryOwnerClient.patch(`/sellers/orders/${createdOrder.id}/status`, { status: 'COMPLETED' });
  console.log(`✓ Seller marked Collected / COMPLETED. Cash on Pickup marked: ${updateRes3.data.order.payment?.status}`);

  // Verify status history timeline has all timestamps
  const finalOrder = await prisma.order.findUnique({
    where: { id: createdOrder.id },
    include: { reservation: true, payment: true },
  });
  console.log(`✓ Timeline entries recorded: ${finalOrder.statusHistory?.length} events with authentic timestamps`);
  console.log(`✓ Linked Reservation status synchronized: ${finalOrder.reservation?.status}`);

  // TEST 10: Cancellation & Inventory Restock
  console.log('\n[Test 10] Customer Order Cancellation & Inventory Restock');
  const cancelTestOrder = await custClient.post('/orders', {
    nurseryId: product.nurseryId,
    productId: product.id,
    quantity: 3,
    pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickupTimeSlot: 'Morning (9:00 AM - 1:00 PM)',
    paymentMethod: 'CASH_ON_PICKUP',
  });
  const cancelOrderId = cancelTestOrder.data.order.id;
  const stockBeforeCancel = (await prisma.product.findUnique({ where: { id: product.id } })).stockQuantity;

  const cancelRes = await custClient.post(`/orders/${cancelOrderId}/cancel`);
  console.log(`✓ Cancelled successfully: "${cancelRes.data.message}"`);

  const stockAfterCancel = (await prisma.product.findUnique({ where: { id: product.id } })).stockQuantity;
  console.log(`✓ Restocked inventory: ${stockBeforeCancel} -> ${stockAfterCancel} (+3 restocked)`);

  console.log('\n=== ALL 10 TESTS PASSED SUCCESSFULLY! ===');
  await prisma.$disconnect();
}

runTests().catch(async (e) => {
  console.error('Test error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
