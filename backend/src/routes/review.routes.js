import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// GET /api/reviews?productId=... or ?nurseryId=... (Public)
router.get('/', async (req, res, next) => {
  try {
    const { productId, nurseryId } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (nurseryId) where.nurseryId = nurseryId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true } },
        product: { select: { id: true, name: true } },
        nursery: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating = reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : null;

    res.json({
      success: true,
      reviews,
      count: reviews.length,
      averageRating,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reviews/seller-summary (Seller reviews and average rating)
router.get('/seller-summary', authenticate, authorize('SELLER'), async (req, res, next) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: { nurseries: true },
    });

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const nurseryIds = seller.nurseries.map((n) => n.id);

    const reviews = await prisma.review.findMany({
      where: {
        nurseryId: { in: nurseryIds },
      },
      include: {
        user: { select: { name: true } },
        product: { select: { id: true, name: true } },
        nursery: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating = reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    res.json({
      success: true,
      reviews,
      count: reviews.length,
      averageRating,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews (Customer submits review for DELIVERED / COMPLETED order)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
    }

    // Customer profile lookup
    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) {
      return res.status(403).json({ success: false, message: 'Customer profile required to post reviews' });
    }

    // Verify order exists, belongs to this customer, and is COMPLETED / delivered
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
      },
      include: {
        items: true,
        nursery: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    // Only allow review after order is marked COMPLETED / delivered
    if (order.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after your plant reservation is collected or delivered.',
      });
    }

    // Prevent duplicate reviews for the same order
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: req.user.id,
        orderId: order.id,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this completed order.',
      });
    }

    const firstProduct = order.items?.[0];

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        orderId: order.id,
        nurseryId: order.nurseryId,
        productId: firstProduct ? firstProduct.productId : null,
        rating: Math.round(numericRating),
        comment: comment ? String(comment).trim() : null,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your rating and review!',
      review,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
