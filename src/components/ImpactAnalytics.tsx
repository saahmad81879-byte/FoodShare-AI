import React, { useState } from 'react';
import {
  Leaf,
  Droplets,
  Car,
  Utensils,
  Award,
  Sparkles,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useDonations } from '../context/DonationContext';
import { AiImpactReportModal } from './AiImpactReportModal';

export const ImpactAnalytics: React.FC = () => {
  const { donations, impactLogs } = useDonations();
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const totalKg = donations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);
  const totalMeals = donations.reduce((sum, d) => sum + (d.estimatedServings || Math.round(d.quantityKg * 2.2)), 0);
  const totalCo2 = Math.round(totalKg * 2.5);
  const totalWater = Math.round(totalKg * 290);
  const totalMiles = Math.round(totalCo2 * 2.48);

  const categories = [
    { key: 'prepared_meals', label: 'Prepared Meals & Catering', color: 'bg-emerald-500' },
    { key: 'bakery', label: 'Bakery & Grains', color: 'bg-amber-500' },
    { key: 'produce', label: 'Fresh Produce & Fruits', color: 'bg-green-500' },
    { key: 'dairy', label: 'Dairy & Milk', color: 'bg-blue-500' },
    { key: 'canned_goods', label: 'Canned Goods & Pantry', color: 'bg-indigo-500' },
  ];

  const categoryTotals = categories.map((cat) => {
    const weight = donations
      .filter((d) => d.category === cat.key)
      .reduce((sum, d) => sum + d.quantityKg, 0);
    const pct = totalKg > 0 ? Math.round((weight / totalKg) * 100) : 0;
    return { ...cat, weight, pct };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <TrendingUp className="w-4 h-4" />
            <span>Environmental Ledger & Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            FoodShare AI Impact Analytics
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time environmental calculation based on landfill methane diversion and agricultural conservation standards.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-5 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Generate Gemini Impact Report</span>
        </button>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Rescued Food
          </div>
          <div className="text-3xl font-black text-slate-900">
            {totalKg.toLocaleString()} <span className="text-sm font-semibold text-emerald-600">kg</span>
          </div>
          <div className="text-xs text-slate-500">
            Equates to <strong>{totalMeals.toLocaleString()}</strong> nourishing meal portions
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            CO₂e Landfill Avoidance
          </div>
          <div className="text-3xl font-black text-slate-900">
            {totalCo2.toLocaleString()} <span className="text-sm font-semibold text-emerald-600">kg</span>
          </div>
          <div className="text-xs text-slate-500">
            Diverted organic waste from decomposing in landfills
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-3xl border border-cyan-100 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Agricultural Water Saved
          </div>
          <div className="text-3xl font-black text-slate-900">
            {totalWater.toLocaleString()} <span className="text-sm font-semibold text-cyan-600">liters</span>
          </div>
          <div className="text-xs text-slate-500">
            Conserving embedded agricultural irrigation water
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Car Passenger Miles Offset
          </div>
          <div className="text-3xl font-black text-slate-900">
            {totalMiles.toLocaleString()} <span className="text-sm font-semibold text-amber-600">miles</span>
          </div>
          <div className="text-xs text-slate-500">
            Equivalent emissions from burning fossil gasoline
          </div>
        </div>
      </div>

      {/* Category Breakdown & Equivalencies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Surplus Redistribution by Food Category
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Volume split across municipal donors and food pantries
            </p>
          </div>

          <div className="space-y-4">
            {categoryTotals.map((cat) => (
              <div key={cat.key} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat.label}</span>
                  <span className="font-bold text-slate-900">
                    {cat.weight} kg ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                    style={{ width: `${Math.max(cat.pct, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equivalency Visuals */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Tangible Environmental Equivalents
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Translating food waste mitigation into tangible planet benefits
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center space-y-1">
              <span className="text-3xl">🌳</span>
              <div className="text-xl font-black text-emerald-900">
                {Math.round(totalCo2 / 21)}
              </div>
              <div className="text-[11px] font-medium text-emerald-800">
                Urban tree seedlings grown for 10 years
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-100 text-center space-y-1">
              <span className="text-3xl">🛁</span>
              <div className="text-xl font-black text-cyan-900">
                {Math.round(totalWater / 150).toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-cyan-800">
                Full home bathtubs of clean fresh water conserved
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center space-y-1">
              <span className="text-3xl">📱</span>
              <div className="text-xl font-black text-amber-900">
                {(totalCo2 * 122).toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-amber-800">
                Smartphones charged with saved kilowatt-hours
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-center space-y-1">
              <span className="text-3xl">🥗</span>
              <div className="text-xl font-black text-purple-900">
                {totalMeals.toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-purple-800">
                Dignified, balanced meal portions served to neighbors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Rescues Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Verified Food Rescue Ledger ({impactLogs.length} Completed Missions)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable log of food transferred from donors to NGOs with volunteer verification
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {impactLogs.map((log) => (
            <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ✓ Verified Delivery
                  </span>
                  <span className="text-slate-400 font-mono">Log ID: {log.id}</span>
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {log.kgRescued} kg Rescued • ~{log.mealsProvided} Meals Provided
                </div>
                <div className="text-slate-500">
                  Completed on {new Date(log.completedAt).toLocaleDateString()} at{' '}
                  {new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="flex items-center gap-4 text-right self-end sm:self-auto">
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">CO₂ Avoided</span>
                  <span className="font-bold text-emerald-700">{log.co2AvoidedKg} kg</span>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Water Saved</span>
                  <span className="font-bold text-cyan-700">{log.waterSavedLiters.toLocaleString()} L</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showReportModal && (
        <AiImpactReportModal
          donations={donations}
          impactLogs={impactLogs}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
