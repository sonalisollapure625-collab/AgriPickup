import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserPlus, AlertCircle, Loader2, LogIn, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsDuplicateEmail(false);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (role === 'SELLER') {
      if (!businessName.trim() || !ownerName.trim() || !phone.trim()) {
        setError('Seller registration requires nursery/business name, owner name, and phone number.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role,
        ...(role === 'SELLER' && {
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
        }),
      };

      await register(payload);
      if (role === 'SELLER') {
        navigate('/seller/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      const isConflict = err.response?.status === 409 || err.response?.data?.code === 'EMAIL_ALREADY_REGISTERED';
      if (isConflict) {
        setIsDuplicateEmail(true);
        setError('This email is already registered. Please log in.');
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Registration failed. Please check your details.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
            <p className="text-xs text-slate-500">Join AgriPickup agricultural marketplace</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-950">Registration Notice</p>
              <p className="text-xs mt-0.5">{error}</p>
              {isDuplicateEmail && (
                <div className="mt-2 pt-2 border-t border-amber-200/60">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Go to Login Page
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              I want to register as
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  role === 'CUSTOMER'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Farmer / Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('SELLER')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  role === 'SELLER'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Nursery Seller
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number {role === 'SELLER' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              required={role === 'SELLER'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9845012345"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {role === 'SELLER' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Nursery / Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Green Flora Eco Nursery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Proprietor / Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Owner full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password (Min 8 characters) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 mt-4 disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Complete Sign Up'
            )}
          </button>

          {/* Clearly Visible Login Option Directly Below Submit Button */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-700 font-medium">
              Already have an account?{' '}
              <Link
                to="/login"
                id="already-have-account-login-link"
                className="font-bold text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-2 transition-colors ml-1"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Need help accessing an existing account?</span>
          <Link to="/forgot-password" className="font-semibold text-emerald-700 hover:underline">
            Forgot Password
          </Link>
        </div>
      </div>
    </div>
  );
}
