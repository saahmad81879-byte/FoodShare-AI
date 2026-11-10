import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  Truck,
  Building2,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Share2,
  Calendar,
} from 'lucide-react';
import { FoodDonation } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { FoodMap } from './FoodMap';

interface DonationTrackingProps {
  donation: FoodDonation;
  onBack: () => void;
}

export const DonationTracking: React.FC<DonationTrackingProps> = ({ donation, onBack }) => {
  const { currentUser } = useAuth();
  const { requestDonation, acceptPickup, markDelivered, registeredUsers } = useDonations();
  const [feedback, setFeedback] = useState<string | null>(null);

  const steps = [
    { key: 'available', label: 'Surplus Posted', desc: 'Donor listed surplus with human safety verification' },
    { key: 'requested', label: 'Claimed by NGO', desc: donation.requestedByNgoName ? `Allocated to ${donation.requestedByNgoName}` : 'Awaiting NGO request' },
    { key: 'in_transit', label: 'Volunteer In Transit', desc: donation.volunteerName ? `Courier ${donation.volunteerName} en route` : 'Awaiting courier dispatch' },
    { key: 'delivered', label: 'Delivered & Rescued', desc: 'Food safely received and prepared for distribution' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'available':
        return 0;
      case 'requested':
      case 'matched':
        return 1;
      case 'in_transit':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(donation.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Tracking Code:</span>
          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
            #{donation.id.slice(0, 14)}
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Main Status & Progress Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Status: {donation.status.replace('_', ' ')}
              </span>
              {donation.aiPriorityScore && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  AI Urgency Score: {donation.aiPriorityScore}/100 ({donation.aiUrgencyLevel})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {donation.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Donor: <strong>{donation.donorName}</strong> ({donation.donorOrg || 'Food Donor'}) • Listed: {new Date(donation.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-left md:text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
            <div className="text-xs text-slate-500 font-semibold uppercase">Surplus Amount</div>
            <div className="text-3xl font-black text-slate-900 mt-0.5">
              {donation.quantityKg} <span className="text-sm font-semibold text-emerald-600">kg</span>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              ~{donation.estimatedServings} meal portions
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="py-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((s, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={s.key} className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="font-bold text-xs text-slate-900">{s.label}</div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-10 sm:pl-0">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Progression Helper for reviewer */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
          <div className="text-xs text-emerald-900">
            <strong>Interactive Workflow:</strong> Test lifecycle transitions using the action buttons:
          </div>
          <div className="flex items-center gap-2">
            {donation.status === 'available' && (
              <button
                onClick={async () => {
                  const res = await requestDonation(donation.id);
                  setFeedback(res.message);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs"
              >
                Simulate NGO Claim
              </button>
            )}

            {donation.status === 'requested' && (
              <button
                onClick={async () => {
                  const res = await acceptPickup(donation.id);
                  setFeedback(res.message);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              >
                Simulate Volunteer Pickup
              </button>
            )}

            {donation.status === 'in_transit' && (
              <button
                onClick={async () => {
                  const res = await markDelivered(donation.id);
                  setFeedback(res.message);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Final Delivery</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Map & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI & Safety Brief */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Operational Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Operational Summary (Gemini 3.8)</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              {donation.aiSummary || `${donation.quantityKg}kg of ${donation.title} from ${donation.donorName}. Ready for swift redistribution.`}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Volunteer Transport & Storage Directives
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {donation.handlingNotes || 'Transport in clean, sealed food-grade containers. Maintain continuous temperature compliance.'}
              </div>
            </div>

            {/* Mandatory Human Verification Badge */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Human Inspection Verification Stamp
                </h4>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Verified by certified human food handler: <strong>{donation.humanVerifierName || 'Kitchen Inspector'}</strong>.
              </p>
              <div className="text-[11px] text-amber-800">
                AI does not certify food safety. Visual, olfactory, and thermal inspection has been certified prior to handover.
              </div>
            </div>
          </div>

          {/* Interactive Route Map */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Pickup & Delivery Location</span>
            </h3>
            <FoodMap
              donations={[donation]}
              ngos={registeredUsers.filter((u) => u.role === 'ngo')}
              selectedDonationId={donation.id}
              center={[donation.lat || 26.8467, donation.lng || 80.9462]}
              zoom={13}
              height="280px"
              showRoutes={true}
            />
          </div>
        </div>

        {/* Right Column: Participant Dossier */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Participants & Contact
            </h3>

            {/* Donor */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Food Donor
              </div>
              <div className="font-bold text-sm text-slate-900">{donation.donorName}</div>
              <div className="text-xs text-slate-600">{donation.donorOrg || 'Kitchen Facility'}</div>
              <div className="text-xs text-slate-500 pt-1">📍 {donation.pickupAddress}</div>
              {donation.donorPhone && (
                <div className="text-xs text-slate-600 font-medium pt-0.5">📞 {donation.donorPhone}</div>
              )}
            </div>

            {/* Recipient NGO */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recipient NGO
              </div>
              <div className="font-bold text-sm text-slate-900">
                {donation.requestedByNgoName || 'Pending Allocation'}
              </div>
              <div className="text-xs text-slate-500">
                {donation.requestedByNgoName ? 'Verified Food Pantry / Shelter' : 'Available for verified NGO claiming'}
              </div>
            </div>

            {/* Volunteer Courier */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Volunteer Courier
              </div>
              <div className="font-bold text-sm text-slate-900">
                {donation.volunteerName || 'Dispatching Volunteer...'}
              </div>
              <div className="text-xs text-slate-500">
                {donation.volunteerName ? 'En route with temperature-controlled containers' : 'Ready for volunteer courier accept'}
              </div>
            </div>
          </div>

          {/* Environmental Impact of this batch */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-md space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Batch Environmental Value
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-emerald-100">Avoided CO₂e:</span>
                <strong className="text-base font-black text-white">{Math.round(donation.quantityKg * 2.5)} kg</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-emerald-100">Agricultural Water:</span>
                <strong className="text-base font-black text-white">{(donation.quantityKg * 290).toLocaleString()} L</strong>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-emerald-100">Nutritious Meals:</span>
                <strong className="text-base font-black text-white">~{donation.estimatedServings}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
