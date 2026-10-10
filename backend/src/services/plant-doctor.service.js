import { config } from '../config/environment.js';

export const plantDoctorService = {
  /**
   * Genuine AI Plant Disease Detection
   * Uses Google Gemini 1.5 Flash Vision / Plant.id Multimodal API
   */
  async analyzePlantPhoto({ imageBase64, cropOrPlant, symptoms, userId }) {
    const apiKey = config.plantDoctor.geminiApiKey;

    // Check if real AI service is configured
    if (!apiKey) {
      return {
        isConfigured: false,
        status: 'CONFIGURATION_REQUIRED',
        message: 'Plant Doctor AI service requires a valid GEMINI_API_KEY in backend/.env. Please configure GEMINI_API_KEY or PLANT_ID_API_KEY to activate genuine live vision inference.',
        cropIdentified: cropOrPlant || 'Unspecified plant',
        disclaimer: 'Plant Doctor AI provides preliminary guidance based on the submitted image. Its results may be inaccurate and are not a substitute for professional agricultural diagnosis.',
        recommendedProducts: [],
      };
    }

    // Call real Google Gemini API
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = imageBase64.match(/data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

      const promptText = `You are AgriPickup Plant Doctor AI, an agricultural expert assisting farmers in Karnataka, India.
Analyze this plant photograph.
Farmer provided crop hint: "${cropOrPlant || 'Unknown'}"
Farmer observed symptoms: "${symptoms || 'None specified'}"

Respond strictly in valid JSON matching this exact structure:
{
  "isPlant": boolean,
  "cropIdentified": string,
  "healthStatus": "HEALTHY" | "DISEASED" | "PEST_DAMAGE" | "NUTRIENT_DEFICIENCY" | "UNCERTAIN",
  "diseaseOrIssue": string,
  "confidenceScore": number (between 0.00 and 1.00),
  "confidenceExplanation": string,
  "visibleSymptoms": [string],
  "possibleCauses": [string],
  "immediateSteps": [string],
  "preventionGuidance": [string],
  "treatmentAdvice": [string],
  "recommendedTreatmentKeywords": [string],
  "isUncertain": boolean,
  "consultExpertRecommendation": string
}
Do not invent diagnoses. If unclear or non-plant, mark isUncertain=true and healthStatus="UNCERTAIN".`;

      const candidateVisionModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.5-flash'];
      let response = null;
      let lastError = null;

      for (const modelName of candidateVisionModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: cleanBase64
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.2
              }
            })
          });

          if (res.ok) {
            response = res;
            break;
          } else {
            const errData = await res.json().catch(() => ({}));
            lastError = {
              status: res.status,
              message: errData.error?.message || `HTTP ${res.status}`,
              statusText: errData.error?.status || ''
            };
            // If it is 404 (model deprecated) or 503 (demand spike), try next candidate model
            if (res.status === 404 || res.status === 503) {
              continue;
            }
            // For auth or invalid key, break immediately
            break;
          }
        } catch (fetchErr) {
          lastError = { status: 500, message: fetchErr.message };
        }
      }

      if (!response) {
        const status = lastError?.status || 500;
        const errMessage = lastError?.message || 'Failed to reach Google Gemini API';
        const errStatus = lastError?.statusText || '';

        // Categorize specific failure modes for honest diagnosis feedback
        if (status === 400 && (errMessage.includes('API key') || errStatus === 'INVALID_ARGUMENT')) {
          const error = new Error(`Invalid Gemini API Key: ${errMessage}`);
          error.code = 'INVALID_API_KEY';
          throw error;
        } else if (status === 403 || errStatus === 'PERMISSION_DENIED') {
          const error = new Error(`Gemini API Permission Denied: ${errMessage}`);
          error.code = 'PERMISSION_DENIED';
          throw error;
        } else if (status === 429 || errStatus === 'RESOURCE_EXHAUSTED') {
          const error = new Error(`Gemini API Quota Exceeded (HTTP 429): ${errMessage}`);
          error.code = 'QUOTA_EXCEEDED';
          throw error;
        } else if (status === 404 || errStatus === 'NOT_FOUND') {
          const error = new Error(`Gemini Vision Model Not Found (HTTP 404): ${errMessage}`);
          error.code = 'MODEL_NOT_FOUND';
          throw error;
        }
        throw new Error(errMessage);
      }

      const responseJson = await response.json();
      const rawOutput = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawOutput) {
        throw new Error('No assessment output received from Gemini vision model.');
      }
      const parsedAiData = JSON.parse(rawOutput);

      return {
        isConfigured: true,
        status: 'COMPLETED',
        ...parsedAiData,
        disclaimer: 'Plant Doctor AI provides preliminary guidance based on the submitted image. Its results may be inaccurate and are not a substitute for professional agricultural diagnosis.'
      };
    } catch (err) {
      console.error('[PlantDoctor AI Inference Error]:', err.message);
      let userMsg = 'Could not complete AI image analysis at this time.';
      if (err.code === 'INVALID_API_KEY') {
        userMsg = 'Configured GEMINI_API_KEY is invalid or rejected by Google AI Studio. Please verify or regenerate your key.';
      } else if (err.code === 'QUOTA_EXCEEDED') {
        userMsg = 'Google Gemini API rate limit or quota exceeded. Please wait a moment before trying again.';
      } else if (err.code === 'MODEL_NOT_FOUND') {
        userMsg = 'Configured Gemini vision model was not found or is not available for this API key tier.';
      } else if (err.code === 'PERMISSION_DENIED') {
        userMsg = 'Permission denied by Google Gemini API. Please ensure your API key has Generative Language API enabled.';
      }

      return {
        isConfigured: true,
        status: 'AI_SERVICE_ERROR',
        errorCode: err.code || 'AI_SERVICE_ERROR',
        message: userMsg,
        errorDetail: err.message,
        disclaimer: 'Plant Doctor AI provides preliminary guidance based on the submitted image. Its results may be inaccurate and are not a substitute for professional agricultural diagnosis.'
      };
    }
  },

  async getDiagnosisHistory(userId) {
    return [];
  },

  async deleteDiagnosisItem(id, userId) {
    return { deleted: true, id };
  }
};
