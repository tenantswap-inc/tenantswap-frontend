
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, User, Phone, Lock } from 'lucide-react';

interface RegisterProps {
  onRegister: (phoneNumber: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.length < 3) {
      alert("Please enter your full name.");
      return;
    }
    if (phone.length < 10) {
      alert("Please enter a valid Nigerian phone number.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match. Please try again.");
      return;
    }
    if (!agreeTerms) {
      alert("You must agree to the Terms of Service.");
      return;
    }

    onRegister(phone);
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create Account</h2>
          <p className="text-slate-500">Join the zero-agent-fee movement in Nigeria</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={18} />
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Adekunle Ciroma"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={18} />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080 0000 0000"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="terms" className="text-[10px] text-slate-500 leading-tight">
              I agree to TenantSwap's <span className="text-emerald-600 font-bold underline cursor-pointer">Terms</span> and <span className="text-emerald-600 font-bold underline cursor-pointer">Privacy Policy</span>.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            Create My Profile
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;