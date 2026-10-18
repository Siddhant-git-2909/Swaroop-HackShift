import React, { useState } from 'react';
import { X, User, Phone, Briefcase, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType, WorkerProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType, profile?: WorkerProfile | null) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<'worker' | 'contractor' | 'customer'>('worker');

  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedDemoOtp, setSimulatedDemoOtp] = useState<string | null>(null);

  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate name
    if (!signupName.trim() || signupName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    // Normalize phone
    const cleanPhone = signupPhone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.signup(signupName.trim(), cleanPhone, signupRole);
      setSuccessMsg(`Welcome, ${res.user.name}! Account created as ${res.user.role.toUpperCase()}.`);
      setTimeout(() => {
        onLoginSuccess(res.user, res.worker_profile);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPhone = loginPhone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestOtp(cleanPhone);
      setOtpSent(true);
      setSimulatedDemoOtp(res.demo_otp || '123456');
      setOtpCode(res.demo_otp || '123456'); // Pre-fill for seamless hackathon evaluator testing
      setSuccessMsg('DEMO OTP generated! Use 123456 to verify (SMS delivery simulated for HackShift MVP).');
    } catch (err: any) {
      setError(err.message || 'Account not found. Please sign up first.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = loginPhone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit DEMO OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(cleanPhone, otpCode.trim());
      setSuccessMsg(`Login successful! Redirecting to your ${res.user.role.toUpperCase()} dashboard...`);
      setTimeout(() => {
        onLoginSuccess(res.user, res.worker_profile);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please enter DEMO OTP 123456.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-fadeIn">
      <div className="w-full max-w-md bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Tab switch: Login vs Signup */}
        <div className="flex border-2 border-black rounded-md overflow-hidden mb-6 shadow-hard-sm">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-black transition-colors ${
              mode === 'login' ? 'bg-[#facc15] text-black border-r-2 border-black' : 'bg-[#faf7f2] text-neutral-600 hover:bg-white'
            }`}
          >
            Log In (Demo OTP)
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-black transition-colors ${
              mode === 'signup' ? 'bg-[#facc15] text-black border-l-2 border-black' : 'bg-[#faf7f2] text-neutral-600 hover:bg-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Header */}
        <div className="mb-4">
          <h2 className="font-display text-xl font-black text-black">
            {mode === 'signup' ? 'Join SWAROOP Platform' : 'Sign In with Phone OTP'}
          </h2>
          <p className="text-xs text-neutral-600 font-medium mt-1">
            {mode === 'signup' 
              ? 'Create a verified skill identity in MongoDB Atlas.' 
              : 'Enter your registered mobile number to receive DEMO OTP.'}
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-600 rounded-md text-red-900 text-xs font-bold flex items-start gap-2 shadow-hard-sm">
            <AlertCircle className="w-4 h-4 text-red-600 stroke-[2.5] flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-600 rounded-md text-green-900 text-xs font-bold flex items-start gap-2 shadow-hard-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600 stroke-[2.5] flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black mb-1">
                Full Name (पूरा नाम)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500 stroke-[2.5]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar or Priya Sharma"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#faf7f2] border-2 border-black rounded-md text-xs font-bold text-black focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1">
                Indian Mobile Number (मोबाइल नंबर)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500 stroke-[2.5]" />
                <input
                  type="tel"
                  required
                  placeholder="10-digit number e.g. 9876543210"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#faf7f2] border-2 border-black rounded-md text-xs font-bold text-black focus:bg-white focus:outline-none shadow-hard-sm font-mono"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Must be an active Indian mobile number (e.g. starting with 6-9).</p>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1">
                Select Your Role (आपकी भूमिका)
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500 stroke-[2.5]" />
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 bg-[#faf7f2] border-2 border-black rounded-md text-xs font-black text-black focus:bg-white focus:outline-none shadow-hard-sm"
                >
                  <option value="worker">Skilled Worker (कारीगर / कामगार) — Build Skill Passport</option>
                  <option value="contractor">Contractor (ठेकेदार) — Hire & Manage Squads</option>
                  <option value="customer">Customer (ग्राहक) — Find Verified Trade Workers</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brutal-primary py-2.5 text-xs font-black flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Registering in Atlas...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500 stroke-[2.5]" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9000000001 (or your phone)"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#faf7f2] border-2 border-black rounded-md text-xs font-bold text-black focus:bg-white focus:outline-none shadow-hard-sm font-mono"
                    />
                  </div>
                  <div className="mt-2 p-2.5 bg-[#fef08a] border-2 border-black rounded text-[11px] font-bold text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                    💡 Quick Demo Numbers: Worker: <code className="font-mono">9000000001</code> • Customer: <code className="font-mono">9100000001</code> • Contractor: <code className="font-mono">9400000001</code>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-brutal-primary py-2.5 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Checking Account...' : 'Get DEMO OTP'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-black">
                      Enter 6-Digit DEMO OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      className="text-[11px] font-bold text-neutral-700 underline hover:text-black"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500 stroke-[2.5]" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#faf7f2] border-2 border-black rounded-md text-sm font-black text-black focus:bg-white focus:outline-none shadow-hard-sm tracking-widest font-mono"
                    />
                  </div>
                  <div className="mt-2 p-2 bg-[#e0f2fe] border-2 border-black rounded text-[11px] font-bold text-neutral-800 shadow-[1px_1px_0px_0px_#000]">
                    <span>🔑 DEMO OTP: </span>
                    <span className="font-mono font-black text-blue-900">{simulatedDemoOtp || '123456'}</span>
                    <span className="block text-[10px] text-neutral-600 mt-0.5">Real SMS delivery is simulated for HackShift MVP.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-brutal-primary py-2.5 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying OTP...' : 'Verify & Log In'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t-2 border-black text-center text-[10px] font-semibold text-neutral-600">
          Account data persists safely in MongoDB Atlas cluster.
        </div>
      </div>
    </div>
  );
};
