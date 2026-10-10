import { Router } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

// GET all active nurseries from database
router.get('/', async (req, res, next) => {
  try {
    const { city } = req.query;
    const where = { isActive: true };

    if (city) {
      where.city = { contains: String(city), mode: 'insensitive' };
    }

    const nurseries = await prisma.nursery.findMany({
      where,
      include: {
        seller: {
          select: {
            businessName: true,
            ownerName: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, count: nurseries.length, nurseries });
  } catch (error) {
    next(error);
  }
});

// GET single nursery by id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const nursery = await prisma.nursery.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            businessName: true,
            ownerName: true,
            phone: true,
            isVerified: true,
          },
        },
        products: {
          where: { isPublished: true },
          include: { category: true, images: true },
        },
      },
    });

    if (!nursery) {
      return res.status(404).json({ success: false, message: 'Nursery not found' });
    }

    res.json({ success: true, nursery });
  } catch (error) {
    next(error);
  }
});

export default router;
