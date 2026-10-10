import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: email.trim(),
      });

      setSubmitted(true);
      setMessage(
        response.data?.message ||
          'If an account exists for this email, password-reset instructions have been sent.'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Unable to process password reset request. Please check your network and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
            <p className="text-xs text-slate-500">Reset your AgriPickup account password</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Request Failed</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              <div className="flex items-center gap-2 mb-2 font-bold text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Instructions Dispatched</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">{message}</p>
              <p className="text-xs text-emerald-700 mt-3 pt-3 border-t border-emerald-200/60">
                Please check your inbox (and spam folder). The link will expire in 30 minutes for security.
              </p>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the email address associated with your AgriPickup customer or seller account. We'll send you a single-use secure link to choose a new password.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Registered Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 mt-4 disabled:bg-slate-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating secure link...
                </>
              ) : (
                'Send Password Reset Link'
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <Link
                to="/login"
                className="font-semibold text-slate-700 hover:text-emerald-600 inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
              <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Create new account
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
