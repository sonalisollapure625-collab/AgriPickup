import { Router } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

// GET all published products from verified nurseries in the database
router.get('/', async (req, res, next) => {
  try {
    const { category, search, nurseryId } = req.query;

    const where = {
      isPublished: true,
      nursery: {
        isActive: true,
      },
    };

    if (category) {
      where.category = { slug: String(category) };
    }

    if (nurseryId) {
      where.nurseryId = String(nurseryId);
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { variety: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } },
        { category: { slug: { contains: term, mode: 'insensitive' } } },
        { nursery: { name: { contains: term, mode: 'insensitive' } } },
        { nursery: { seller: { businessName: { contains: term, mode: 'insensitive' } } } },
        { nursery: { seller: { ownerName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: true,
        nursery: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            isApproved: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
});

// GET single product by id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        nursery: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            phone: true,
            offersHomeDelivery: true,
            offersPickup: true,
            isApproved: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

export default router;
