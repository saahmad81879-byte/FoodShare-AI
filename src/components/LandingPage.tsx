import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Utensils,
  Building2,
  Truck,
  HeartHandshake,
  ArrowRight,
  Leaf,
  CheckCircle2,
  Layers,
  MapPin,
  TrendingUp,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { UserRole } from '../types';

interface LandingPageProps {
  onNavigateToTab: (tab: string) => void;
  onOpenDonate: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToTab,
  onOpenDonate,
}) => {
  const { switchDemoRole } = useAuth();
  const { donations } = useDonations();

  // Impact calculator state
  const [calculatorKg, setCalculatorKg] = useState<number>(50);

  const totalKg = donations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);
  const totalMeals = donations.reduce((sum, d) => sum + (d.estimatedServings || Math.round(d.quantityKg * 2.2)), 0);

  const calcMeals = Math.round(calculatorKg * 2.2);
  const calcCo2 = Math.round(calculatorKg * 2.5);
  const calcWater = Math.round(calculatorKg * 290);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section with 3D-Inspired Sustainability Card */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Next-Gen Sustainable Food Redistribution Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Rescue Surplus Food.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  Zero Landfill Waste.
                </span>{' '}
                Feed Communities.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                FoodShare AI bridges the gap between commercial kitchens, banquet halls, and grocers with frontline food banks and community shelters. Powered by Gemini AI for priority routing and strict human food safety verification.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={onOpenDonate}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Donate Surplus Food</span>
                </button>

                <button
                  onClick={() => onNavigateToTab('ngo')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Claim as Verified NGO</span>
                </button>

                <button
                  onClick={() => onNavigateToTab('map')}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Live Rescue Map</span>
                </button>
              </div>

              {/* Live Counter Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span><strong>{totalKg.toLocaleString()} kg</strong> Surplus Diverted</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                  <span><strong>{totalMeals.toLocaleString()}</strong> Nourishing Meals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span><strong>100%</strong> Human Safety Inspected</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D-Inspired Visual Sustainability Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Decorative background glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-30 transform -rotate-1"></div>

                <div className="relative bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-7 shadow-2xl space-y-6">
                  {/* Visual Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        🌱
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          Live Rescue Dispatch
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Active Dispatch Pipeline
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Zero Waste AI
                    </span>
                  </div>

                  {/* Simulated Visual Mini Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Awadhi Dum Biryani & Pulao</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        45 kg
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      From: Hotel Royal Heritage → To: Hope Foundation, Lucknow
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Courier Transit Progress</span>
                        <span className="font-bold text-emerald-700">82%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[82%]"></div>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-emerald-800">
                        ✨ Priority Score: 94/100
                      </span>
                      <span>Safe window: &lt; 2 hrs</span>
                    </div>
                  </div>

                  {/* AI Feature Callouts */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </span>
                      <div className="text-slate-700 font-medium">
                        <strong>Gemini Priority Engine:</strong> Assesses hot/cold decay windows.
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </span>
                      <div className="text-slate-700 font-medium">
                        <strong>NGO Proximity Matching:</strong> Matches exact capacity without duplicate claims.
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </span>
                      <div className="text-slate-700 font-medium">
                        <strong>Human Verification Lock:</strong> AI never certifies safety; humans must sign off.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Role Switcher Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Engineered for Four Connected Stakeholders
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Click any role card to immediately test its purpose-built dashboard with sample credentials:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Role 1: Donor */}
          <div
            onClick={() => {
              switchDemoRole('donor');
              onNavigateToTab('donor');
            }}
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                1. Food Donors
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Restaurants, hotels, caterers & supermarkets list excess inventory with AI auto-fill and receive verified ESG diversion metrics.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Launch Donor View</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Role 2: NGO */}
          <div
            onClick={() => {
              switchDemoRole('ngo');
              onNavigateToTab('ngo');
            }}
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-teal-400 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                2. NGOs & Shelters
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Food banks, soup kitchens and charity shelters view real-time surplus. Single-claim locking guarantees no double-allocation.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
              <span>Launch NGO View</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Role 3: Volunteer */}
          <div
            onClick={() => {
              switchDemoRole('volunteer');
              onNavigateToTab('volunteer');
            }}
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                3. Volunteer Couriers
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Community drivers and bicycle couriers accept assigned pickups on the live GPS map and execute temperature-safe handovers.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Launch Courier View</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Role 4: Admin */}
          <div
            onClick={() => {
              switchDemoRole('admin');
              onNavigateToTab('admin');
            }}
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-700 transition-colors">
                4. Administrator
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Platform governance console to verify NGOs, audit food safety checklists, resolve disputes, and monitor city-wide metrics.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Launch Admin Console</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Food Rescue Impact Simulator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-8 sm:p-10 text-white shadow-2xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Environmental Calculator
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Calculate Your Organization's Food Rescue Impact
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200">
              Slide to see how surplus food diverted from landfills translates directly into meals and carbon offsets.
            </p>
          </div>

          {/* Slider */}
          <div className="max-w-xl mx-auto space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-emerald-200">Estimated Surplus Food:</span>
              <span className="text-2xl font-black text-emerald-300">{calculatorKg} kg</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={calculatorKg}
              onChange={(e) => setCalculatorKg(Number(e.target.value))}
              className="w-full h-3 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] text-emerald-400/80 font-medium">
              <span>10 kg (Small Cafe)</span>
              <span>250 kg (Hotel Buffet)</span>
              <span>500 kg (Convention Center)</span>
            </div>
          </div>

          {/* Equivalents Output */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center space-y-1">
              <div className="text-xs font-semibold text-emerald-300">Nourishing Meals</div>
              <div className="text-3xl font-black text-white">{calcMeals}</div>
              <div className="text-[11px] text-emerald-200">Balanced family portions</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center space-y-1">
              <div className="text-xs font-semibold text-emerald-300">Avoided CO₂e</div>
              <div className="text-3xl font-black text-white">{calcCo2} kg</div>
              <div className="text-[11px] text-emerald-200">Fugitive methane prevented</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center space-y-1">
              <div className="text-xs font-semibold text-emerald-300">Water Conserved</div>
              <div className="text-3xl font-black text-white">{calcWater.toLocaleString()} L</div>
              <div className="text-[11px] text-emerald-200">Agricultural footprint saved</div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onOpenDonate}
              className="px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
            >
              <span>Post This Amount for Rescue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Strict Food Safety Constitution */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-950">
                Food Safety Guarantee & AI Legal Boundary
              </h3>
              <p className="text-xs text-amber-800">
                FoodShare AI policy strictly mandates human physical verification before any distribution occurs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-amber-900">
            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 space-y-1">
              <strong>1. AI Never Certifies Safety</strong>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Machine learning models evaluate logistics, routing, and urgency but never substitute for sensory human inspection.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 space-y-1">
              <strong>2. Mandatory Temperature Logs</strong>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Donors and couriers certify continuous cold-chain (&lt;4°C) or hot-holding (&gt;60°C) parameters at handoff.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 space-y-1">
              <strong>3. Certified Handover Sign-off</strong>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Receiving NGOs verify seal integrity and packaging labels before serving meals to recipients.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
