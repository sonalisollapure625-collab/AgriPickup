import { Router } from 'express';
import { plantDoctorController } from '../controllers/plant-doctor.controller.js';

const router = Router();

// Analyze plant photo using genuine AI service (Gemini Vision / Plant.id)
router.post('/analyze', plantDoctorController.analyzePlant);

// History and management
router.get('/history', plantDoctorController.getHistory);
router.delete('/history/:id', plantDoctorController.deleteHistoryItem);

export default router;
