import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Scale,
  Utensils,
  Thermometer,
  Check,
  CheckCircle2,
  Info,
  Loader2,
  FileText,
  Image as ImageIcon,
  Upload,
  Camera,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { FoodCategory, StorageCondition } from '../types';

interface DonationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PRESET_FOOD_PHOTOS = [
  {
    label: 'Prepared Banquet',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    category: 'prepared_meals' as FoodCategory,
  },
  {
    label: 'Fresh Bakery',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    category: 'bakery' as FoodCategory,
  },
  {
    label: 'Fresh Produce',
    url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
    category: 'produce' as FoodCategory,
  },
  {
    label: 'Dairy & Milk',
    url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
    category: 'dairy' as FoodCategory,
  },
  {
    label: 'Hot Soup / Stew',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    category: 'prepared_meals' as FoodCategory,
  },
];

export const DonationForm: React.FC<DonationFormProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { createDonation } = useDonations();

  // Smart assistant raw input
  const [magicPrompt, setMagicPrompt] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<FoodCategory>('prepared_meals');
  const [quantityKg, setQuantityKg] = useState<number>(25);
  const [estimatedServings, setEstimatedServings] = useState<number>(50);
  const [storageCondition, setStorageCondition] = useState<StorageCondition>('refrigerated');
  const [preparationTime, setPreparationTime] = useState<string>('Prepared today, 1:30 PM');
  const [expiryWindow, setExpiryWindow] = useState<string>('Must be refrigerated or consumed within 4 hours');
  const [pickupDeadline, setPickupDeadline] = useState<string>(() => {
    const d = new Date(Date.now() + 5 * 3600000);
    return d.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm
  });
  const [allergens, setAllergens] = useState<string>('Contains Dairy, Gluten (all containers labeled)');
  const [pickupAddress, setPickupAddress] = useState<string>(
    currentUser?.address || '4 Shah Najaf Road, Hazratganj, Lucknow, UP 226001'
  );
  const [city, setCity] = useState<string>(currentUser?.city || 'Lucknow');
  const [pinCode, setPinCode] = useState<string>(currentUser?.pinCode || '226001');
  const [imageUrl, setImageUrl] = useState<string>(PRESET_FOOD_PHOTOS[0].url);
  const [lat, setLat] = useState<number>(currentUser?.lat || 26.8500);
  const [lng, setLng] = useState<number>(currentUser?.lng || 80.9462);
  const [humanVerifierName, setHumanVerifierName] = useState<string>(
    currentUser?.displayName ? `${currentUser.displayName} (FSSAI Certified Handler)` : 'Sous Chef / Food Hygiene Lead'
  );

  // Mandatory Safety Checkpoints
  const [checkTemp, setCheckTemp] = useState<boolean>(false);
  const [checkPackaging, setCheckPackaging] = useState<boolean>(false);
  const [checkSensory, setCheckSensory] = useState<boolean>(false);
  const [checkLiability, setCheckLiability] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSafetyVerified = checkTemp && checkPackaging && checkSensory && checkLiability;

  // Handle local image upload via file reader
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Please upload an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // AI Magic Auto-Fill
  const handleMagicExtract = async () => {
    if (!magicPrompt.trim()) return;

    try {
      setIsExtracting(true);
      setExtractError(null);

      const res = await fetch('/api/ai/extract-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDescription: magicPrompt }),
      });

      if (!res.ok) throw new Error('AI parser service returned an error');
      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.category) setCategory(data.category as FoodCategory);
      if (data.quantityKg) setQuantityKg(Number(data.quantityKg));
      if (data.estimatedServings) setEstimatedServings(Number(data.estimatedServings));
      if (data.storageCondition) setStorageCondition(data.storageCondition as StorageCondition);
      if (data.allergens) setAllergens(data.allergens);
      if (data.handlingNotes) setHandlingNotes(data.handlingNotes);
      setDescription(magicPrompt);

      // Match preset photo if available
      const photoMatch = PRESET_FOOD_PHOTOS.find((p) => p.category === data.category);
      if (photoMatch) {
        setImageUrl(photoMatch.url);
      }
    } catch (err) {
      console.warn('AI Extraction notice:', err);
      setExtractError('Could not auto-fill all fields. You can still fill out the form manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError('Please enter a descriptive food donation title.');
      return;
    }

    if (!isSafetyVerified) {
      setSubmitError('Safety verification checklist must be completely checked by a human inspector.');
      return;
    }

    try {
      setSubmitting(true);
      await createDonation({
        title,
        description: description || title,
        category,
        quantityKg: Number(quantityKg),
        estimatedServings: Number(estimatedServings),
        donorId: currentUser?.uid || 'guest-donor',
        donorName: currentUser?.displayName || 'Anonymous Donor',
        donorOrg: currentUser?.organization || 'Food Donor',
        donorPhone: currentUser?.phone || '',
        pickupAddress,
        city,
        pinCode,
        pickupDeadline,
        imageUrl,
        lat,
        lng,
        storageCondition,
        preparationTime,
        expiryWindow,
        allergens,
        handlingNotes,
        safetyVerificationCompleted: true,
        humanVerifierName,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create donation:', err);
      setSubmitError(err instanceof Error ? err.message : 'An error occurred while creating donation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">List Surplus Food Donation</h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                Post excess edible food for immediate rescue by local certified NGOs and volunteer couriers
              </p>
            </div>
          </div>
        </div>

        {/* AI Quick Fill Card */}
        <div className="p-6 bg-emerald-50/50 border-b border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              AI Smart Fill Assistant (Gemini 3.8)
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Have a catering manifest, chef note, or quick list? Paste it below and Gemini will automatically extract portions, temperatures, and allergen tags.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={magicPrompt}
              onChange={(e) => setMagicPrompt(e.target.value)}
              placeholder="e.g. 5 Hotel pans of roast chicken and buttered potatoes from 1 PM lunch banquet, kept warm in Cambros"
              className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleMagicExtract}
              disabled={isExtracting || !magicPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing Food Manifest...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fill Form</span>
                </>
              )}
            </button>
          </div>
          {extractError && (
            <div className="mt-2 text-xs text-rose-600">{extractError}</div>
          )}
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {submitError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section 1: Food Image Upload & Visual Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>1. Food Photo & Imagery</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Image Preview */}
              <div className="md:col-span-5 relative rounded-2xl overflow-hidden border border-slate-200 aspect-video md:aspect-4/3 bg-slate-100 flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Food donation preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400 text-xs space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                    <span>No image selected</span>
                  </div>
                )}
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Controls & Presets */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">or pick high-res preset:</span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FOOD_PHOTOS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setImageUrl(p.url);
                        setCategory(p.category);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        imageUrl === p.url
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Food Overview */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>2. Quantity & Category</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Donation Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 5 Hotel Pans of Gourmet Vegetable Lasagna & Garlic Bread"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="prepared_meals">Prepared Meals / Buffet</option>
                  <option value="bakery">Bakery & Bread</option>
                  <option value="produce">Fresh Produce / Fruits</option>
                  <option value="dairy">Dairy & Milk</option>
                  <option value="canned_goods">Canned & Non-Perishable</option>
                  <option value="frozen">Frozen Goods</option>
                  <option value="beverages">Beverages & Juice</option>
                  <option value="other">Other Edible Food</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Weight (kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">kg</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Portions / Servings *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={estimatedServings}
                    onChange={(e) => setEstimatedServings(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-12 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">meals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Preparation, Expiry & Pickup Deadline */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Timing, Storage & Pickup Deadline
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Condition *
                </label>
                <select
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ambient">Ambient / Room Temp</option>
                  <option value="refrigerated">Refrigerated (under 4°C)</option>
                  <option value="frozen">Frozen (under -18°C)</option>
                  <option value="hot_holding">Hot Holding (above 60°C)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preparation / Cook Time *
                </label>
                <input
                  type="text"
                  required
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                  placeholder="e.g. Prepared today, 1:30 PM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Deadline (Date & Time) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDeadline}
                  onChange={(e) => setPickupDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Use-By / Expiry Safe Window *
                </label>
                <input
                  type="text"
                  required
                  value={expiryWindow}
                  onChange={(e) => setExpiryWindow(e.target.value)}
                  placeholder="e.g. Must be consumed within 4 hours"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allergen Declarations & Warnings
                </label>
                <input
                  type="text"
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  placeholder="e.g. Contains Dairy, Gluten, Peanuts"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage & Handling Instructions
              </label>
              <input
                type="text"
                value={handlingNotes}
                onChange={(e) => setHandlingNotes(e.target.value)}
                placeholder="e.g. Packaged in sealed food-grade thermal Cambro containers, bring rolling dolly"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 4: Location & Human Verifier */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Pickup Location & Certified Human Verifier
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Street Address & Instructions *
                </label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. 109 E 42nd St, New York, NY (Loading Dock 4, ring bell)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Human Inspector Name *
                </label>
                <input
                  type="text"
                  required
                  value={humanVerifierName}
                  onChange={(e) => setHumanVerifierName(e.target.value)}
                  placeholder="e.g. Chef Marco (ServSafe Certified)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: MANDATORY SAFETY VERIFICATION CHECKLIST */}
          <div className="p-6 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-950">
                    Mandatory Human Food Safety Inspection
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    Legal Compliance
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  <strong>Strict Policy:</strong> FoodShare AI must NEVER certify food as safe. Food handling, storage, preparation details and human physical verification are mandatory before distribution.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 text-xs text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkTemp}
                  onChange={(e) => setCheckTemp(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-sm border-amber-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>
                  <strong>Temperature Control:</strong> Food has been prepared in a licensed commercial kitchen or compliant facility and held continuously at safe regulatory temperatures (&lt;4°C cold or &gt;60°C hot).
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkPackaging}
                  onChange={(e) => setCheckPackaging(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-sm border-amber-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>
                  <strong>Sanitary Packaging:</strong> All items are packaged in clean, food-grade containers sealed against foreign contaminants, leaks, or cross-contact.
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkSensory}
                  onChange={(e) => setCheckSensory(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-sm border-amber-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>
                  <strong>Sensory & Quality Check:</strong> A human staff member has visually and olfactorily inspected the food and verified no signs of off-odor, spoilage, or compromise.
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkLiability}
                  onChange={(e) => setCheckLiability(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-sm border-amber-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>
                  <strong>Good Samaritan Protection & Human Verification:</strong> I confirm human inspection has occurred and acknowledge that FoodShare AI does not autonomously certify food safety.
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            ) : <div />}

            <button
              type="submit"
              disabled={submitting || !isSafetyVerified}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing AI Urgency & Publishing to Firestore...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Publish Food Rescue Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
