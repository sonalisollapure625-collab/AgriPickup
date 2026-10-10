import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import nurseryRoutes from './nursery.routes.js';
import sellerRoutes from './seller.routes.js';
import inventoryRoutes from './inventory.routes.js';
import reservationRoutes from './reservation.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import plantDoctorRoutes from './plant-doctor.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/nurseries', nurseryRoutes);
router.use('/sellers', sellerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reservations', reservationRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/plant-doctor', plantDoctorRoutes);

export default router;
