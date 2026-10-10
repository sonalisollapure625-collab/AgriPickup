import { plantDoctorService } from '../services/plant-doctor.service.js';

export const plantDoctorController = {
  async analyzePlant(req, res, next) {
    try {
      const { imageBase64, cropOrPlant, symptoms } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: { message: 'Image data is required. Please upload or take a clear plant photograph.' }
        });
      }

      const result = await plantDoctorService.analyzePlantPhoto({
        imageBase64,
        cropOrPlant,
        symptoms,
        userId: req.user?.id
      });

      if (result.status === 'CONFIGURATION_REQUIRED') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CONFIGURATION_REQUIRED',
            message: result.message,
            setupGuide: 'To activate live AI plant disease diagnosis, add your Google Gemini API key to backend/.env: GEMINI_API_KEY="your_api_key_here". Obtain a free key from Google AI Studio (https://aistudio.google.com/).'
          }
        });
      }

      if (result.status === 'AI_SERVICE_ERROR') {
        return res.status(502).json({
          success: false,
          error: {
            code: 'AI_SERVICE_ERROR',
            message: result.message,
            detail: result.errorDetail
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const history = await plantDoctorService.getDiagnosisHistory(req.user?.id);
      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteHistoryItem(req, res, next) {
    try {
      const { id } = req.params;
      const result = await plantDoctorService.deleteDiagnosisItem(id, req.user?.id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
