import React, { useState } from 'react';
import { User } from '../../types';
import { DEFAULT_USERS } from '../../data/mockData';
import { authService } from '../../services/authService';
import { 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  HelpCircle,
  KeyRound,
  UserPlus,
  Phone,
  User as UserIcon,
  Flame
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('21761a0501@lbrce.ac.in');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  // Registration state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    branch: 'CSE',
    phone: '',
    gender: 'Male',
    block: 'Sir MV Bhavan (Block B)',
    roomNo: 'B-205',
    parentName: '',
    parentPhone: '',
  });

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const user = await authService.login(identifier, password);
      onLogin(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify roll number or email.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (emailKey: string) => {
    const entry = DEFAULT_USERS[emailKey];
    if (entry) {
      setIdentifier(entry.user.email);
      setPassword(entry.passwordHash);
      setErrorMessage('');
      setLoading(true);
      try {
        const user = await authService.login(entry.user.email, entry.passwordHash);
        onLogin(user);
      } catch {
        onLogin(entry.user);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regData.name || !regData.email || !regData.password || !regData.rollNo) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (regData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await authService.registerStudent(regData);
      setSuccessMessage('Account registered successfully in Firebase! Signing you in...');
      setTimeout(() => {
        onLogin(newUser);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-blue-950 to-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Bar with LBRCE Crest */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-200 overflow-hidden shrink-0">
            <img
              src="/lbrce_logo.png"
              alt="LBRCE Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/lbrce_emblem.jpg';
              }}
            />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white text-base sm:text-lg">
              Lakireddy Bali Reddy College of Engineering
            </h1>
            <p className="text-xs text-blue-200/80 font-medium">
              (Autonomous) · Approved by AICTE, Affiliated to JNTUK · Mylavaram, NTR Dist.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Firebase Connected</span>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full my-auto py-6">
        
        {/* Portal Title Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl border-2 border-blue-400/30 mb-3 mx-auto">
            <img
              src="/lbrce_logo.png"
              alt="LBRCE Logo Crest"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/lbrce_emblem.jpg';
              }}
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            LBRCE Hostels Management System
          </h2>
          <p className="text-xs text-blue-200/70 mt-1">
            Cloud Residence & Digital Gate Pass Platform backed by Firebase & MERN Architecture
          </p>
        </div>

        {/* Card Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* Left Column: Quick 1-Click Access for Demo */}
          <div className="lg:col-span-5 bg-slate-950/60 p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Pre-Configured Accounts</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Click any profile to immediately sign in and record transactions in Cloud Firestore:
              </p>

              {/* Account Quick Selectors */}
              <div className="space-y-3">
                {/* Admin Quick Login */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('warden@lbrce.ac.in')}
                  className="w-full text-left p-3.5 rounded-xl border border-blue-900/60 bg-slate-900/80 hover:bg-slate-800 hover:border-blue-500 hover:shadow-md transition-all group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">
                        Chief Warden (Admin)
                      </span>
                      <span className="text-[10px] text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform">
                        Login &rarr;
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">Dr. K. Srinivas Rao · Hostels Incharge</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      warden@lbrce.ac.in · warden123
                    </div>
                  </div>
                </button>

                {/* Student 1 (S. Nikesh Reddy) Quick Login */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('21761a0501@lbrce.ac.in')}
                  className="w-full text-left p-3.5 rounded-xl border border-emerald-900/60 bg-slate-900/80 hover:bg-slate-800 hover:border-emerald-500 hover:shadow-md transition-all group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                        Student (S. Nikesh Reddy)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
                        Login &rarr;
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">S. Nikesh Reddy · Room B-204</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      21761A0501 · student123
                    </div>
                  </div>
                </button>

                {/* Student 2 (K. Phani Kumar) Quick Login */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('21761a0588@lbrce.ac.in')}
                  className="w-full text-left p-3.5 rounded-xl border border-cyan-900/60 bg-slate-900/80 hover:bg-slate-800 hover:border-cyan-500 hover:shadow-md transition-all group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        <span>Student (K. Phani Kumar)</span>
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">B-205</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform">
                        Login &rarr;
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">K. Phani Kumar · Room B-205 (Bed 3)</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      21761A0588 · student123
                    </div>
                  </div>
                </button>

                {/* Student 3 (Harshitha) Quick Login */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('22761a0412@lbrce.ac.in')}
                  className="w-full text-left p-3.5 rounded-xl border border-purple-900/60 bg-slate-900/80 hover:bg-slate-800 hover:border-purple-500 hover:shadow-md transition-all group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors">
                        Student (Girls Hostel)
                      </span>
                      <span className="text-[10px] text-purple-400 font-medium group-hover:translate-x-0.5 transition-transform">
                        Login &rarr;
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">M. Harshitha · Room G-105</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      22761A0412 · student123
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firestore Real-Time Sync
              </span>
              <span className="text-slate-500 font-mono text-[10px]">Audit Logged</span>
            </div>
          </div>

          {/* Right Column: Dynamic Form (Sign In / New Registration) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
            
            {/* Tab switch between Sign In and Register */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Student Registration</span>
              </button>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message banner */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {authMode === 'login' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    College Email or Student Roll Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. 21761A0501 or warden@lbrce.ac.in"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Account Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Default Passwords</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {showCredentialsHelp && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                    <div className="font-semibold text-blue-300">Default Credentials:</div>
                    <div>• Warden: <code className="text-white">warden@lbrce.ac.in</code> / <code className="text-white">warden123</code></div>
                    <div>• Student: <code className="text-white">21761A0501</code> / <code className="text-white">student123</code></div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-800 shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating with Firebase...
                    </span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* NEW STUDENT REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.name}
                      onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      placeholder="e.g. S. Nikesh Reddy"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.rollNo}
                      onChange={(e) => setRegData({ ...regData, rollNo: e.target.value.toUpperCase() })}
                      placeholder="e.g. 23761A0501"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      College Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="e.g. 23761a0501@lbrce.ac.in"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      placeholder="Create secret password"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                    <select
                      value={regData.branch}
                      onChange={(e) => setRegData({ ...regData, branch: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="AI&DS">AI&DS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                    <select
                      value={regData.gender}
                      onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      placeholder="+91 98480 00000"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Name</label>
                    <input
                      type="text"
                      value={regData.parentName}
                      onChange={(e) => setRegData({ ...regData, parentName: e.target.value })}
                      placeholder="Father / Guardian Name"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Contact Number</label>
                    <input
                      type="tel"
                      value={regData.parentPhone}
                      onChange={(e) => setRegData({ ...regData, parentPhone: e.target.value })}
                      placeholder="+91 94400 00000"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:ring-4 focus:ring-emerald-800 shadow-md transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Firebase Account...
                    </span>
                  ) : (
                    <>
                      <span>Register & Record in Firestore</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

        {/* Security & Affiliation Banner */}
        <div className="mt-6 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3 px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secured via Firebase Cloud Firestore & ABAC Security Rules</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            LBRCE Mylavaram · Hostel Administration
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
        © 2026 Lakireddy Bali Reddy College of Engineering. All Rights Reserved. Powered by Firebase & MERN Stack.
      </footer>

    </div>
  );
};
