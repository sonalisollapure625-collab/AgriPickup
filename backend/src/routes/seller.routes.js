import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// GET seller's nursery profile and plant listings
router.get('/my-nursery', authenticate, authorize('SELLER'), async (req, res, next) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        nurseries: {
          include: {
            products: {
              include: {
                category: true,
                images: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const nursery = seller.nurseries[0] || null;
    res.json({ success: true, seller, nursery, products: nursery?.products || [] });
  } catch (error) {
    next(error);
  }
});

// CREATE a plant listing with photo upload
router.post(
  '/products',
  authenticate,
  authorize('SELLER'),
  upload.array('images', 5),
  async (req, res, next) => {
    try {
      const { name, categoryId, description, price, stockQuantity, variety, unit } = req.body;

      if (!name || !categoryId || !price) {
        return res.status(400).json({
          success: false,
          message: 'Plant name, category, and price are required.',
        });
      }

      // Find or create the nursery for this seller
      let seller = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.id },
        include: { nurseries: true },
      });

      if (!seller) {
        return res.status(404).json({ success: false, message: 'Seller profile not found' });
      }

      let nursery = seller.nurseries[0];
      if (!nursery) {
        // Create nursery record if seller doesn't have one yet
        nursery = await prisma.nursery.create({
          data: {
            sellerId: seller.id,
            name: seller.businessName || `${seller.ownerName}'s Nursery`,
            address: 'Karnataka',
            city: 'Bengaluru',
            pincode: '560001',
            latitude: 12.9716,
            longitude: 77.5946,
            phone: seller.phone || '9999999999',
            isActive: true,
            isApproved: true,
          },
        });
      }

      // Create Product
      const product = await prisma.product.create({
        data: {
          nurseryId: nursery.id,
          categoryId: String(categoryId),
          name: name.trim(),
          variety: variety ? variety.trim() : null,
          description: description ? description.trim() : null,
          price: parseFloat(price),
          stockQuantity: parseInt(stockQuantity, 10) || 0,
          inStock: (parseInt(stockQuantity, 10) || 0) > 0,
          unit: unit || 'plant',
          isPublished: true,
        },
      });

      // Handle uploaded photos
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const fileUrl = `/uploads/${file.filename}`;
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: fileUrl,
              altText: product.name,
              isPrimary: i === 0,
            },
          });
        }
      }

      const createdProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: { category: true, images: true },
      });

      res.status(201).json({
        success: true,
        message: 'Plant listed successfully.',
        product: createdProduct,
      });
    } catch (error) {
      next(error);
    }
  }
);

// EDIT a plant listing
router.put(
  '/products/:id',
  authenticate,
  authorize('SELLER'),
  upload.array('images', 5),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, categoryId, description, price, stockQuantity, variety, unit } = req.body;

      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.id },
        include: { nurseries: true },
      });

      const nurseryIds = seller?.nurseries.map((n) => n.id) || [];

      // Verify product belongs to this seller's nursery
      const existingProduct = await prisma.product.findFirst({
        where: { id, nurseryId: { in: nurseryIds } },
      });

      if (!existingProduct) {
        return res.status(404).json({ success: false, message: 'Plant listing not found or unauthorized' });
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(categoryId && { categoryId: String(categoryId) }),
          ...(description !== undefined && { description: description.trim() }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(stockQuantity !== undefined && {
            stockQuantity: parseInt(stockQuantity, 10),
            inStock: parseInt(stockQuantity, 10) > 0,
          }),
          ...(variety !== undefined && { variety: variety.trim() }),
          ...(unit && { unit }),
        },
      });

      // If new images were provided, append them
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileUrl = `/uploads/${file.filename}`;
          await prisma.productImage.create({
            data: {
              productId: id,
              url: fileUrl,
              altText: updated.name,
              isPrimary: false,
            },
          });
        }
      }

      const finalProduct = await prisma.product.findUnique({
        where: { id },
        include: { category: true, images: true },
      });

      res.json({ success: true, message: 'Plant listing updated successfully.', product: finalProduct });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE a plant listing
router.delete('/products/:id', authenticate, authorize('SELLER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: { nurseries: true },
    });

    const nurseryIds = seller?.nurseries.map((n) => n.id) || [];

    const existingProduct = await prisma.product.findFirst({
      where: { id, nurseryId: { in: nurseryIds } },
    });

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Plant listing not found or unauthorized' });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Plant listing deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// GET SELLER INCOMING RESERVATIONS & ORDERS
router.get('/orders', authenticate, authorize('SELLER'), async (req, res, next) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: { nurseries: true },
    });

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const nurseryIds = seller.nurseries.map((n) => n.id);

    const orders = await prisma.order.findMany({
      where: { nurseryId: { in: nurseryIds } },
      include: {
        customer: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true, images: true } },
          },
        },
        reservation: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
});

// UPDATE ORDER & RESERVATION STATUS (Seller action)
// Stages: CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED (or REJECTED/CANCELLED)
router.patch('/orders/:id/status', authenticate, authorize('SELLER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${validStatuses.join(', ')}`,
      });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: { nurseries: true },
    });

    const nurseryIds = seller?.nurseries.map((n) => n.id) || [];

    // Verify order belongs to this seller's nursery
    const order = await prisma.order.findFirst({
      where: { id, nurseryId: { in: nurseryIds } },
      include: { reservation: true, customer: { include: { user: true } } },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    const now = new Date().toISOString();
    const existingHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];

    const statusLabels = {
      CONFIRMED: 'Reservation Confirmed',
      PREPARING: 'Preparing Your Plants',
      READY_FOR_PICKUP: 'Ready for Pickup',
      COMPLETED: 'Collected / Completed',
      CANCELLED: 'Cancelled / Rejected',
    };

    const updatedHistory = [
      ...existingHistory,
      {
        status,
        label: statusLabels[status] || status,
        timestamp: now,
        note: note || `Updated by seller to ${statusLabels[status] || status}.`,
      },
    ];

    // Determine DB OrderStatus (Prisma enum OrderStatus values: PENDING, CONFIRMED, READY_FOR_PICKUP, COMPLETED, CANCELLED)
    let dbOrderStatus = status;
    if (status === 'PREPARING') {
      // Keep OrderStatus as CONFIRMED in DB enum while storing PREPARING in statusHistory
      dbOrderStatus = 'CONFIRMED';
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: dbOrderStatus,
          statusHistory: updatedHistory,
        },
      });

      // Synchronize linked reservation status
      if (order.reservationId) {
        let resStatus = 'CONFIRMED';
        if (status === 'COMPLETED') resStatus = 'FULFILLED';
        if (status === 'CANCELLED') resStatus = 'CANCELLED';

        await tx.reservation.update({
          where: { id: order.reservationId },
          data: { status: resStatus },
        });
      }

      // If collected / completed and was cash on pickup, update payment to COMPLETED
      if (status === 'COMPLETED') {
        await tx.payment.updateMany({
          where: { orderId: id },
          data: { status: 'COMPLETED' },
        });
      }
    });

    // Notify customer
    if (order.customer?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: order.customer.user.id,
          title: `Order Update: ${statusLabels[status] || status}`,
          message: `Your plant order #${order.id.slice(0, 8)} status is now: ${statusLabels[status] || status}.`,
        },
      });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { reservation: true, payment: true },
    });

    res.json({
      success: true,
      message: `Order status updated to ${statusLabels[status] || status}.`,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
