import { IndianCity, UserProfile } from '../types';

export const INDIAN_CITIES: IndianCity[] = [
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
    zoom: 13,
    tagline: 'City of Nawabs • Primary Food Rescue Hub',
  },
  {
    id: 'kanpur',
    name: 'Kanpur',
    state: 'Uttar Pradesh',
    lat: 26.4499,
    lng: 80.3319,
    zoom: 13,
    tagline: 'Industrial Hub & Major Relief Network',
  },
  {
    id: 'delhi',
    name: 'Delhi (NCR)',
    state: 'National Capital Territory',
    lat: 28.6139,
    lng: 77.2090,
    zoom: 12,
    tagline: 'Metro Capital Food Redistribution Grid',
  },
  {
    id: 'noida',
    name: 'Noida',
    state: 'Uttar Pradesh',
    lat: 28.5355,
    lng: 77.3910,
    zoom: 13,
    tagline: 'NCR Tech & Event Catering Corridor',
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3176,
    lng: 82.9739,
    zoom: 13,
    tagline: 'Heritage Ghats & Pilgrim Kitchen Support',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    zoom: 12,
    tagline: 'Commercial Capital & Dabbawala Network',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    zoom: 12,
    tagline: 'Tech Hub Corporate Cafeteria Surplus Grid',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9124,
    lng: 75.7873,
    zoom: 13,
    tagline: 'Pink City Royal Wedding & Tourism Redistribution',
  },
];

export const DEFAULT_INDIAN_CITY = INDIAN_CITIES[0]; // Lucknow

/**
 * Calculates Great-Circle Haversine distance in kilometers between two GPS coordinates.
 * Pure mathematical calculation without random numbers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 4.2 km)
}

/**
 * Estimates urban transit travel time in minutes based on distance and typical Indian city traffic speeds.
 * Average speed: 22-26 km/h plus 5 minutes dispatch/docking buffer.
 */
export function estimateTravelTimeMinutes(
  distanceKm: number,
  vehicleType: string = 'two_wheeler'
): number {
  if (distanceKm <= 0) return 10;

  let avgSpeedKmH = 24; // Default urban transit
  if (vehicleType === 'two_wheeler' || vehicleType === 'bicycle') {
    avgSpeedKmH = 22; // nimble in city traffic
  } else if (vehicleType === 'auto') {
    avgSpeedKmH = 20;
  } else if (vehicleType === 'van' || vehicleType === 'car') {
    avgSpeedKmH = 25;
  }

  const travelMins = Math.round((distanceKm / avgSpeedKmH) * 60) + 5;
  return Math.max(8, travelMins);
}

/**
 * Returns formatted distance string (e.g., "3.4 km" or "850 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Finds and sorts NGOs nearest to a given coordinate.
 */
export function getRankedNgosByDistance(
  donorLat: number,
  donorLng: number,
  ngos: UserProfile[],
  requiredCapacityKg?: number
): Array<{
  ngo: UserProfile;
  distanceKm: number;
  travelTimeMin: number;
  matchScore: number;
  reason: string;
}> {
  return ngos
    .filter((ngo) => ngo.role === 'ngo' && ngo.lat && ngo.lng)
    .map((ngo) => {
      const distanceKm = calculateHaversineDistanceKm(donorLat, donorLng, ngo.lat!, ngo.lng!);
      const travelTimeMin = estimateTravelTimeMinutes(distanceKm);

      // Score factors:
      // Distance score: closer is higher (up to 50 pts)
      const distanceScore = Math.max(0, 50 - distanceKm * 2.5);

      // Capacity score: meets requirement (up to 30 pts)
      const ngoCap = ngo.capacityKg || 200;
      const capacityScore =
        requiredCapacityKg && ngoCap >= requiredCapacityKg
          ? 30
          : Math.min(30, Math.round((ngoCap / (requiredCapacityKg || 50)) * 30));

      // Verification bonus: 20 pts
      const verificationScore = ngo.isVerified ? 20 : 10;

      const matchScore = Math.min(99, Math.round(distanceScore + capacityScore + verificationScore));

      let reason = `${distanceKm} km transit (${travelTimeMin} mins). `;
      if (distanceKm < 5) {
        reason += `Immediate localized response radius in ${ngo.city || 'metro area'}. `;
      } else if (distanceKm < 15) {
        reason += `Well within rapid courier dispatch range. `;
      } else {
        reason += `Regional cold-chain or bulk transit corridor. `;
      }
      reason += `Daily intake capacity: ${ngoCap} kg.`;

      return {
        ngo,
        distanceKm,
        travelTimeMin,
        matchScore,
        reason,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
