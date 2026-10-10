import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// GET user orders from database (Customer sees their own; Seller sees nursery orders)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (customer) {
      const orders = await prisma.order.findMany({
        where: { customerId: customer.id },
        include: {
          nursery: {
            select: { id: true, name: true, city: true, address: true, phone: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, unit: true, images: true },
              },
            },
          },
          reservation: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, count: orders.length, orders });
    }

    // Check if seller
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: { nurseries: true },
    });

    if (seller) {
      const nurseryIds = seller.nurseries.map((n) => n.id);
      const orders = await prisma.order.findMany({
        where: { nurseryId: { in: nurseryIds } },
        include: {
          customer: {
            include: {
              user: { select: { name: true, phone: true, email: true } },
            },
          },
          nursery: {
            select: { id: true, name: true, city: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, unit: true, images: true },
              },
            },
          },
          reservation: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, count: orders.length, orders });
    }

    return res.json({ success: true, count: 0, orders: [] });
  } catch (error) {
    next(error);
  }
});

// GET single order by ID with secure authorization check
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        nursery: {
          select: { id: true, name: true, address: true, city: true, phone: true, sellerId: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, unit: true, images: true, variety: true },
            },
          },
        },
        reservation: true,
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Authorize: customer must own the order or seller must own the nursery
    const isCustomerOwner = order.customer?.user?.id === req.user.id;
    let isSellerOwner = false;

    if (!isCustomerOwner) {
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.id },
        include: { nurseries: true },
      });
      isSellerOwner = seller?.nurseries?.some((n) => n.id === order.nurseryId) || false;
    }

    if (!isCustomerOwner && !isSellerOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this order.' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

// CREATE Order & Reserve Plants (Combined Checkout)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      productId,
      quantity = 1,
      pickupDate,
      pickupTimeSlot,
      paymentMethod = 'CASH_ON_PICKUP',
      notes,
    } = req.body;

    const reqQty = parseInt(quantity, 10);
    if (!productId || isNaN(reqQty) || reqQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid plant selection and quantity (minimum 1) are required.',
      });
    }

    if (!pickupDate) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an intended pickup date.',
      });
    }

    // Fetch verified product and stock from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { nursery: true },
    });

    if (!product || !product.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Selected plant is currently not available or delisted.',
      });
    }

    if (!product.nursery || !product.nursery.isActive) {
      return res.status(400).json({
        success: false,
        message: 'The nursery providing this plant is currently inactive.',
      });
    }

    // Stock check
    if (product.stockQuantity < reqQty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock available. Only ${product.stockQuantity} plants in nursery.`,
      });
    }

    // Ensure customer profile
    let customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) {
      customer = await prisma.customerProfile.create({
        data: {
          userId: req.user.id,
          state: 'Karnataka',
        },
      });
    }

    // Server-computed total price
    const unitPrice = product.price;
    const totalAmount = unitPrice * reqQty;

    // Build timeline array
    const now = new Date().toISOString();
    const initialTimeline = [
      {
        status: 'ORDER_PLACED',
        label: 'Order Placed',
        timestamp: now,
        note: `Order submitted for ${reqQty} × ${product.name} at ₹${unitPrice}/plant.`,
      },
      {
        status: 'CONFIRMED',
        label: 'Reservation Confirmed',
        timestamp: now,
        note: `Pickup reserved for ${new Date(pickupDate).toLocaleDateString()} (${pickupTimeSlot || 'Morning'}).`,
      },
    ];

    // Atomically create Reservation, Order, OrderItem, and Payment in Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create linked Reservation
      const reservation = await tx.reservation.create({
        data: {
          customerId: customer.id,
          nurseryId: product.nurseryId,
          pickupDate: new Date(pickupDate),
          pickupTimeSlot: pickupTimeSlot || 'Morning (9:00 AM - 1:00 PM)',
          notes: notes ? String(notes).trim() : null,
          status: 'CONFIRMED',
        },
      });

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          nurseryId: product.nurseryId,
          reservationId: reservation.id,
          totalAmount,
          status: 'CONFIRMED',
          fulfillmentType: 'PICKUP',
          statusHistory: initialTimeline,
        },
      });

      // 3. Create OrderItem
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: reqQty,
          unitPrice,
          totalPrice: totalAmount,
        },
      });

      // 4. Create Payment record
      const isUpi = paymentMethod === 'UPI';
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          paymentMethod: isUpi ? 'UPI' : 'CASH_ON_PICKUP',
          status: isUpi ? 'PENDING' : 'PENDING',
          transactionId: isUpi ? `UPI-PENDING-${Date.now()}` : null,
        },
      });

      // 5. Decrement Stock
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: { decrement: reqQty },
          inStock: product.stockQuantity - reqQty > 0,
        },
      });

      return { order, reservation };
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Plant Reservation & Order Confirmed',
        message: `Order #${result.order.id.slice(0, 8)} confirmed. Your ${product.name} will be ready at ${product.nursery.name} on ${new Date(pickupDate).toLocaleDateString()}.`,
      },
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        nursery: { select: { name: true, city: true, address: true, phone: true } },
        items: { include: { product: { select: { name: true, unit: true, images: true } } } },
        reservation: true,
        payment: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Reservation and order created successfully.',
      order: fullOrder,
    });
  } catch (error) {
    next(error);
  }
});

// CANCEL an order by customer (allowed only when PENDING or CONFIRMED)
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) {
      return res.status(403).json({ success: false, message: 'Customer account not found.' });
    }

    const order = await prisma.order.findFirst({
      where: { id, customerId: customer.id },
      include: { items: true, reservation: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order at stage '${order.status}'. Please contact nursery directly.`,
      });
    }

    const now = new Date().toISOString();
    const existingHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const updatedHistory = [
      ...existingHistory,
      {
        status: 'CANCELLED',
        label: 'Order Cancelled',
        timestamp: now,
        note: reason || 'Cancelled by customer.',
      },
    ];

    await prisma.$transaction(async (tx) => {
      // 1. Update order
      await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          statusHistory: updatedHistory,
        },
      });

      // 2. Update linked reservation if present
      if (order.reservationId) {
        await tx.reservation.update({
          where: { id: order.reservationId },
          data: { status: 'CANCELLED' },
        });
      }

      // 3. Restock inventory
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            inStock: true,
          },
        });
      }

      // 4. Update payment status if exists
      await tx.payment.updateMany({
        where: { orderId: id },
        data: { status: 'FAILED' },
      });
    });

    res.json({ success: true, message: 'Order successfully cancelled and items restocked.' });
  } catch (error) {
    next(error);
  }
});

export default router;
