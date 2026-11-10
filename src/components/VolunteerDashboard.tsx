import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Navigation,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { FoodDonation } from '../types';
import { FoodMap } from './FoodMap';

interface VolunteerDashboardProps {
  onSelectDonation: (donation: FoodDonation) => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ onSelectDonation }) => {
  const { currentUser } = useAuth();
  const { donations, acceptPickup, markDelivered, registeredUsers } = useDonations();

  const [activeDonationId, setActiveDonationId] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [deliveryFeedback, setDeliveryFeedback] = useState<string | null>(null);

  // Available for courier pickup: status === 'requested' (claimed by NGO but no courier yet)
  const readyForPickup = donations.filter((d) => d.status === 'requested');

  // Currently assigned to this volunteer or en route:
  const myActiveMissions = donations.filter(
    (d) => (d.status === 'in_transit' && (d.volunteerId === currentUser?.uid || currentUser?.role === 'volunteer'))
  );

  // Completed missions
  const completedMissions = donations.filter((d) => d.status === 'delivered');

  const handleAcceptPickup = async (donationId: string) => {
    const res = await acceptPickup(donationId);
    setDeliveryFeedback(res.message);
  };

  const handleConfirmDelivery = async (donationId: string) => {
    try {
      setDeliveringId(donationId);
      const res = await markDelivered(donationId);
      setDeliveryFeedback(res.message);
    } finally {
      setDeliveringId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
            <Truck className="w-4 h-4" />
            <span>Volunteer Courier Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Courier: {currentUser?.displayName || 'Aarav Sharma'}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Vehicle: <strong className="capitalize">{currentUser?.vehicleType?.replace('_', ' ') || 'Electric Two-Wheeler'}</strong> • Active Community Rescuer #UP-4482 ({currentUser?.city || 'Lucknow'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <div className="text-xs text-blue-200">Active Missions</div>
            <div className="text-2xl font-black text-white">{myActiveMissions.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <div className="text-xs text-blue-200">Completed Rescues</div>
            <div className="text-2xl font-black text-white">{completedMissions.length}</div>
          </div>
        </div>
      </div>

      {deliveryFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deliveryFeedback}</span>
          </div>
          <button
            onClick={() => setDeliveryFeedback(null)}
            className="text-xs font-semibold underline text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Logistics Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Food Rescue Dispatch Map</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pins show commercial donors with surplus food and destination NGO shelter hubs
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            {readyForPickup.length + myActiveMissions.length} active points in grid
          </div>
        </div>

        <FoodMap
          donations={donations}
          ngos={registeredUsers.filter((u) => u.role === 'ngo')}
          selectedDonationId={activeDonationId || undefined}
          onSelectDonation={(d) => {
            setActiveDonationId(d.id);
            onSelectDonation(d);
          }}
          height="380px"
        />
      </div>

      {/* Active Missions in Transit */}
      {myActiveMissions.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-blue-400 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
              <h3 className="font-bold text-base text-blue-950">
                You Have Food in Transit! ({myActiveMissions.length} Active Dispatch)
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase">
              Urgent Delivery
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myActiveMissions.map((mission) => (
              <div
                key={mission.id}
                className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      En Route
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      ⚖️ {mission.quantityKg} kg ({mission.estimatedServings} servings)
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{mission.title}</h4>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div>
                      <strong>Pickup:</strong> {mission.donorName} ({mission.pickupAddress})
                    </div>
                    <div>
                      <strong>Delivery Destination:</strong> {mission.requestedByNgoName || 'Community Shelter'}
                    </div>
                    <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                      <strong>Handling Spec:</strong> Keep {mission.storageCondition.replace('_', ' ')}. Transport sealed.
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-blue-200/60">
                  <button
                    onClick={() => onSelectDonation(mission)}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    View Map & Instructions
                  </button>

                  <button
                    onClick={() => handleConfirmDelivery(mission.id)}
                    disabled={deliveringId === mission.id}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Handover & Delivery</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Pickups Ready for Courier */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Pickups Ready for Transport ({readyForPickup.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Food requested by NGOs requiring volunteer courier transport to recipient shelters
            </p>
          </div>
        </div>

        {readyForPickup.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No unclaimed pickups currently waiting. Check back soon or view active in-transit deliveries!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {readyForPickup.map((donation) => (
              <div
                key={donation.id}
                className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      Claimed by {donation.requestedByNgoName}
                    </span>
                    {donation.aiPriorityScore && (
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Priority: {donation.aiPriorityScore}/100
                      </span>
                    )}
                    <span className="text-xs text-slate-400 capitalize">
                      {donation.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectDonation(donation)}
                    className="font-bold text-sm text-slate-900 hover:text-emerald-700 cursor-pointer"
                  >
                    {donation.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      ⚖️ {donation.quantityKg} kg (~{donation.estimatedServings} servings)
                    </span>
                    <span>📍 From: {donation.pickupAddress}</span>
                    <span>🏢 To: {donation.requestedByNgoName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => onSelectDonation(donation)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleAcceptPickup(donation.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Accept Transport Mission</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
