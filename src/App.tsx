import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DonationProvider } from './context/DonationContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DonorDashboard } from './components/DonorDashboard';
import { NgoDashboard } from './components/NgoDashboard';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DonationForm } from './components/DonationForm';
import { DonationTracking } from './components/DonationTracking';
import { LiveMapPage } from './components/LiveMapPage';
import { ImpactAnalytics } from './components/ImpactAnalytics';
import { RoleGuard } from './components/RoleGuard';
import { AuthModal } from './components/AuthModal';
import { FoodDonation } from './types';

function MainApp() {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedDonation, setSelectedDonation] = useState<FoodDonation | null>(null);

  const handleSelectDonation = (donation: FoodDonation) => {
    setSelectedDonation(donation);
    setCurrentTab('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDonate = () => {
    setCurrentTab('donate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigateToTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenDonate={handleOpenDonate}
          />
        )}

        {currentTab === 'donor' && (
          <RoleGuard allowedRoles={['donor']} onNavigateToOwnDashboard={() => setCurrentTab(currentUser?.role || 'donor')}>
            <DonorDashboard
              onOpenCreate={handleOpenDonate}
              onSelectDonation={handleSelectDonation}
            />
          </RoleGuard>
        )}

        {currentTab === 'ngo' && (
          <RoleGuard allowedRoles={['ngo']} onNavigateToOwnDashboard={() => setCurrentTab(currentUser?.role || 'ngo')}>
            <NgoDashboard
              onSelectDonation={handleSelectDonation}
            />
          </RoleGuard>
        )}

        {currentTab === 'volunteer' && (
          <RoleGuard allowedRoles={['volunteer']} onNavigateToOwnDashboard={() => setCurrentTab(currentUser?.role || 'volunteer')}>
            <VolunteerDashboard
              onSelectDonation={handleSelectDonation}
            />
          </RoleGuard>
        )}

        {currentTab === 'admin' && (
          <RoleGuard allowedRoles={['admin']} onNavigateToOwnDashboard={() => setCurrentTab(currentUser?.role || 'admin')}>
            <AdminDashboard
              onSelectDonation={handleSelectDonation}
            />
          </RoleGuard>
        )}

        {currentTab === 'donate' && (
          <RoleGuard allowedRoles={['donor', 'admin']} onNavigateToOwnDashboard={() => setCurrentTab(currentUser?.role || 'donor')}>
            <DonationForm
              onSuccess={() => {
                setCurrentTab('donor');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onCancel={() => {
                setCurrentTab(currentUser?.role || 'donor');
              }}
            />
          </RoleGuard>
        )}

        {currentTab === 'map' && (
          <LiveMapPage
            onSelectDonation={handleSelectDonation}
            onOpenDonate={handleOpenDonate}
          />
        )}

        {currentTab === 'analytics' && (
          <ImpactAnalytics />
        )}

        {currentTab === 'tracking' && selectedDonation && (
          <DonationTracking
            donation={selectedDonation}
            onBack={() => {
              setCurrentTab(currentUser?.role || 'landing');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="space-y-1.5">
              <div className="font-bold text-white text-base flex items-center gap-2">
                <span>🌱 FoodShare AI</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  Sustainable Surplus Redistribution
                </span>
              </div>
              <p className="text-slate-400 text-xs max-w-md">
                Connecting commercial kitchens, hotels, and grocers with frontline community shelters and volunteer couriers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
              <button onClick={() => setCurrentTab('landing')} className="hover:text-emerald-400 transition-colors">
                Platform Overview
              </button>
              <button onClick={() => setCurrentTab('donor')} className="hover:text-emerald-400 transition-colors">
                Donor Dashboard
              </button>
              <button onClick={() => setCurrentTab('ngo')} className="hover:text-emerald-400 transition-colors">
                NGO Relief Portal
              </button>
              <button onClick={() => setCurrentTab('volunteer')} className="hover:text-emerald-400 transition-colors">
                Volunteer Couriers
              </button>
              <button onClick={() => setCurrentTab('admin')} className="hover:text-emerald-400 transition-colors">
                Admin Console
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} FoodShare AI. Good Samaritan Food Donation Act compliant.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>All Food Donations Inspected by Certified Human Handlers</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DonationProvider>
        <MainApp />
      </DonationProvider>
    </AuthProvider>
  );
}
