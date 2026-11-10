import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Truck,
  Layers,
  Thermometer,
  Calendar,
  Image as ImageIcon,
  CheckSquare,
  Users,
  Eye,
  FileText,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { FoodDonation, FoodCategory, StorageCondition } from '../types';
import { AiNgoMatcherModal } from './AiNgoMatcherModal';

interface NgoDashboardProps {
  onSelectDonation: (donation: FoodDonation) => void;
}

export const NgoDashboard: React.FC<NgoDashboardProps> = ({ onSelectDonation }) => {
  const { currentUser } = useAuth();
  const {
    donations,
    requestDonation,
    updateCollectionStatus,
    confirmDistribution,
    registeredUsers,
  } = useDonations();

  const [activeTab, setActiveTab] = useState<'available' | 'claimed'>('available');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStorage, setSelectedStorage] = useState<string>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [matchingDonation, setMatchingDonation] = useState<FoodDonation | null>(null);

  // Distribution confirmation modal
  const [distributingDonation, setDistributingDonation] = useState<FoodDonation | null>(null);
  const [actualMealsServed, setActualMealsServed] = useState<number>(50);
  const [distributionNotes, setDistributionNotes] = useState<string>('Distributed directly to shelter residents and community members.');
  const [confirmingDist, setConfirmingDist] = useState<boolean>(false);

  const availableDonations = donations.filter((d) => d.status === 'available');
  const myClaimedDonations = donations.filter(
    (d) =>
      d.requestedByNgoId === currentUser?.uid ||
      d.requestedByNgoId === 'ngo-hope-foundation' ||
      d.requestedByNgoId === 'ngo-helping-hands' ||
      d.requestedByNgoId === 'ngo-city-harvest' ||
      (currentUser?.role === 'ngo' && (d.status === 'requested' || d.status === 'in_transit' || d.status === 'delivered'))
  );

  // Filtered available list
  const filteredAvailable = availableDonations.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.city && d.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.pinCode && d.pinCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.donorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesStorage = selectedStorage === 'all' || d.storageCondition === selectedStorage;

    return matchesSearch && matchesCategory && matchesStorage;
  });

  const handleClaim = async (donationId: string) => {
    try {
      setClaimingId(donationId);
      setClaimFeedback(null);
      const res = await requestDonation(donationId);
      setClaimFeedback({ id: donationId, success: res.success, message: res.message });
      if (res.success) {
        // Switch to claimed tab to see scheduled mission
        setActiveTab('claimed');
      }
    } catch (err: any) {
      setClaimFeedback({
        id: donationId,
        success: false,
        message: err.message || 'Failed to claim donation',
      });
    } finally {
      setClaimingId(null);
    }
  };

  const handleConfirmDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributingDonation) return;

    try {
      setConfirmingDist(true);
      const res = await confirmDistribution(
        distributingDonation.id,
        Number(actualMealsServed),
        distributionNotes
      );
      setClaimFeedback({ id: distributingDonation.id, success: res.success, message: res.message });
      setDistributingDonation(null);
    } catch (err: any) {
      setClaimFeedback({
        id: distributingDonation.id,
        success: false,
        message: err.message || 'Error confirming distribution',
      });
    } finally {
      setConfirmingDist(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top NGO Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
            <Building2 className="w-4 h-4" />
            <span>Community Relief & NGO Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            {currentUser?.organization || 'City Hope Community Kitchen'}
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl">
            Intake Capacity: <strong>{currentUser?.capacityKg || 350} kg/day</strong> • Connect surplus food with vulnerable individuals & families.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <div className="text-xs text-teal-200">Surplus Available</div>
            <div className="text-2xl font-black text-white">{availableDonations.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <div className="text-xs text-teal-200">Active Requests</div>
            <div className="text-2xl font-black text-white">{myClaimedDonations.length}</div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'available'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Available Surplus Feed ({availableDonations.length})
        </button>
        <button
          onClick={() => setActiveTab('claimed')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'claimed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          My Organization's Claims & Deliveries ({myClaimedDonations.length})
        </button>
      </div>

      {/* Feedback banner */}
      {claimFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            claimFeedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {claimFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{claimFeedback.message}</span>
          </div>
          <button
            onClick={() => setClaimFeedback(null)}
            className="text-xs font-semibold underline text-slate-600 hover:text-slate-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'available' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food by title, pickup address, or donor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 flex-1 md:flex-initial"
              >
                <option value="all">All Categories</option>
                <option value="prepared_meals">Prepared Meals</option>
                <option value="bakery">Bakery</option>
                <option value="produce">Fresh Produce</option>
                <option value="dairy">Dairy</option>
                <option value="canned_goods">Canned</option>
              </select>

              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 flex-1 md:flex-initial"
              >
                <option value="all">All Storage Types</option>
                <option value="ambient">Ambient</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="frozen">Frozen</option>
                <option value="hot_holding">Hot Holding</option>
              </select>
            </div>
          </div>

          {/* Available Cards Grid */}
          {filteredAvailable.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No available donations match your filter</h4>
              <p className="text-xs text-slate-500">
                Try loosening your search terms or checking back shortly as donors post new surplus.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAvailable.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Image & Header */}
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {donation.imageUrl ? (
                          <img
                            src={donation.imageUrl}
                            alt={donation.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                          {donation.aiPriorityScore && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Priority: {donation.aiPriorityScore}/100
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => onSelectDonation(donation)}
                          className="font-bold text-base text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer line-clamp-1"
                        >
                          {donation.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {donation.description}
                        </p>
                      </div>
                    </div>

                    {/* Key Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity</span>
                        <span className="font-bold text-slate-900">
                          {donation.quantityKg} kg (~{donation.estimatedServings} servings)
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Storage Temp</span>
                        <span className="font-bold text-slate-900 capitalize">
                          {donation.storageCondition.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{donation.pickupAddress}</span>
                      </div>

                      {donation.pickupDeadline && (
                        <div className="flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Pickup Deadline: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(donation.pickupDeadline).toLocaleDateString()}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Safe window: {donation.expiryWindow || 'Immediate'}</span>
                      </div>

                      {donation.allergens && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <strong>Allergens:</strong> {donation.allergens}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setMatchingDonation(donation)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 flex items-center gap-1 transition-colors"
                      title="Run Gemini multi-variable matching"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>AI Compatibility</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectDonation(donation)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => handleClaim(donation.id)}
                        disabled={claimingId === donation.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <span>Request Donation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Claimed & Scheduled Deliveries Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">
              Your Scheduled & Dispatched Surplus Rescues
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Accept assignments, update collection statuses, and verify final distribution to beneficiaries
            </p>
          </div>

          {myClaimedDonations.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Truck className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">No active claims right now</div>
              <div className="text-xs text-slate-500">
                Check the Available Surplus feed above to claim food donations for your shelter or kitchen.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myClaimedDonations.map((d) => (
                <div key={d.id} className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {d.imageUrl ? (
                        <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            d.status === 'requested'
                              ? 'bg-amber-100 text-amber-800'
                              : d.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {d.status === 'requested'
                            ? 'Claim Confirmed'
                            : d.status === 'in_transit'
                            ? 'Courier In Transit'
                            : 'Distribution Verified'}
                        </span>

                        {d.collectionStatus && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            Collection: {d.collectionStatus}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-base text-slate-900">{d.title}</h4>
                      <p className="text-xs text-slate-500">
                        Donor: <strong>{d.donorName}</strong> ({d.donorOrg}) • Pickup: {d.pickupAddress}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                        <span className="font-semibold text-emerald-700">
                          {d.quantityKg} kg (~{d.estimatedServings} servings)
                        </span>
                        {d.volunteerName && (
                          <span className="text-blue-700 font-medium">🚚 Courier: {d.volunteerName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Update collection status or confirm distribution */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    {d.status === 'requested' && (!d.collectionStatus || d.collectionStatus === 'pending') && (
                      <button
                        onClick={() => updateCollectionStatus(d.id, 'scheduled')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
                      >
                        Accept Assignment
                      </button>
                    )}

                    {d.status !== 'delivered' && (
                      <button
                        onClick={() => {
                          setDistributingDonation(d);
                          setActualMealsServed(d.estimatedServings || Math.round(d.quantityKg * 2.2));
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Confirm Distribution</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectDonation(d)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actual Distribution Confirmation Modal */}
      {distributingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-300" />
                  <h3 className="font-bold text-lg">Confirm Food Distribution</h3>
                </div>
                <p className="text-emerald-100 text-xs">
                  Record actual community impact and meals served to beneficiaries
                </p>
              </div>
              <button
                onClick={() => setDistributingDonation(null)}
                className="p-1 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDistribution} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
                <div className="font-bold text-slate-900">{distributingDonation.title}</div>
                <div className="text-emerald-800 mt-0.5">{distributingDonation.quantityKg} kg rescued from {distributingDonation.donorName}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Meals Distributed to Beneficiaries *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={actualMealsServed}
                  onChange={(e) => setActualMealsServed(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Distribution Notes & Recipient Community
                </label>
                <textarea
                  rows={3}
                  value={distributionNotes}
                  onChange={(e) => setDistributionNotes(e.target.value)}
                  placeholder="e.g. Distributed during dinner service at community dining hall. 65 homeless individuals nourished."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Confirms human food inspection has occurred upon receipt and food was wholesome.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDistributingDonation(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmingDist}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                >
                  {confirmingDist ? 'Logging to Firestore...' : 'Verify & Log Distribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI NGO Matcher Modal */}
      {matchingDonation && (
        <AiNgoMatcherModal
          donation={matchingDonation}
          allNgos={registeredUsers}
          onClose={() => setMatchingDonation(null)}
          onRequestMatch={(ngoId) => {
            handleClaim(matchingDonation.id);
            setMatchingDonation(null);
          }}
        />
      )}
    </div>
  );
};
