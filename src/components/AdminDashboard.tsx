import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  Utensils,
  Truck,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Eye,
  Activity,
  AlertTriangle,
  Scale,
  Calendar,
  Layers,
  ArrowUpRight,
  HeartHandshake,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { FoodDonation, UserProfile, UserRole } from '../types';

interface AdminDashboardProps {
  onSelectDonation: (donation: FoodDonation) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectDonation }) => {
  const { currentUser } = useAuth();
  const {
    donations,
    registeredUsers,
    deleteDonation,
    toggleUserVerification,
    resetToSampleData,
  } = useDonations();

  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'users'>('overview');
  const [timeframe, setTimeframe] = useState<'all' | '30d' | '7d'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [donationStatusFilter, setDonationStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Timeframe filter computation
  const filteredByTimeframe = useMemo(() => {
    if (timeframe === 'all') return donations;
    const now = new Date();
    const days = timeframe === '7d' ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return donations.filter((d) => {
      const created = d.createdAt ? new Date(d.createdAt) : new Date();
      return created >= cutoff;
    });
  }, [donations, timeframe]);

  // Real Database Metrics (Calculated from demo records)
  const registeredDonors = registeredUsers.filter((u) => u.role === 'donor').length;
  const activeNgos = registeredUsers.filter((u) => u.role === 'ngo').length;
  const activeVolunteers = registeredUsers.filter((u) => u.role === 'volunteer').length;
  const totalDonations = filteredByTimeframe.length;

  // Meals available (from uncollected available surplus)
  const mealsAvailable = filteredByTimeframe
    .filter((d) => d.status === 'available')
    .reduce((sum, d) => sum + (d.estimatedServings || Math.round((d.quantityKg || 0) * 2.2)), 0);

  // Donations successfully delivered
  const donationsDelivered = filteredByTimeframe.filter((d) => d.status === 'delivered').length;

  // Pending pickups: claimed by NGO or scheduled/in-transit awaiting completion
  const pendingPickups = filteredByTimeframe.filter(
    (d) =>
      d.status === 'requested' ||
      d.collectionStatus === 'pending' ||
      d.collectionStatus === 'scheduled' ||
      (d.status === 'in_transit' && !d.actualDistributionConfirmed)
  ).length;

  // Estimated food waste diverted (in kg): sum of quantity for delivered, in_transit, or collected donations
  const estimatedFoodWasteDiverted = filteredByTimeframe
    .filter(
      (d) =>
        d.status === 'delivered' ||
        d.status === 'in_transit' ||
        d.collectionStatus === 'collected' ||
        d.collectionStatus === 'distributed'
    )
    .reduce((sum, d) => sum + (d.quantityKg || 0), 0);

  // Actual meals distributed: from completed deliveries or confirmed distributions
  const actualMealsDistributed = filteredByTimeframe
    .filter((d) => d.status === 'delivered' || d.actualDistributionConfirmed)
    .reduce((sum, d) => sum + (d.beneficiariesServed || d.estimatedServings || Math.round((d.quantityKg || 0) * 2.2)), 0);

  // Total potential volume of all posted donations
  const totalVolumeKg = filteredByTimeframe.reduce((sum, d) => sum + (d.quantityKg || 0), 0);
  const totalCO2SavedKg = Math.round(estimatedFoodWasteDiverted * 2.5);

  // City-wise donation distribution
  const cityDistribution = useMemo(() => {
    const cities: Record<string, { count: number; kg: number; meals: number; color: string }> = {
      Lucknow: { count: 0, kg: 0, meals: 0, color: 'bg-emerald-500' },
      Kanpur: { count: 0, kg: 0, meals: 0, color: 'bg-teal-500' },
      Delhi: { count: 0, kg: 0, meals: 0, color: 'bg-blue-500' },
      Noida: { count: 0, kg: 0, meals: 0, color: 'bg-purple-500' },
      Varanasi: { count: 0, kg: 0, meals: 0, color: 'bg-amber-500' },
      Mumbai: { count: 0, kg: 0, meals: 0, color: 'bg-orange-500' },
      Bengaluru: { count: 0, kg: 0, meals: 0, color: 'bg-cyan-500' },
      Jaipur: { count: 0, kg: 0, meals: 0, color: 'bg-rose-500' },
    };

    filteredByTimeframe.forEach((d) => {
      const city = d.city || 'Lucknow';
      if (!cities[city]) {
        cities[city] = { count: 0, kg: 0, meals: 0, color: 'bg-slate-400' };
      }
      cities[city].count += 1;
      cities[city].kg += d.quantityKg || 0;
      cities[city].meals += d.estimatedServings || Math.round((d.quantityKg || 0) * 2.2);
    });

    return cities;
  }, [filteredByTimeframe]);

  // Status pipeline counts for charts
  const statusCounts = useMemo(() => {
    return {
      available: filteredByTimeframe.filter((d) => d.status === 'available').length,
      requested: filteredByTimeframe.filter((d) => d.status === 'requested').length,
      in_transit: filteredByTimeframe.filter((d) => d.status === 'in_transit').length,
      delivered: filteredByTimeframe.filter((d) => d.status === 'delivered').length,
      cancelled: filteredByTimeframe.filter((d) => d.status === 'cancelled').length,
    };
  }, [filteredByTimeframe]);

  // Category breakdown for charts
  const categoryStats = useMemo(() => {
    const cats: Record<string, { label: string; count: number; kg: number; color: string }> = {
      prepared_meals: { label: 'Prepared Meals', count: 0, kg: 0, color: 'bg-emerald-500' },
      produce: { label: 'Fresh Produce', count: 0, kg: 0, color: 'bg-teal-500' },
      bakery: { label: 'Bakery & Grains', count: 0, kg: 0, color: 'bg-amber-500' },
      dairy: { label: 'Dairy & Eggs', count: 0, kg: 0, color: 'bg-blue-500' },
      canned_goods: { label: 'Canned & Packaged', count: 0, kg: 0, color: 'bg-indigo-500' },
      frozen: { label: 'Frozen Items', count: 0, kg: 0, color: 'bg-cyan-500' },
      beverages: { label: 'Beverages', count: 0, kg: 0, color: 'bg-purple-500' },
      other: { label: 'Other', count: 0, kg: 0, color: 'bg-slate-500' },
    };

    filteredByTimeframe.forEach((d) => {
      const cat = d.category || 'prepared_meals';
      if (cats[cat]) {
        cats[cat].count += 1;
        cats[cat].kg += d.quantityKg || 0;
      }
    });

    return cats;
  }, [filteredByTimeframe]);

  // Filtered donation list
  const filteredDonations = useMemo(() => {
    return filteredByTimeframe.filter((d) => {
      const matchesStatus = donationStatusFilter === 'all' || d.status === donationStatusFilter;
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      const matchesQuery =
        !searchQuery ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.donorOrg && d.donorOrg.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.requestedByNgoName && d.requestedByNgoName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        d.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [filteredByTimeframe, donationStatusFilter, categoryFilter, searchQuery]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesQuery =
        !searchQuery ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.organization && u.organization.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesRole && matchesQuery;
    });
  }, [registeredUsers, userRoleFilter, searchQuery]);

  const handleResetData = async () => {
    if (confirm('Reset platform data back to initial seed state in Firestore?')) {
      await resetToSampleData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Platform Administration & Compliance Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
            System Operations & Logistics Center
          </h1>
          <p className="text-purple-200/90 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Live Firestore telemetrics for administrator <strong>{currentUser?.email || 'saahmad81879@gmail.com'}</strong>.
            Audit safety compliance, verify community relief hubs, and monitor surplus food redistribution.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {/* Timeframe pill selector */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 flex items-center text-xs font-semibold">
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                timeframe === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-purple-200 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                timeframe === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-purple-200 hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                timeframe === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-purple-200 hover:text-white'
              }`}
            >
              7 Days
            </button>
          </div>

          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs"
            title="Restore sample donations and users to Firestore"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Platform records successfully refreshed to pristine demo state!</span>
        </div>
      )}

      {/* Demo Data Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 font-medium">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
            Demo Data
          </span>
          <span>All operational statistics below are computed in real time from simulated Indian regional records.</span>
        </div>
        <span className="hidden sm:inline text-amber-700 font-semibold text-[11px]">
          Fictional NGO and contact entities
        </span>
      </div>

      {/* Primary KPI Metrics Cards (8 Required Indicators) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Donations */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Donations
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-700 mt-2">
            {totalDonations}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalVolumeKg.toLocaleString()} kg total volume
          </div>
        </div>

        {/* 2. Meals Available */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Meals Available
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            {mealsAvailable.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Ready for immediate relief dispatch
          </div>
        </div>

        {/* 3. Donations Successfully Delivered */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Delivered Rescues
            </div>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-700 mt-2">
            {donationsDelivered}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Confirmed recipient distribution
          </div>
        </div>

        {/* 4. Active NGOs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Relief NGOs
            </div>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-700 mt-2">
            {activeNgos}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Shelters, pantries & kitchens
          </div>
        </div>

        {/* 5. Active Volunteers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Volunteers
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-700 mt-2">
            {activeVolunteers}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bike, auto & van courier network
          </div>
        </div>

        {/* 6. Pending Pickups */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Pickups
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {pendingPickups}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Awaiting courier dispatch / in-transit
          </div>
        </div>

        {/* 7. Estimated Food Waste Diverted */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimated Food Waste Diverted
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <div className="text-3xl font-black text-emerald-700">
              {estimatedFoodWasteDiverted.toLocaleString()}{' '}
              <span className="text-base font-bold text-slate-600">kg</span>
            </div>
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              🌱 ~{totalCO2SavedKg.toLocaleString()} kg CO₂e Prevented
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {actualMealsDistributed.toLocaleString()} meals provided to frontline community recipients
          </div>
        </div>
      </div>

      {/* Interactive Charts & Analytics Section (4 Key Operational Views) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: City-Wise Donation Distribution (Required Metric) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">City-Wise Donation Distribution</h3>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                  Demo Data
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Regional surplus redistribution volume across Indian metros</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {totalVolumeKg} kg Total
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(cityDistribution).map(([cityName, stat]) => {
              const pct = totalVolumeKg > 0 ? Math.round((stat.kg / totalVolumeKg) * 100) : 0;
              return (
                <div key={cityName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${stat.color}`}></span>
                      <span>{cityName}</span>
                    </span>
                    <span className="text-slate-500 font-medium">
                      <strong className="text-slate-900">{stat.count}</strong> listings • {stat.kg} kg ({pct}%) • ~{stat.meals} meals
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Status Lifecycle Pipeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Donation Lifecycle Pipeline</h3>
              <p className="text-[11px] text-slate-500">Live operational status breakdown</p>
            </div>
            <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
              {totalDonations} Records
            </span>
          </div>

          {/* Pipeline Bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
            {totalDonations > 0 ? (
              <>
                <div
                  style={{ width: `${(statusCounts.available / totalDonations) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Available: ${statusCounts.available}`}
                />
                <div
                  style={{ width: `${(statusCounts.requested / totalDonations) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Requested: ${statusCounts.requested}`}
                />
                <div
                  style={{ width: `${(statusCounts.in_transit / totalDonations) * 100}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`In Transit: ${statusCounts.in_transit}`}
                />
                <div
                  style={{ width: `${(statusCounts.delivered / totalDonations) * 100}%` }}
                  className="bg-teal-600 transition-all duration-500"
                  title={`Delivered: ${statusCounts.delivered}`}
                />
                <div
                  style={{ width: `${(statusCounts.cancelled / totalDonations) * 100}%` }}
                  className="bg-rose-400 transition-all duration-500"
                  title={`Cancelled: ${statusCounts.cancelled}`}
                />
              </>
            ) : (
              <div className="w-full bg-slate-200" />
            )}
          </div>

          {/* Interactive Legend with filters */}
          <div className="space-y-2 pt-2 text-xs">
            <button
              onClick={() => {
                setActiveTab('donations');
                setDonationStatusFilter(donationStatusFilter === 'available' ? 'all' : 'available');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">Available for Claiming</span>
              </div>
              <span className="font-bold text-slate-900">{statusCounts.available} ({totalDonations ? Math.round((statusCounts.available / totalDonations) * 100) : 0}%)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('donations');
                setDonationStatusFilter(donationStatusFilter === 'requested' ? 'all' : 'requested');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-700">Requested / Awaiting Courier</span>
              </div>
              <span className="font-bold text-slate-900">{statusCounts.requested} ({totalDonations ? Math.round((statusCounts.requested / totalDonations) * 100) : 0}%)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('donations');
                setDonationStatusFilter(donationStatusFilter === 'in_transit' ? 'all' : 'in_transit');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-semibold text-slate-700">In Transit (Courier En Route)</span>
              </div>
              <span className="font-bold text-slate-900">{statusCounts.in_transit} ({totalDonations ? Math.round((statusCounts.in_transit / totalDonations) * 100) : 0}%)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('donations');
                setDonationStatusFilter(donationStatusFilter === 'delivered' ? 'all' : 'delivered');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600" />
                <span className="font-semibold text-slate-700">Delivered & Distributed</span>
              </div>
              <span className="font-bold text-slate-900">{statusCounts.delivered} ({totalDonations ? Math.round((statusCounts.delivered / totalDonations) * 100) : 0}%)</span>
            </button>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Food Category Distribution</h3>
              <p className="text-[11px] text-slate-500">Volume by nutritional category</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {totalVolumeKg.toLocaleString()} kg Total
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(categoryStats).map(([key, item]) => {
              const pct = totalVolumeKg > 0 ? Math.round((item.kg / totalVolumeKg) * 100) : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span className="text-slate-500">{item.kg} kg ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Human Food Safety & Compliance Audit */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Food Safety & Compliance</h3>
              <p className="text-[11px] text-slate-500">Regulatory standards & human inspection</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>100% Certified Human Inspection</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Every food listing on FoodShare AI enforces a mandatory 4-point physical verification
              (temperature, smell, packaging seal, and allergen labeling). AI models assist with priority scoring
              and logistics but never autonomously certify consumable safety.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-bold text-slate-800">Verified Organizations</div>
                  <div className="text-[10px] text-slate-500">Passed Good Samaritan compliance review</div>
                </div>
              </div>
              <div className="font-black text-slate-900">
                {registeredUsers.filter((u) => u.isVerified).length} / {registeredUsers.length}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-teal-600" />
                <div>
                  <div className="font-bold text-slate-800">Atomic Single-Claim Lock</div>
                  <div className="text-[10px] text-slate-500">Firestore transaction prevents double-claiming</div>
                </div>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">
                Enforced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Detailed Records */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('donations')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'donations' || activeTab === 'overview'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Live Firestore Donations ({donations.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            User & NGO Directory ({registeredUsers.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          Database: <code className="text-purple-700 font-mono text-[11px]">ai-studio-797635a1...</code>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'users' ? (
        /* Users and NGO Directory */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email, organization..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium w-full sm:w-auto"
            >
              <option value="all">All Roles</option>
              <option value="donor">Food Donors</option>
              <option value="ngo">NGOs & Charities</option>
              <option value="volunteer">Volunteers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">User & Organization</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Contact Details</th>
                  <th className="py-3 px-3">Capacity / Vehicle</th>
                  <th className="py-3 px-3">Compliance Status</th>
                  <th className="py-3 px-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{user.displayName}</div>
                      <div className="text-[11px] text-slate-500">{user.organization || 'Individual participant'}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'donor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : user.role === 'ngo'
                            ? 'bg-teal-100 text-teal-800'
                            : user.role === 'volunteer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <div>{user.email}</div>
                      <div className="text-[11px] text-slate-400">{user.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {user.capacityKg ? <div>{user.capacityKg} kg cap</div> : null}
                      {user.vehicleType ? <div className="text-[11px] text-slate-400 capitalize">Vehicle: {user.vehicleType}</div> : null}
                      {!user.capacityKg && !user.vehicleType && <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3.5 px-3">
                      {user.isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                          <XCircle className="w-3 h-3 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => toggleUserVerification(user.uid, !user.isVerified)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          user.isVerified
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {user.isVerified ? 'Revoke Verification' : 'Approve & Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Donations Directory */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Controls & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, donor org, NGO, pickup address..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={donationStatusFilter}
                onChange={(e) => setDonationStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="requested">Requested</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium"
              >
                <option value="all">All Categories</option>
                <option value="prepared_meals">Prepared Meals</option>
                <option value="produce">Fresh Produce</option>
                <option value="bakery">Bakery & Grains</option>
                <option value="dairy">Dairy & Eggs</option>
                <option value="canned_goods">Canned & Packaged</option>
                <option value="frozen">Frozen Goods</option>
                <option value="beverages">Beverages</option>
                <option value="other">Other Surplus</option>
              </select>
            </div>
          </div>

          {/* Donations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">Title & Category</th>
                  <th className="py-3 px-3">Donor Organization</th>
                  <th className="py-3 px-3">Weight & Servings</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">AI Priority</th>
                  <th className="py-3 px-3">Claiming NGO / Volunteer</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No donation records matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {d.imageUrl ? (
                            <img
                              src={d.imageUrl}
                              alt={d.title}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                              🥗
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 hover:text-purple-700 cursor-pointer" onClick={() => onSelectDonation(d)}>
                              {d.title}
                            </div>
                            <div className="text-[11px] text-slate-400 capitalize">
                              {d.category?.replace('_', ' ')} • {d.storageCondition?.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{d.donorOrg || d.donorName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{d.pickupAddress}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-emerald-700">
                        <div>{d.quantityKg} kg</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          ~{d.beneficiariesServed || d.estimatedServings} servings
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            d.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'requested'
                              ? 'bg-amber-100 text-amber-800'
                              : d.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : d.status === 'delivered'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.status}
                        </span>
                        {d.collectionStatus && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {d.collectionStatus}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {d.aiPriorityScore ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md ${
                              d.aiPriorityScore >= 80
                                ? 'text-rose-700 bg-rose-50'
                                : d.aiPriorityScore >= 60
                                ? 'text-amber-700 bg-amber-50'
                                : 'text-emerald-700 bg-emerald-50'
                            }`}
                          >
                            {d.aiPriorityScore}/100
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <div>{d.requestedByNgoName || 'Unassigned'}</div>
                        {d.volunteerName && (
                          <div className="text-[10px] text-blue-600 font-medium">🚚 {d.volunteerName}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectDonation(d)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Inspect donation details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteDonation(d.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete donation from Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
