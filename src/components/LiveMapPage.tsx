import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Sparkles,
  Search,
  Filter,
  Utensils,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Compass,
  AlertCircle,
  Flame,
  Route,
  Navigation,
  CheckCircle2,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { useDonations } from '../context/DonationContext';
import { FoodDonation, UserProfile } from '../types';
import { FoodMap } from './FoodMap';
import {
  INDIAN_CITIES,
  DEFAULT_INDIAN_CITY,
  calculateHaversineDistanceKm,
  estimateTravelTimeMinutes,
  formatDistance,
  getRankedNgosByDistance,
} from '../lib/geoUtils';

interface LiveMapPageProps {
  onSelectDonation: (donation: FoodDonation) => void;
  onOpenDonate: () => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  onSelectDonation,
  onOpenDonate,
}) => {
  const { donations, registeredUsers } = useDonations();
  const [selectedCity, setSelectedCity] = useState(DEFAULT_INDIAN_CITY);
  const [selectedDonation, setSelectedDonation] = useState<FoodDonation | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | 'donations' | 'urgent' | 'ngos' | 'volunteers' | 'donors'>('all');
  const [search, setSearch] = useState<string>('');

  const activeDonations = useMemo(
    () => donations.filter((d) => d.status !== 'cancelled'),
    [donations]
  );

  const ngos = useMemo(
    () => registeredUsers.filter((u) => u.role === 'ngo'),
    [registeredUsers]
  );

  const donors = useMemo(
    () => registeredUsers.filter((u) => u.role === 'donor'),
    [registeredUsers]
  );

  const volunteers = useMemo(
    () => registeredUsers.filter((u) => u.role === 'volunteer'),
    [registeredUsers]
  );

  // Search filtering by city, area, PIN code, restaurant, or NGO name
  const filteredDonations = useMemo(() => {
    return activeDonations.filter((d) => {
      const q = search.toLowerCase().trim();

      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.pickupAddress.toLowerCase().includes(q) ||
        d.donorName.toLowerCase().includes(q) ||
        (d.donorOrg && d.donorOrg.toLowerCase().includes(q)) ||
        (d.city && d.city.toLowerCase().includes(q)) ||
        (d.pinCode && d.pinCode.toLowerCase().includes(q)) ||
        (d.requestedByNgoName && d.requestedByNgoName.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || d.category === categoryFilter;

      let matchesEntity = true;
      if (entityFilter === 'donations') {
        matchesEntity = d.status === 'available';
      } else if (entityFilter === 'urgent') {
        matchesEntity = d.aiUrgencyLevel === 'CRITICAL' || d.aiUrgencyLevel === 'HIGH';
      } else if (entityFilter === 'ngos' || entityFilter === 'volunteers' || entityFilter === 'donors') {
        // If entity filter is purely for actors, keep only related donations or empty
        matchesEntity = true;
      }

      return matchesSearch && matchesCat && matchesEntity;
    });
  }, [activeDonations, search, categoryFilter, entityFilter]);

  // Handle City Change
  const handleCitySelect = (cityId: string) => {
    const city = INDIAN_CITIES.find((c) => c.id === cityId) || DEFAULT_INDIAN_CITY;
    setSelectedCity(city);
    // Find first donation in that city if available
    const firstInCity = activeDonations.find(
      (d) => d.city?.toLowerCase() === city.name.toLowerCase()
    );
    if (firstInCity) {
      setSelectedDonation(firstInCity);
    }
  };

  // Compute transit info for selected donation
  const selectedDonationTransit = useMemo(() => {
    if (!selectedDonation) return null;
    const ranked = getRankedNgosByDistance(
      selectedDonation.lat,
      selectedDonation.lng,
      ngos,
      selectedDonation.quantityKg
    );
    const topNgo = ranked[0];
    return {
      topNgo: topNgo?.ngo,
      distanceKm: topNgo?.distanceKm,
      travelTimeMin: topNgo?.travelTimeMin,
      reason: topNgo?.reason,
      allRanked: ranked.slice(0, 3),
    };
  }, [selectedDonation, ngos]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>OpenStreetMap India Redistribution Grid • DEMO DATA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
            Live Surplus Food Rescue Map (India)
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Real-time geospatial visualization of food donors, verified NGO distribution hubs, and volunteer couriers across major Indian urban centers.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenDonate}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/30 flex items-center gap-2 transition-all"
          >
            <Utensils className="w-4 h-4" />
            <span>+ Post Surplus Food</span>
          </button>
        </div>
      </div>

      {/* City Switcher Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Active Indian City:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {INDIAN_CITIES.map((city) => {
            const isSelected = selectedCity.id === city.id;
            const donationCount = activeDonations.filter(
              (d) => d.city?.toLowerCase() === city.name.toLowerCase()
            ).length;

            return (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs scale-102 ring-2 ring-emerald-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{city.name}</span>
                {donationCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {donationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Universal Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city, area (Hazratganj, Gomti Nagar), PIN code (226001), restaurant, or NGO..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Food Category Selector */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Food Categories</option>
              <option value="prepared_meals">Cooked / Prepared Meals</option>
              <option value="produce">Fresh Produce & Fruits</option>
              <option value="bakery">Bakery & Breads</option>
              <option value="dairy">Dairy & Sweets</option>
              <option value="canned_goods">Packaged Food</option>
            </select>
          </div>

          {/* Reset Search / Clear */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredDonations.length}</strong> listings
            </div>
            {(search || categoryFilter !== 'all' || entityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setEntityFilter('all');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Entity Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filter View:
          </span>
          <button
            onClick={() => setEntityFilter('all')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all ${
              entityFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Markers ({filteredDonations.length + ngos.length + volunteers.length})
          </button>
          <button
            onClick={() => setEntityFilter('donations')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1 ${
              entityFilter === 'donations'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>🍲 Available Food</span>
          </button>
          <button
            onClick={() => setEntityFilter('urgent')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1 ${
              entityFilter === 'urgent'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Urgent Rescues Only</span>
          </button>
          <button
            onClick={() => setEntityFilter('ngos')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1 ${
              entityFilter === 'ngos'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>NGO Distribution Centers ({ngos.length})</span>
          </button>
          <button
            onClick={() => setEntityFilter('volunteers')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1 ${
              entityFilter === 'volunteers'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Volunteer Couriers ({volunteers.length})</span>
          </button>
          <button
            onClick={() => setEntityFilter('donors')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1 ${
              entityFilter === 'donors'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
            }`}
          >
            <span>🏨 Food Donors ({donors.length})</span>
          </button>
        </div>
      </div>

      {/* Main Map + Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-3 rounded-3xl border border-slate-200/80 shadow-sm relative">
            <FoodMap
              donations={filteredDonations}
              donors={donors}
              ngos={ngos}
              volunteers={volunteers}
              selectedDonationId={selectedDonation?.id}
              onSelectDonation={(d) => {
                setSelectedDonation(d);
                setSelectedUser(null);
              }}
              onSelectUser={(u) => setSelectedUser(u)}
              center={[selectedCity.lat, selectedCity.lng]}
              zoom={selectedCity.zoom}
              height="580px"
              showRoutes={true}
              filterEntity={entityFilter}
            />

            {/* City Tagline Floating Badge */}
            <div className="absolute top-6 left-6 z-20 bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 border border-white/20 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{selectedCity.name}: {selectedCity.tagline}</span>
            </div>
          </div>

          {/* Route Distance Banner (when a donation with transit is selected) */}
          {selectedDonation && selectedDonationTransit?.topNgo && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Pickup Route Active:</span>
                    <span className="text-emerald-700 font-extrabold">
                      {formatDistance(selectedDonationTransit.distanceKm || 0)}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-extrabold">
                      ~{selectedDonationTransit.travelTimeMin} mins transit
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    From <strong>{selectedDonation.donorOrg || selectedDonation.donorName}</strong> to{' '}
                    <strong>{selectedDonationTransit.topNgo.organization || selectedDonationTransit.topNgo.displayName}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectDonation(selectedDonation)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-colors flex items-center gap-1"
              >
                <span>View Full Dispatch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Cards Panel */}
        <div className="lg:col-span-4 space-y-4 max-h-[660px] overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Listings in {selectedCity.name} ({filteredDonations.length})</span>
            <span className="text-emerald-600 font-bold">{ngos.length} Relief Hubs</span>
          </div>

          {/* Selected Donation Detailed Spotlight Card */}
          {selectedDonation && (
            <div className="p-4 rounded-3xl bg-emerald-50/70 border-2 border-emerald-500 shadow-md space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white tracking-wider">
                    Selected on Map
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">
                    {selectedDonation.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedDonation.donorOrg || selectedDonation.donorName}
                  </div>
                </div>
                {selectedDonation.aiPriorityScore && (
                  <span className="text-xs font-extrabold px-2 py-1 rounded-xl bg-white text-emerald-700 border border-emerald-300 shadow-xs">
                    {selectedDonation.aiPriorityScore}/100
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-2xl border border-emerald-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Rescued Weight</span>
                  <div className="font-bold text-slate-900">{selectedDonation.quantityKg} kg</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Meal Portions</span>
                  <div className="font-bold text-emerald-700">~{selectedDonation.estimatedServings} servings</div>
                </div>
              </div>

              {/* Transit Distance to Nearest Verified NGO */}
              {selectedDonationTransit?.topNgo && (
                <div className="text-xs p-2.5 rounded-2xl bg-white border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Navigation className="w-3.5 h-3.5" />
                      Nearest Relief Center:
                    </span>
                    <span>{formatDistance(selectedDonationTransit.distanceKm || 0)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold truncate">
                    {selectedDonationTransit.topNgo.organization || selectedDonationTransit.topNgo.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Est. courier transit: ~{selectedDonationTransit.travelTimeMin} mins
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-600 space-y-1">
                <div><strong>📍 Pickup:</strong> {selectedDonation.pickupAddress}</div>
                {selectedDonation.pickupDeadline && (
                  <div><strong>⏰ Deadline:</strong> {selectedDonation.pickupDeadline}</div>
                )}
                <div><strong>❄️ Storage:</strong> <span className="capitalize">{selectedDonation.storageCondition.replace('_', ' ')}</span></div>
              </div>

              <button
                onClick={() => onSelectDonation(selectedDonation)}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open Full Rescue Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Listings List */}
          {filteredDonations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-2">
              <p>No food surplus records matching this filter in <strong>{selectedCity.name}</strong>.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setEntityFilter('all');
                }}
                className="text-emerald-700 font-bold underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredDonations.map((d) => {
              const isSelected = selectedDonation?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDonation(d)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-300 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        d.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'requested'
                          ? 'bg-amber-100 text-amber-800'
                          : d.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {d.status}
                    </span>

                    {d.aiUrgencyLevel === 'CRITICAL' && (
                      <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        Urgent
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {d.title}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    {d.donorOrg || d.donorName} • {d.city || 'India'}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 pt-2 border-t border-slate-100 font-medium">
                    <span className="text-emerald-700 font-bold">⚖️ {d.quantityKg} kg</span>
                    <span>🍽️ ~{d.estimatedServings} servings</span>
                    <span className="capitalize text-slate-500">{d.storageCondition.replace('_', ' ')}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    📍 {d.pickupAddress}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
