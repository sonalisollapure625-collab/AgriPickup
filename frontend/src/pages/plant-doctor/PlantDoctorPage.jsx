import React, { useState } from 'react';
import { Stethoscope, Upload, Camera, AlertCircle, CheckCircle2, RefreshCw, ShoppingCart, Info, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function PlantDoctorPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropOrPlant, setCropOrPlant] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image file is too large. Please upload an image under 8MB.');
      return;
    }

    setError('');
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!previewUrl) {
      setError('Please upload or take a plant photograph first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/plant-doctor/analyze', {
        imageBase64: previewUrl,
        cropOrPlant,
        symptoms,
      });

      if (response.data.success && response.data.data?.status === 'COMPLETED') {
        setResult(response.data.data);
      } else {
        const errMsg = response.data.error?.message || response.data.data?.message || 'Analysis could not be completed.';
        setError(errMsg);
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      const errMsg = errData?.message || 'Unable to reach backend AI service. Please ensure the AgriPickup backend server is running.';
      const detail = errData?.detail ? `\n\nDetails: ${errData.detail}` : '';
      const setupGuide = errData?.setupGuide ? `\n\n${errData.setupGuide}` : '';
      setError(`${errMsg}${detail}${setupGuide}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Title & Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
          Plant Doctor AI Diagnostic Engine
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          AgriPickup Plant Doctor AI
        </h1>
        <p className="mt-2 text-slate-600 text-sm max-w-xl mx-auto">
          Upload clear photographs of your crops, saplings, or garden plants to detect diseases, nutrient deficiencies, and get verified remedy guidance.
        </p>
      </div>

      {/* Main Workflow Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Photo Upload / Camera Preview */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-800">
              1. Upload Plant Photo <span className="text-emerald-600">*</span>
            </label>

            {!previewUrl ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/30 group min-h-[220px]">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700 text-center">
                  Click to upload from gallery or computer
                </span>
                <span className="text-xs text-slate-400 mt-1">JPEG, PNG, or WebP up to 8MB</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group bg-slate-900 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Plant preview"
                  className="w-full max-h-72 object-contain"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-3 right-3 px-3 py-1 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold rounded-lg backdrop-blur transition-colors"
                >
                  Change / Remove Photo
                </button>
              </div>
            )}
          </div>

          {/* 2. Optional Crop details */}
          <div className="space-y-4">
            <div>
              <label htmlFor="cropInput" className="block text-sm font-semibold text-slate-800 mb-1">
                2. Select Crop or Plant (Optional)
              </label>
              <input
                id="cropInput"
                type="text"
                placeholder="e.g. Tomato, Mango, Rose, Arecanut, Paddy"
                value={cropOrPlant}
                onChange={(e) => setCropOrPlant(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="symptomsInput" className="block text-sm font-semibold text-slate-800 mb-1">
                3. Visible Symptoms (Optional)
              </label>
              <textarea
                id="symptomsInput"
                rows={4}
                placeholder="Describe visible problems, e.g. yellow leaves with black dots, wilting edges, white powdery spots..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* Analyze Action */}
            <button
              type="button"
              disabled={loading || !previewUrl}
              onClick={handleAnalyze}
              className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                loading || !previewUrl
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing with Plant Doctor AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyse Plant
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-950">AI Service Notice</p>
              <p className="mt-1 text-xs text-amber-900 whitespace-pre-line leading-relaxed">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* 4 & 5. Diagnosis Results & Guidance */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Preliminary Assessment</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {result.diseaseOrIssue || 'Analysis Completed'}
                </h2>
              </div>
              {result.confidenceScore && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Confidence Score</span>
                  <span className="text-lg font-black text-emerald-700">
                    {Math.round(result.confidenceScore * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Status notification if AI key requires configuration */}
            {result.status === 'CONFIGURATION_REQUIRED' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm mb-6">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-700" />
                  Real Vision Service Configuration Required
                </p>
                <p className="mt-1 text-amber-800">
                  {result.message}
                </p>
              </div>
            )}

            {/* Guidance Sections */}
            {result.immediateSteps && result.immediateSteps.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-2">Immediate Steps:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                  {result.immediateSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.treatmentAdvice && result.treatmentAdvice.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-2">Treatment Guidance:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                  {result.treatmentAdvice.map((treatment, idx) => (
                    <li key={idx}>{treatment}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. Product Match Fallback (Exact requirement message) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Recommended Products from Verified Sellers:</h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm">
                No matching product is currently available from our verified sellers.
              </div>
            </div>

            {/* Official Disclaimer */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 italic">
              "{result.disclaimer || 'Plant Doctor AI provides preliminary guidance based on the submitted image. Its results may be inaccurate and are not a substitute for professional agricultural diagnosis.'}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
