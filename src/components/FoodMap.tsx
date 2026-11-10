import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FoodDonation, UserProfile } from '../types';
import {
  calculateHaversineDistanceKm,
  estimateTravelTimeMinutes,
  formatDistance,
} from '../lib/geoUtils';

interface FoodMapProps {
  donations?: FoodDonation[];
  donors?: UserProfile[];
  ngos?: UserProfile[];
  volunteers?: UserProfile[];
  selectedDonationId?: string;
  onSelectDonation?: (donation: FoodDonation) => void;
  onSelectUser?: (user: UserProfile) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showRoutes?: boolean;
  filterEntity?: 'all' | 'donations' | 'urgent' | 'ngos' | 'volunteers' | 'donors';
}

export const FoodMap: React.FC<FoodMapProps> = ({
  donations = [],
  donors = [],
  ngos = [],
  volunteers = [],
  selectedDonationId,
  onSelectDonation,
  onSelectUser,
  center = [26.8467, 80.9462], // Lucknow, Uttar Pradesh, India
  zoom = 13,
  height = '480px',
  showRoutes = true,
  filterEntity = 'all',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • FoodShare AI India',
        maxZoom: 19,
      }).addTo(map);

      const routesLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);

      routesLayerRef.current = routesLayer;
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center smoothly when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && center) {
      map.flyTo(center, zoom, {
        duration: 1.2,
      });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Update map markers and routes when dataset or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;
    if (!map || !markersLayer || !routesLayer) return;

    markersLayer.clearLayers();
    routesLayer.clearLayers();

    // 1. Icon Generators with vibrant distinctive colors
    // Food Donation Icon
    const createDonationIcon = (
      status: string,
      urgency?: string,
      isSelected?: boolean
    ) => {
      let bg = '#059669'; // Emerald for available
      let emoji = '🍲';
      let ping = '';

      if (urgency === 'CRITICAL' || urgency === 'HIGH') {
        bg = '#dc2626'; // Red for urgent
        emoji = '🔥';
        ping =
          '<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:#ef4444; opacity:0.4; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>';
      } else if (status === 'in_transit') {
        bg = '#2563eb'; // Blue for in transit
        emoji = '🚚';
      } else if (status === 'requested') {
        bg = '#d97706'; // Amber for claimed
        emoji = '🤝';
      } else if (status === 'delivered') {
        bg = '#475569'; // Slate for delivered
        emoji = '✅';
      }

      const ring = isSelected
        ? 'border: 3px solid #000; box-shadow: 0 0 16px rgba(5,150,105,0.8); transform: scale(1.15);'
        : 'border: 2px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.3);';

      return L.divIcon({
        className: 'custom-food-marker',
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center;">
            ${ping}
            <div style="background-color: ${bg}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 15px; transition: all 0.2s; ${ring}">
              ${emoji}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });
    };

    // Donor Restaurant / Hotel Icon (Orange / Amber)
    const donorIcon = L.divIcon({
      className: 'custom-donor-marker',
      html: `
        <div style="background-color: #ea580c; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; border: 2px solid #fff; box-shadow: 0 2px 7px rgba(234,88,12,0.4);">
          🏨
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    // NGO Hub Icon (Teal / Forest Green)
    const ngoIcon = L.divIcon({
      className: 'custom-ngo-marker',
      html: `
        <div style="background-color: #0d9488; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; border: 2px solid #fff; box-shadow: 0 2px 7px rgba(13,148,136,0.4);">
          🏢
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    // Volunteer Courier Icon (Royal Blue)
    const volunteerIcon = L.divIcon({
      className: 'custom-volunteer-marker',
      html: `
        <div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; border: 2px solid #fff; box-shadow: 0 2px 7px rgba(59,130,246,0.4);">
          🛵
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });

    // 2. Add NGO Hubs
    if (filterEntity === 'all' || filterEntity === 'ngos') {
      ngos.forEach((ngo) => {
        if (ngo.lat && ngo.lng) {
          const marker = L.marker([ngo.lat, ngo.lng], { icon: ngoIcon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="background:#ccfbf1; color:#0f766e; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">
                  Verified Relief NGO
                </span>
                <span style="font-size:10px; color:#64748b;">${ngo.city || 'India'}</span>
              </div>
              <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${ngo.organization || ngo.displayName}</div>
              <div style="font-size: 12px; color: #0d9488; font-weight: 600; margin-top: 3px;">
                Daily Intake Capacity: ${ngo.capacityKg || 350} kg
              </div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">
                📍 ${ngo.address || 'Central Relief Kitchen'}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                📞 ${ngo.phone || '+91 98765 00000'}
              </div>
            </div>
          `);

          marker.on('click', () => {
            if (onSelectUser) onSelectUser(ngo);
          });

          markersLayer.addLayer(marker);
        }
      });
    }

    // 3. Add Donor Kitchens/Venues
    if (filterEntity === 'all' || filterEntity === 'donors') {
      donors.forEach((donor) => {
        if (donor.lat && donor.lng) {
          const marker = L.marker([donor.lat, donor.lng], { icon: donorIcon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 210px; padding: 4px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="background:#ffedd5; color:#c2410c; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">
                  Food Donor Partner
                </span>
                <span style="font-size:10px; color:#64748b;">${donor.city || 'India'}</span>
              </div>
              <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${donor.organization || donor.displayName}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">
                📍 ${donor.address || 'Kitchen & Banquet Facility'}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                📞 ${donor.phone || '+91 98765 00000'}
              </div>
            </div>
          `);

          marker.on('click', () => {
            if (onSelectUser) onSelectUser(donor);
          });

          markersLayer.addLayer(marker);
        }
      });
    }

    // 4. Add Volunteers
    if (filterEntity === 'all' || filterEntity === 'volunteers') {
      volunteers.forEach((v) => {
        if (v.lat && v.lng) {
          const marker = L.marker([v.lat, v.lng], { icon: volunteerIcon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="background:#dbeafe; color:#1d4ed8; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">
                  Volunteer Courier
                </span>
                <span style="font-size:10px; color:#64748b;">${v.city || 'India'}</span>
              </div>
              <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${v.displayName}</div>
              <div style="font-size: 12px; color: #2563eb; font-weight: 600; margin-top: 2px; text-transform: capitalize;">
                Vehicle: ${v.vehicleType?.replace('_', ' ') || 'Two Wheeler'}
              </div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">
                Active Rescues: ${v.assignedTasksCount || 1} missions
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                📞 ${v.phone || '+91 98765 00000'}
              </div>
            </div>
          `);

          marker.on('click', () => {
            if (onSelectUser) onSelectUser(v);
          });

          markersLayer.addLayer(marker);
        }
      });
    }

    // 5. Add Donations
    const visibleDonations = donations.filter((d) => {
      if (filterEntity === 'urgent') {
        return d.aiUrgencyLevel === 'CRITICAL' || d.aiUrgencyLevel === 'HIGH';
      }
      if (filterEntity === 'donations') {
        return d.status === 'available';
      }
      return true;
    });

    visibleDonations.forEach((donation) => {
      if (donation.lat && donation.lng) {
        const isSelected = donation.id === selectedDonationId;
        const icon = createDonationIcon(
          donation.status,
          donation.aiUrgencyLevel,
          isSelected
        );
        const marker = L.marker([donation.lat, donation.lng], { icon });

        marker.on('click', () => {
          if (onSelectDonation) {
            onSelectDonation(donation);
          }
        });

        const statusBadge =
          donation.status === 'available'
            ? '<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">Available</span>'
            : donation.status === 'requested'
            ? '<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">Claimed by NGO</span>'
            : donation.status === 'in_transit'
            ? '<span style="background:#dbeafe; color:#1d4ed8; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">In Transit</span>'
            : '<span style="background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">Delivered</span>';

        const urgencyBadge =
          donation.aiUrgencyLevel === 'CRITICAL'
            ? '<span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:8px; font-size:10px; font-weight:800;">🔥 CRITICAL URGENCY</span>'
            : donation.aiUrgencyLevel === 'HIGH'
            ? '<span style="background:#ffedd5; color:#c2410c; padding:2px 6px; border-radius:8px; font-size:10px; font-weight:700;">⚡ HIGH PRIORITY</span>'
            : '';

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 240px; padding: 4px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom: 6px;">
              ${statusBadge}
              ${urgencyBadge}
            </div>
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; line-height: 1.3;">${donation.title}</div>
            
            <div style="display:flex; items-center; justify-content:space-between; margin-top: 6px; padding: 4px 6px; background: #f8fafc; border-radius: 6px; font-size: 11px;">
              <span style="color:#059669; font-weight:700;">⚖️ ${donation.quantityKg} kg</span>
              <span style="color:#475569;">🍽️ ~${donation.estimatedServings} meals</span>
              <span style="color:#64748b; text-transform:capitalize;">${donation.storageCondition.replace('_', ' ')}</span>
            </div>

            <div style="font-size: 11px; color: #334155; margin-top: 6px;">
              <strong>Donor:</strong> ${donation.donorOrg || donation.donorName}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              📍 ${donation.pickupAddress}
            </div>

            ${
              donation.pickupDeadline
                ? `
              <div style="font-size: 11px; color: #b45309; font-weight:600; margin-top: 4px;">
                ⏰ Pickup by: ${donation.pickupDeadline}
              </div>
            `
                : ''
            }

            ${
              donation.aiPriorityScore
                ? `
              <div style="font-size: 11px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 6px; border-radius: 6px; margin-top: 6px; color: #065f46;">
                ✨ AI Priority: <strong>${donation.aiPriorityScore}/100</strong>
              </div>
            `
                : ''
            }
          </div>
        `);

        markersLayer.addLayer(marker);

        // 6. Draw Route Polyline if donation is selected or claimed/in_transit
        if (showRoutes && (isSelected || donation.status === 'in_transit' || donation.status === 'requested')) {
          // Find target NGO
          let targetNgo = ngos.find((n) => n.uid === donation.requestedByNgoId);
          if (!targetNgo && ngos.length > 0) {
            // Find nearest NGO mathematically
            let minDist = Infinity;
            ngos.forEach((n) => {
              if (n.lat && n.lng) {
                const dist = calculateHaversineDistanceKm(donation.lat, donation.lng, n.lat, n.lng);
                if (dist < minDist) {
                  minDist = dist;
                  targetNgo = n;
                }
              }
            });
          }

          if (targetNgo && targetNgo.lat && targetNgo.lng) {
            const distanceKm = calculateHaversineDistanceKm(
              donation.lat,
              donation.lng,
              targetNgo.lat,
              targetNgo.lng
            );
            const travelMins = estimateTravelTimeMinutes(distanceKm);

            const isSelectedDonation = isSelected;
            const lineColor = isSelectedDonation ? '#059669' : '#3b82f6';
            const lineWeight = isSelectedDonation ? 4 : 3;

            const routeLine = L.polyline(
              [
                [donation.lat, donation.lng],
                [targetNgo.lat, targetNgo.lng],
              ],
              {
                color: lineColor,
                weight: lineWeight,
                opacity: 0.85,
                dashArray: '6, 8',
              }
            );

            // Midpoint marker tooltip
            const midLat = (donation.lat + targetNgo.lat) / 2;
            const midLng = (donation.lng + targetNgo.lng) / 2;

            const routeTooltip = L.tooltip({
              permanent: isSelectedDonation,
              direction: 'center',
              className: 'custom-route-tooltip',
            })
              .setLatLng([midLat, midLng])
              .setContent(`
                <div style="background: rgba(15,23,42,0.92); color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">
                  🚗 ${formatDistance(distanceKm)} (~${travelMins} mins)
                </div>
              `);

            routesLayer.addLayer(routeLine);
            routesLayer.addLayer(routeTooltip);
          }
        }
      }
    });
  }, [donations, donors, ngos, volunteers, selectedDonationId, showRoutes, filterEntity]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-10" />

      {/* Map Interactive Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 max-w-[280px]">
        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-100">
          <span>Redistribution Map Legend</span>
          <span className="text-[10px] text-emerald-600 font-extrabold">OpenStreetMap</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
            <span>Available Food</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
            <span>Urgent Rescue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-teal-600 shrink-0"></span>
            <span>Relief NGO Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-orange-600 shrink-0"></span>
            <span>Donor Kitchen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
            <span>Courier Fleet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-600 shrink-0"></span>
            <span>Transit Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};
