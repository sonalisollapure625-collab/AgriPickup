import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ inventory: [] }));
export default router;
