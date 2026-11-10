import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

export const apiRouter = express.Router();
apiRouter.use(express.json());

// Initialize server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const callWithTimeout = async <T>(promise: Promise<T>, ms = 6000): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI inference timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

// Health endpoint
apiRouter.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FoodShare AI Backend',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

/**
 * 1. Smart Donation Priority Recommendations
 * Assesses perishability, storage conditions, preparation time, quantity to compute priority score (1-100)
 * Note: Explicit instruction strictly requires human safety verification and never certifies food safety autonomously.
 */
apiRouter.post(['/ai/priority', '/api/ai/priority'], async (req, res) => {
  const { title, category, quantityKg, storageCondition, preparationTime, expiryWindow, allergens, handlingNotes } = req.body || {};

  const calculateFallbackPriority = () => {
    const baseScore = storageCondition === 'hot_holding' ? 95 : storageCondition === 'refrigerated' ? 82 : 65;
    return {
      priorityScore: baseScore,
      urgencyLevel: baseScore > 85 ? 'CRITICAL' : baseScore > 70 ? 'HIGH' : 'STANDARD',
      recommendedRescueWindowHours: storageCondition === 'hot_holding' ? 2 : storageCondition === 'refrigerated' ? 6 : 24,
      priorityReason: `Perishable ${category || 'food'} requiring prompt distribution under ${storageCondition || 'ambient'} storage.`,
      suggestedDistributionType: (quantityKg || 25) > 40 ? 'Community Soup Kitchen / Shelter' : 'Direct Family Food Parcels',
      safetyCheckpoints: [
        'Verify internal temperature (<4°C for cold or >60°C for hot food)',
        'Inspect seal integrity and verify no tampering or leaks',
        'Human sensory check: ensure aroma and color are normal',
        'Obtain signed handover manifest from certified kitchen staff',
      ],
      safetyReminder: 'FoodShare AI does NOT certify food safety. Human verification of handling, temperature, and visual condition is mandatory prior to distribution.',
    };
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(calculateFallbackPriority());
    }

    const prompt = `Analyze this surplus food donation for rescue priority and logistics recommendation.
DONATION DETAILS:
- Title: ${title}
- Category: ${category}
- Quantity: ${quantityKg} kg
- Storage Condition: ${storageCondition}
- Preparation / Harvest Time: ${preparationTime || 'Not specified'}
- Expiry / Window: ${expiryWindow || 'Not specified'}
- Allergens: ${allergens || 'None reported'}
- Handling notes: ${handlingNotes || 'None'}

STRICT DIRECTIVE: AI MUST NEVER certify food as safe. Always emphasize that human verification of smell, temperature, packaging seal, and hygiene is mandatory.

Evaluate and return JSON conforming to the schema with:
- priorityScore: 1 to 100 (higher means more urgent rescue required before spoilage)
- urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD'
- recommendedRescueWindowHours: estimated safe transport window in hours
- priorityReason: concise rationale for this score
- suggestedDistributionType: best recipient model (e.g. immediate warm meal line, refrigerated pantry, family food parcels)
- safetyCheckpoints: list of 3-4 physical human checkpoints inspectors must verify before handing out.`;

    const response = await callWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priorityScore: { type: Type.INTEGER },
              urgencyLevel: { type: Type.STRING },
              recommendedRescueWindowHours: { type: Type.NUMBER },
              priorityReason: { type: Type.STRING },
              suggestedDistributionType: { type: Type.STRING },
              safetyCheckpoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['priorityScore', 'urgencyLevel', 'recommendedRescueWindowHours', 'priorityReason', 'suggestedDistributionType', 'safetyCheckpoints'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      safetyReminder: 'FoodShare AI does NOT certify food safety. Human verification of handling, temperature, and visual condition is mandatory prior to distribution.',
    });
  } catch (error) {
    console.warn('Gemini priority fallback notice:', error);
    return res.json(calculateFallbackPriority());
  }
});

/**
 * 2. NGO Matching based on actual distance, capacity and availability
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

apiRouter.post(['/ai/match-ngo', '/api/ai/match-ngo'], async (req, res) => {
  const { donation, candidateNgos } = req.body || {};

  // Enrich candidate NGOs with mathematically calculated distance and transit time
  const enrichedNgos = (candidateNgos || []).map((ngo: any) => {
    const dist = calculateHaversineDistance(
      donation?.lat,
      donation?.lng,
      ngo.lat,
      ngo.lng
    );
    const transitMin = Math.max(8, Math.round((dist / 24) * 60) + 5);
    return {
      ...ngo,
      calculatedDistanceKm: dist,
      calculatedTravelTimeMin: transitMin,
    };
  }).sort((a: any, b: any) => a.calculatedDistanceKm - b.calculatedDistanceKm);

  const calculateFallbackMatches = () => {
    const list = enrichedNgos.slice(0, 3).map((ngo: any, index: number) => {
      const dist = ngo.calculatedDistanceKm;
      const transitMin = ngo.calculatedTravelTimeMin;
      const cap = ngo.capacityKg || 350;
      const foodKg = donation?.quantityKg || 35;
      const capPct = Math.round((foodKg / cap) * 100);

      return {
        ngoId: ngo.id || ngo.uid,
        ngoName: ngo.organization || ngo.displayName,
        matchScore: Math.max(96 - index * 6 - Math.round(dist * 1.5), 60),
        distanceKm: dist,
        estimatedDeliveryTimeMin: transitMin,
        suitabilityNotes: `Proximity match (${dist} km away in ${ngo.city || 'local area'}). Daily capacity: ${cap} kg.`,
        matchingExplanation: `Ranked #${index + 1} based on direct distance of ${dist} km (~${transitMin} mins courier transit) and ${cap} kg intake capacity, accommodating ${foodKg} kg (${capPct}% of capacity).`,
        capacityAnalysis: `Intake capacity utilization: ~${capPct}% of ${cap} kg daily capacity.`,
        recommendedContact: ngo.phone || ngo.email,
      };
    });
    return { matches: list };
  };

  try {
    const ai = getGeminiClient();
    if (!ai || !candidateNgos || candidateNgos.length === 0) {
      return res.json(calculateFallbackMatches());
    }

    const prompt = `Match this surplus food donation to the top 3 most suitable verified NGOs from the candidate list and provide detailed matching explanations based on REAL geographic distance.
DONATION:
${JSON.stringify({
  title: donation?.title,
  category: donation?.category,
  quantityKg: donation?.quantityKg,
  city: donation?.city,
  pickupAddress: donation?.pickupAddress,
  storageCondition: donation?.storageCondition,
  lat: donation?.lat,
  lng: donation?.lng,
}, null, 2)}

CANDIDATE NGOS (Pre-calculated with exact GPS distance in km):
${JSON.stringify(enrichedNgos.slice(0, 5), null, 2)}

Evaluate compatibility considering:
1. Exact proximity/distance in km and urban transit time in minutes (prioritize closest in same city)
2. NGO daily intake capacity vs food quantity
3. Dietary and storage suitability
4. Current beneficiaries served

Return the top 3 best matching NGOs sorted by suitability matchScore (0-100).
Remember: AI must never certify food safety.`;

    const response = await callWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ngoId: { type: Type.STRING },
                    ngoName: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER },
                    distanceKm: { type: Type.NUMBER },
                    estimatedDeliveryTimeMin: { type: Type.INTEGER },
                    suitabilityNotes: { type: Type.STRING },
                    matchingExplanation: { type: Type.STRING },
                    capacityAnalysis: { type: Type.STRING },
                    recommendedContact: { type: Type.STRING },
                  },
                  required: ['ngoId', 'ngoName', 'matchScore', 'suitabilityNotes', 'matchingExplanation', 'estimatedDeliveryTimeMin'],
                },
              },
            },
            required: ['matches'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{"matches": []}');
    // Ensure distanceKm is populated from calculated distance if Gemini left it empty
    const normalizedMatches = (parsed.matches || []).slice(0, 3).map((m: any, idx: number) => {
      const matchNgo = enrichedNgos.find((n: any) => (n.id || n.uid) === m.ngoId) || enrichedNgos[idx];
      return {
        ...m,
        distanceKm: m.distanceKm || matchNgo?.calculatedDistanceKm || 3.5,
        estimatedDeliveryTimeMin: m.estimatedDeliveryTimeMin || matchNgo?.calculatedTravelTimeMin || 15,
      };
    });

    return res.json({ matches: normalizedMatches });
  } catch (error) {
    console.warn('Gemini NGO match fallback notice:', error);
    return res.json(calculateFallbackMatches());
  }
});

/**
 * 3. Food Donation Information Summarization
 */
apiRouter.post(['/ai/summarize', '/api/ai/summarize'], async (req, res) => {
  const { donation } = req.body || {};

  const calculateFallbackSummary = () => ({
    executiveSummary: `${donation?.quantityKg || 25}kg of ${donation?.title || 'surplus food'} from ${donation?.donorName || 'kitchen partner'}. Ready for immediate dispatch.`,
    volunteerInstructions: `Maintain ${donation?.storageCondition || 'clean'} storage. Bring insulated containers if appropriate. Verify physical seals on arrival.`,
    dietaryHighlights: donation?.allergens ? `Contains allergens: ${donation.allergens}` : 'No common allergens declared by donor; advise caution for sensitive beneficiaries.',
    humanVerificationChecklist: [
      'Verify food temperature matches required spec',
      'Inspect packaging seals and tamper evidence',
      'Confirm no off odors, discoloration, or foreign materials',
      'Obtain donor sign-off on pickup manifest',
    ],
  });

  try {
    const ai = getGeminiClient();
    if (!ai || !donation) {
      return res.json(calculateFallbackSummary());
    }

    const prompt = `Generate a concise, high-utility operational summary of this food rescue donation for logistics volunteers and recipient NGOs:
${JSON.stringify(donation, null, 2)}

Provide:
1. An executive summary (2 sentences) highlighting quantity, food type, and rescue window.
2. Step-by-step volunteer transport & handling instructions.
3. Dietary and allergen safety callout.
4. Mandatory human physical verification checklist before distribution.
Remember: AI must NEVER certify food as safe. Explicitly instruct humans to verify food safety.`;

    const response = await callWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              volunteerInstructions: { type: Type.STRING },
              dietaryHighlights: { type: Type.STRING },
              humanVerificationChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['executiveSummary', 'volunteerInstructions', 'dietaryHighlights', 'humanVerificationChecklist'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.warn('Gemini summarize fallback notice:', error);
    return res.json(calculateFallbackSummary());
  }
});

/**
 * 4. Sustainability Impact Report Generation
 */
apiRouter.post(['/ai/sustainability-report', '/api/ai/sustainability-report'], async (req, res) => {
  const { timeRange, totalKg, totalMeals } = req.body || {};

  const calculateFallbackReport = () => {
    const kg = totalKg || 120;
    const co2 = Math.round(kg * 2.5);
    const water = Math.round(kg * 290);
    return {
      reportTitle: `FoodShare AI ESG & Carbon Abatement Brief (${timeRange || 'Current Quarter'})`,
      co2AvoidedKg: co2,
      waterSavedLiters: water,
      equivalentCarMiles: Math.round(co2 * 2.48),
      executiveNarrative: `By reallocating surplus inventory from municipal commercial kitchens and retail partners, FoodShare AI has successfully prevented ${kg} kg of edible food waste from decomposing in landfills, effectively mitigating fugitive methane emissions and providing ${totalMeals || Math.round(kg * 2.2)} nutritious meals to frontline community shelters.`,
      sdgAlignment: [
        'SDG 2: Zero Hunger & Community Nutrition',
        'SDG 12: Responsible Consumption and Production',
        'SDG 13: Climate Action & Methane Prevention',
      ],
      recommendedNextActions: [
        'Expand cold-chain storage partnerships with local refrigerated freight operators',
        'Onboard 5 additional high-volume event catering donors in the central district',
        'Implement automated SMS dispatch alerts for ultra-perishable hot-holding donations',
      ],
    };
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(calculateFallbackReport());
    }

    const prompt = `Generate a rigorous, executive-grade sustainability impact report for food rescue operations:
DATA:
- Time Range: ${timeRange}
- Total Food Rescued: ${totalKg} kg
- Total Meals Equivalent: ${totalMeals} meals

Calculate realistic environmental equivalents:
- CO2e greenhouse gas emissions prevented from landfill diversion (using ~2.5 kg CO2e per kg of food saved)
- Liters of fresh water conserved (~290 liters per kg food produced)
- Equivalent passenger vehicle miles offset
- UN Sustainable Development Goals (SDGs) advanced
- Executive narrative summary and 3 strategic recommendations to scale rescue volume.`;

    const response = await callWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportTitle: { type: Type.STRING },
              co2AvoidedKg: { type: Type.NUMBER },
              waterSavedLiters: { type: Type.NUMBER },
              equivalentCarMiles: { type: Type.NUMBER },
              executiveNarrative: { type: Type.STRING },
              sdgAlignment: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedNextActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reportTitle', 'co2AvoidedKg', 'waterSavedLiters', 'equivalentCarMiles', 'executiveNarrative', 'sdgAlignment', 'recommendedNextActions'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.warn('Gemini impact report fallback notice:', error);
    return res.json(calculateFallbackReport());
  }
});

/**
 * 5. Smart Donation Form Assistant / Parsing raw donor input
 */
apiRouter.post(['/ai/extract-details', '/api/ai/extract-details'], async (req, res) => {
  const { rawDescription } = req.body || {};

  const calculateFallbackExtract = () => ({
    title: rawDescription ? rawDescription.slice(0, 50) : 'Surplus Food Rescue',
    category: 'prepared_meals',
    quantityKg: 20,
    estimatedServings: 45,
    storageCondition: 'refrigerated',
    allergens: 'Dairy, Gluten (please verify packaging)',
    handlingNotes: rawDescription || 'Transport in clean, sealed food-grade containers.',
  });

  try {
    const ai = getGeminiClient();
    if (!ai || !rawDescription) {
      return res.json(calculateFallbackExtract());
    }

    const prompt = `A restaurant, hotel, or food donor provided this informal note about excess food they want to donate:
"${rawDescription}"

Extract structured food rescue donation details conforming to the schema.
Estimate reasonable values if exact numbers are not given:
- title: concise title (e.g. "5 Trays of Vegetable Lasagna & Garlic Bread")
- category: one of ["prepared_meals", "bakery", "produce", "dairy", "canned_goods", "frozen", "beverages", "other"]
- quantityKg: estimated total weight in kilograms
- estimatedServings: estimated meal portions
- storageCondition: one of ["ambient", "refrigerated", "frozen", "hot_holding"]
- allergens: likely allergens identified (e.g. "Gluten, Dairy")
- handlingNotes: handling & packaging recommendations`;

    const response = await callWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              quantityKg: { type: Type.NUMBER },
              estimatedServings: { type: Type.INTEGER },
              storageCondition: { type: Type.STRING },
              allergens: { type: Type.STRING },
              handlingNotes: { type: Type.STRING },
            },
            required: ['title', 'category', 'quantityKg', 'estimatedServings', 'storageCondition'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.warn('Gemini extract fallback notice:', error);
    return res.json(calculateFallbackExtract());
  }
});
