import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  Building2,
  Utensils,
  Truck,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Scale,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalOpen,
    setAuthModalMode,
    loginWithEmailPassword,
    registerWithEmailPassword,
    signInWithGoogle,
  } = useAuth();

  const [role, setRole] = useState<UserRole>('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [capacityKg, setCapacityKg] = useState<number>(250);
  const [vehicleType, setVehicleType] = useState<'car' | 'van' | 'bicycle' | 'on_foot'>('van');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await loginWithEmailPassword(email, password);
      } else {
        await registerWithEmailPassword({
          email,
          password,
          displayName,
          role,
          organization,
          phone,
          address,
          capacityKg: role === 'ngo' ? Number(capacityKg) : undefined,
          vehicleType: role === 'volunteer' ? vehicleType : undefined,
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle(role);
    } catch (err: any) {
      setError(err.message || 'Google sign-in was interrupted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌱</span>
              <h3 className="font-black text-xl">
                {authModalMode === 'login' ? 'Sign In to FoodShare AI' : 'Create Account'}
              </h3>
            </div>
            <p className="text-emerald-100 text-xs">
              {authModalMode === 'login'
                ? 'Access your role-based food rescue portal'
                : 'Join the sustainable food rescue network'}
            </p>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => {
              setAuthModalMode('login');
              setError(null);
            }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
              authModalMode === 'login'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthModalMode('register');
              setError(null);
            }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
              authModalMode === 'register'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register (Choose Role)
          </button>
        </div>

        {/* Content & Form */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Google Login Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span>or with email & role</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalMode === 'register' && (
              <>
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Your Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('donor')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        role === 'donor'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Food Donor</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Kitchens & Grocers</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('ngo')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        role === 'ngo'
                          ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-300'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>NGO / Shelter</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Pantries & Soup Kitchens</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('volunteer')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        role === 'volunteer'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-300'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Volunteer Courier</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Transport & Delivery</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        role === 'admin'
                          ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-300'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>Administrator</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Operations & Compliance</div>
                    </button>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Chef Marco Silva"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization / Establishment Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={
                        role === 'donor'
                          ? 'e.g. Grand Hyatt Executive Catering'
                          : role === 'ngo'
                          ? 'e.g. City Hope Community Kitchen'
                          : 'e.g. Green Wheels Courier Fleet'
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Role Specific: Capacity or Vehicle */}
                {role === 'ngo' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daily Food Storage Capacity (kg)
                    </label>
                    <div className="relative">
                      <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        value={capacityKg}
                        onChange={(e) => setCapacityKg(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {role === 'volunteer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Courier Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="van">Cargo Van / SUV</option>
                      <option value="car">Sedan / Standard Car</option>
                      <option value="bicycle">Cargo Bicycle / e-Bike</option>
                      <option value="on_foot">On Foot / Cart (Urban Micro-rescue)</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Authenticating with Firebase...</span>
              ) : authModalMode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register as {role.toUpperCase()}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
          Protected by Firebase Authentication & Role-Based Firestore Rules
        </div>
      </div>
    </div>
  );
};
