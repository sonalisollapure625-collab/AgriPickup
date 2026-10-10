import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// GET user reservations from database (for authenticated customer or seller)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    let reservations = [];

    if (customer) {
      reservations = await prisma.reservation.findMany({
        where: { customerId: customer.id },
        include: {
          nursery: {
            select: { name: true, city: true, address: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Check if user is a seller viewing their nursery's reservations
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.id },
        include: { nurseries: true },
      });

      if (seller) {
        const nurseryIds = seller.nurseries.map((n) => n.id);
        reservations = await prisma.reservation.findMany({
          where: { nurseryId: { in: nurseryIds } },
          include: {
            nursery: { select: { name: true, city: true } },
            customer: {
              include: {
                user: { select: { name: true, phone: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    res.json({ success: true, count: reservations.length, reservations });
  } catch (error) {
    next(error);
  }
});

// CREATE a new nursery pickup reservation
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { nurseryId, pickupDate, pickupTimeSlot, notes } = req.body;

    if (!nurseryId || !pickupDate) {
      return res.status(400).json({
        success: false,
        message: 'Nursery ID and pickup date are required.',
      });
    }

    // Ensure customer profile exists
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

    // Verify nursery exists
    const nursery = await prisma.nursery.findUnique({
      where: { id: nurseryId },
    });

    if (!nursery || !nursery.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Nursery not found or unavailable for pickup.',
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerId: customer.id,
        nurseryId,
        pickupDate: new Date(pickupDate),
        pickupTimeSlot: pickupTimeSlot || 'Morning (9:00 AM - 1:00 PM)',
        notes: notes ? String(notes).trim() : null,
        status: 'CONFIRMED',
      },
      include: {
        nursery: {
          select: { name: true, address: true, city: true, phone: true },
        },
      },
    });

    // Create confirmation notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Nursery Reservation Confirmed',
        message: `Your pickup reservation at ${nursery.name} is confirmed for ${new Date(pickupDate).toLocaleDateString()}.`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Pickup reservation confirmed successfully.',
      reservation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
