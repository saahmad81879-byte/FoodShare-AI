import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  Layers,
  HeartHandshake,
  Truck,
  Building2,
  PlusCircle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const {
    currentUser,
    firebaseUser,
    isDemoUser,
    signInWithGoogle,
    signOut,
    switchDemoRole,
    openAuthModal,
  } = useAuth();

  const roles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'donor', label: 'Food Donor', icon: HeartHandshake, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { role: 'ngo', label: 'NGO / Charity', icon: Building2, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { role: 'volunteer', label: 'Volunteer', icon: Truck, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { role: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      {/* Top Demo Helper Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-xs py-1.5 px-4 font-medium flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span>Live Demo Sandbox • Switch Persona to Test Permissions:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {roles.map((r) => {
            const Icon = r.icon;
            const isCurrent = currentUser?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => {
                  switchDemoRole(r.role);
                  // navigate to appropriate dashboard
                  if (r.role === 'donor') onSelectTab('donor');
                  else if (r.role === 'ngo') onSelectTab('ngo');
                  else if (r.role === 'volunteer') onSelectTab('volunteer');
                  else if (r.role === 'admin') onSelectTab('admin');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isCurrent
                    ? 'bg-white text-emerald-900 shadow-xs ring-2 ring-emerald-300'
                    : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100'
                }`}
                title={`Switch active test view to ${r.label}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectTab('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
                FoodShare <span className="text-emerald-600">AI</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
                  v2.5
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sustainable Surplus Redistribution
              </div>
            </div>
          </button>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('landing')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'landing'
                  ? 'text-emerald-700 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                if (currentUser?.role === 'donor') onSelectTab('donor');
                else if (currentUser?.role === 'ngo') onSelectTab('ngo');
                else if (currentUser?.role === 'volunteer') onSelectTab('volunteer');
                else onSelectTab('admin');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                ['donor', 'ngo', 'volunteer', 'admin'].includes(currentTab)
                  ? 'text-emerald-700 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              My Dashboard
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'map'
                  ? 'text-emerald-700 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'analytics'
                  ? 'text-emerald-700 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Impact Reports
            </button>
          </nav>
        </div>

        {/* Right CTA / Auth controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('donate')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/30 transition-all hover:shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Donate Food</span>
          </button>

          {/* User Profile or Google Sign In */}
          {firebaseUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                {firebaseUser.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  firebaseUser.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800 leading-tight">
                  {firebaseUser.displayName || 'Authenticated User'}
                </div>
                <div className="text-slate-500 capitalize">{currentUser?.role}</div>
              </div>
              <button
                onClick={signOut}
                title="Sign out of Firebase"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-700">{currentUser?.displayName}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {currentUser?.role}
                </span>
              </div>
              <button
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors"
                title="Sign in or register with email and select role"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sign In / Register</span>
              </button>
              <button
                onClick={() => signInWithGoogle()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors"
                title="Fast 1-click Google sign in"
              >
                <span>Google</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          <button
            onClick={() => {
              onSelectTab('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Platform Overview
          </button>
          <button
            onClick={() => {
              onSelectTab('donor');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-between"
          >
            <span>Donor Dashboard</span>
            <span className="text-xs text-emerald-600 font-semibold">Post Surplus</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('ngo');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-between"
          >
            <span>NGO Dashboard</span>
            <span className="text-xs text-teal-600 font-semibold">Claim Food</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('volunteer');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-between"
          >
            <span>Volunteer Courier Dashboard</span>
            <span className="text-xs text-blue-600 font-semibold">Deliveries</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('admin');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Admin Management
          </button>
          <button
            onClick={() => {
              onSelectTab('map');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Interactive Rescue Map
          </button>
          <button
            onClick={() => {
              onSelectTab('analytics');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Impact & Sustainability
          </button>
          <div className="pt-2">
            <button
              onClick={() => {
                onSelectTab('donate');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              + Create Food Donation
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
