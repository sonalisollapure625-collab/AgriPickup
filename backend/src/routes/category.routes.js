import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { DEFAULT_PLANT_CATEGORIES } from '../constants/categories.js';

const router = Router();

// GET all plant categories (automatically ensures standard categories exist in database)
router.get('/', async (req, res, next) => {
  try {
    let categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // If categories table in PostgreSQL is empty, populate the standard plant categories
    if (categories.length === 0) {
      for (const cat of DEFAULT_PLANT_CATEGORIES) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        });
      }

      categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
});

export default router;
