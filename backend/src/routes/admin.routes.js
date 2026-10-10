import { Router } from 'express';
const router = Router();
router.get('/stats', (req, res) => res.json({ stats: { users: 0, nurseries: 0, products: 0 } }));
export default router;
