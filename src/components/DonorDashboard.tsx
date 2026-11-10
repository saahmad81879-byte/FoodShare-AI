import React, { useState } from 'react';
import {
  PlusCircle,
  Clock,
  MapPin,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Eye,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { FoodDonation } from '../types';

interface DonorDashboardProps {
  onOpenCreate: () => void;
  onSelectDonation: (donation: FoodDonation) => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  onOpenCreate,
  onSelectDonation,
}) => {
  const { currentUser } = useAuth();
  const { donations, cancelDonation, deleteDonation } = useDonations();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Filter donations belonging to this donor or show all if demo
  const donorDonations = donations.filter(
    (d) => d.donorId === currentUser?.uid || currentUser?.role === 'donor'
  );

  const activeDonations = donorDonations.filter(
    (d) => d.status === 'available' || d.status === 'requested' || d.status === 'in_transit'
  );
  const completedDonations = donorDonations.filter((d) => d.status === 'delivered');

  const displayedDonations =
    filter === 'active'
      ? activeDonations
      : filter === 'completed'
      ? completedDonations
      : donorDonations;

  const totalKgDonated = donorDonations.reduce((acc, d) => acc + (d.quantityKg || 0), 0);
  const totalMealsFed = donorDonations.reduce((acc, d) => acc + (d.estimatedServings || Math.round(d.quantityKg * 2.2)), 0);
  const totalCo2Saved = Math.round(totalKgDonated * 2.5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Available for Pickup
          </span>
        );
      case 'requested':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Claimed by NGO
          </span>
        );
      case 'in_transit':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Courier En Route
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Rescued & Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Utensils className="w-4 h-4" />
            <span>Food Donor Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Welcome back, {currentUser?.displayName || 'Catering Partner'}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
            {currentUser?.organization || 'Commercial Kitchen Partner'} • Turn kitchen surplus into meals and verified carbon credits.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-5 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 group"
        >
          <PlusCircle className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span>Post Food Surplus</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Rescued
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {totalKgDonated.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-emerald-600">kg</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">From {donorDonations.length} postings in Firestore</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Meals Provided
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {totalMealsFed.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-teal-600">portions</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">To local community kitchens</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active in Pipeline
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {activeDonations.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Ready or currently en route</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            CO₂ Diverted
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {totalCo2Saved.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-emerald-600">kg</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">From municipal landfill</div>
        </div>
      </div>

      {/* Donations List Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Your Food Donations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Firestore inventory tracking with photos, deadlines, and NGO dispatch status
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({donorDonations.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeDonations.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivered ({completedDonations.length})
            </button>
          </div>
        </div>

        {/* Donations Feed */}
        {displayedDonations.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Utensils className="w-8 h-8" />
            </div>
            <div className="max-w-sm mx-auto">
              <h4 className="font-bold text-slate-900 text-sm">No food donations in this view</h4>
              <p className="text-xs text-slate-500 mt-1">
                Have excess prepared food, bakery goods, or produce? Create a new listing and local NGOs will be notified immediately.
              </p>
            </div>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              Create Food Donation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedDonations.map((donation) => (
              <div
                key={donation.id}
                className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Photo + Details */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Photo Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs">
                    {donation.imageUrl ? (
                      <img
                        src={donation.imageUrl}
                        alt={donation.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(donation.status)}
                      {donation.aiPriorityScore && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          AI Priority: {donation.aiPriorityScore}/100 ({donation.aiUrgencyLevel})
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                        {donation.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4
                        className="font-bold text-base text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                        onClick={() => onSelectDonation(donation)}
                      >
                        {donation.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {donation.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="font-semibold text-emerald-700">
                        ⚖️ {donation.quantityKg} kg (~{donation.estimatedServings} servings)
                      </span>
                      <span className="font-medium text-slate-700 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                        🌡️ {donation.storageCondition.replace('_', ' ')}
                      </span>
                      {donation.pickupDeadline && (
                        <span className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <Calendar className="w-3 h-3 text-rose-500" />
                          Deadline: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(donation.pickupDeadline).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {donation.pickupAddress}
                      </span>
                      {donation.requestedByNgoName && (
                        <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          NGO: {donation.requestedByNgoName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => onSelectDonation(donation)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Track Status</span>
                  </button>

                  {donation.status === 'available' && (
                    <button
                      onClick={() => cancelDonation(donation.id)}
                      title="Cancel listing"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
