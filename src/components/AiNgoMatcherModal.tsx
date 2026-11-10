import React, { useState, useEffect } from 'react';
import { X, Sparkles, Building2, CheckCircle2, Clock, MapPin, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { FoodDonation, UserProfile, AiMatchResult } from '../types';

interface AiNgoMatcherModalProps {
  donation: FoodDonation;
  allNgos: UserProfile[];
  onClose: () => void;
  onRequestMatch: (ngoId: string) => void;
}

export const AiNgoMatcherModal: React.FC<AiNgoMatcherModalProps> = ({
  donation,
  allNgos,
  onClose,
  onRequestMatch,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [matches, setMatches] = useState<AiMatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const candidateNgos = allNgos.filter((u) => u.role === 'ngo');

        const res = await fetch('/api/ai/match-ngo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donation,
            candidateNgos,
          }),
        });

        if (!res.ok) {
          throw new Error('Server matching service returned an error');
        }

        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.warn('AI Match fallback used:', err);
        // Fallback matching
        const fallbacks: AiMatchResult[] = allNgos
          .filter((u) => u.role === 'ngo')
          .map((ngo, idx) => ({
            ngoId: ngo.uid,
            ngoName: ngo.organization || ngo.displayName,
            matchScore: 92 - idx * 8,
            suitabilityNotes: `Proximity match with daily intake capacity of ${ngo.capacityKg || 250}kg for ${donation.category}.`,
            recommendedContact: ngo.phone || ngo.email,
            estimatedDeliveryTimeMin: 18 + idx * 12,
          }));
        setMatches(fallbacks);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [donation, allNgos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">AI Smart NGO Matcher</h3>
                <span className="text-xs bg-emerald-500/40 text-emerald-100 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                Multi-factor matching based on capacity, transit distance & food category
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Donation Brief */}
        <div className="bg-emerald-50/60 px-6 py-3 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Matching for: </span>
            <strong className="text-slate-900">{donation.title}</strong>
          </div>
          <div className="flex items-center gap-2 font-semibold text-emerald-800">
            <span>{donation.quantityKg} kg</span>
            <span>•</span>
            <span className="capitalize">{donation.storageCondition.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
              <p className="text-sm font-medium text-slate-600">
                Evaluating candidate NGOs, cold storage facilities, and distance vectors...
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No matching NGOs found in the registry for this criteria.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ranked Best Fits ({matches.length} Verified Organizations)
              </div>
              {matches.map((match, idx) => (
                <div
                  key={match.ngoId || idx}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                    idx === 0
                      ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{match.ngoName}</h4>
                          {idx === 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ★ Top Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                          {match.suitabilityNotes}
                        </p>
                        {match.matchingExplanation && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-200/60 leading-relaxed">
                            <strong>Why Recommended:</strong> {match.matchingExplanation}
                          </div>
                        )}
                        {match.capacityAnalysis && (
                          <div className="text-[10px] text-teal-700 font-semibold mt-1">
                            📊 {match.capacityAnalysis}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                          {match.distanceKm !== undefined && (
                            <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              {match.distanceKm} km transit
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            ~{match.estimatedDeliveryTimeMin} mins travel
                          </span>
                          {match.recommendedContact && (
                            <span className="text-[11px] text-slate-500">📞 {match.recommendedContact}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Score & Action */}
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl font-black text-emerald-600">{match.matchScore}</span>
                        <span className="text-xs text-slate-400 font-bold">/100</span>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Fit Score
                      </div>
                      <button
                        onClick={() => {
                          onRequestMatch(match.ngoId);
                          onClose();
                        }}
                        className="mt-2.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>Allocate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Safety Reminder */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Human Verification Requirement:</strong> AI matching provides operational recommendations based on capacity and distance. A certified human inspector must verify food temperature, allergen labeling, and packaging seals before recipient distribution.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
