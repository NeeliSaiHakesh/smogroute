'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { CleanGetawaySpot, HazardPin, RouteComparisonResult, SensorStation } from '@/types';

interface MapViewProps {
  comparison: RouteComparisonResult | null;
  selectedRouteTab: 'clean' | 'fast';
  hazards: HazardPin[];
  sensorStations: SensorStation[];
  cleanGetaways?: CleanGetawaySpot[];
  showGetaways?: boolean;
  onSelectGetawaySpot?: (spot: CleanGetawaySpot) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  isPickingLocation?: boolean;
}

// Compute bearing angle in degrees between two coordinates (lat, lng)
function computeBearing(c1: [number, number], c2: [number, number]): number {
  const dLat = c2[0] - c1[0];
  const dLng = c2[1] - c1[1];
  const rad = Math.atan2(dLng, dLat);
  return (rad * 180) / Math.PI;
}

export default function MapView({
  comparison,
  selectedRouteTab,
  hazards,
  sensorStations,
  cleanGetaways = [],
  showGetaways = false,
  onSelectGetawaySpot,
  onMapClick,
  isPickingLocation,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeBoundsRef = useRef<L.LatLngBounds | null>(null);

  // Initialize Leaflet Map with standard OpenStreetMap tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.745, 77.12],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    // Standard OpenStreetMap tiles - watermark-free and completely keyless
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Zoom controls on right side
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: +e.latlng.lat.toFixed(4), lng: +e.latlng.lng.toFixed(4) });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMapClick]);

  // Google Maps-style Re-fit Route function
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    const bounds = routeBoundsRef.current;
    if (!map || !bounds || !bounds.isValid()) return;

    // Google Maps padding rules:
    // Reserve 120px at the top (under floating search & mode pills)
    // Reserve 240px at the bottom (above floating comparison cards)
    // Reserve 50px on sides for comfortable breathing room
    map.flyToBounds(bounds, {
      paddingTopLeft: [50, 120],
      paddingBottomRight: [50, 240],
      maxZoom: 16,
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, []);

  // Update Routes, Directional Arrows, and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (!comparison) return;

    // CRITICAL: Bounds are calculated EXCLUSIVELY from the active route coordinates!
    // Never extend bounds with far-away sensors or hazards across other cities.
    const routeBounds = L.latLngBounds([]);
    routeBounds.extend(comparison.originCoords);
    routeBounds.extend(comparison.destinationCoords);

    // 1. FAST ROUTE (Grey / Coral)
    const fastCoords = comparison.fastRoute.path.map((p) => [p[0], p[1]] as [number, number]);
    const isFastActive = selectedRouteTab === 'fast';

    const fastLine = L.polyline(fastCoords, {
      color: isFastActive ? '#E11D48' : '#9CA3AF',
      weight: isFastActive ? 5.5 : 3.5,
      opacity: isFastActive ? 0.95 : 0.6,
      dashArray: isFastActive ? undefined : '6, 8',
      lineCap: 'round',
      lineJoin: 'round',
    });

    fastLine.bindTooltip(
      `<div style="font-family: inherit; font-size: 11px; font-weight: 500; color: #E11D48; background: #FFFFFF; padding: 4px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border: 1px solid #E5E7EB;">
        Fast Route · ${comparison.fastRoute.avgAqi} AQI (Arterial Corridor)
      </div>`,
      { sticky: true }
    );
    layerGroup.addLayer(fastLine);
    fastCoords.forEach((c) => routeBounds.extend(c));

    // 2. CLEAN ROUTE (Green / Emerald)
    const cleanCoords = comparison.cleanRoute.path.map((p) => [p[0], p[1]] as [number, number]);
    const isCleanActive = selectedRouteTab === 'clean';

    // Ambient glow layer for clean route when selected
    if (isCleanActive) {
      const cleanGlow = L.polyline(cleanCoords, {
        color: '#10B981',
        weight: 12,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layerGroup.addLayer(cleanGlow);
    }

    const cleanLine = L.polyline(cleanCoords, {
      color: '#059669',
      weight: isCleanActive ? 6 : 4,
      opacity: isCleanActive ? 1.0 : 0.65,
      lineCap: 'round',
      lineJoin: 'round',
    });

    cleanLine.bindTooltip(
      `<div style="font-family: inherit; font-size: 11px; font-weight: 500; color: #059669; background: #FFFFFF; padding: 4px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border: 1px solid #E5E7EB;">
        Clean Route · ${comparison.cleanRoute.avgAqi} AQI (-${comparison.particulateReductionPercent}% PM2.5)
      </div>`,
      { sticky: true }
    );
    layerGroup.addLayer(cleanLine);
    cleanCoords.forEach((c) => routeBounds.extend(c));

    // 3. GOOGLE MAPS DIRECTIONAL ARROWHEADS ALONG ACTIVE ROUTE
    const activeCoords = isCleanActive ? cleanCoords : fastCoords;
    const arrowColor = isCleanActive ? '#059669' : '#E11D48';

    for (let i = 0; i < activeCoords.length - 1; i++) {
      const p1 = activeCoords[i];
      const p2 = activeCoords[i + 1];
      const midLat = (p1[0] + p2[0]) / 2;
      const midLng = (p1[1] + p2[1]) / 2;
      const bearing = computeBearing(p1, p2);

      const arrowIcon = L.divIcon({
        className: 'route-directional-arrow',
        html: `
          <div style="transform: rotate(${bearing}deg); width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="${arrowColor}" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));">
              <path d="M12 2L21 21L12 17L3 21L12 2Z" />
            </svg>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const arrowMarker = L.marker([midLat, midLng], {
        icon: arrowIcon,
        interactive: false,
      });
      layerGroup.addLayer(arrowMarker);
    }

    // 4. GOOGLE MAPS-STYLE START & DESTINATION MARKERS
    // START / ORIGIN MARKER
    const startIcon = L.divIcon({
      className: 'gmaps-start-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #2563EB; color: #FFFFFF; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(37,99,235,0.4); border: 1.5px solid #FFFFFF; white-space: nowrap; margin-bottom: 2px;">
            START
          </div>
          <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(37, 99, 235, 0.2); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.25);"></div>
          </div>
        </div>
      `,
      iconSize: [46, 42],
      iconAnchor: [23, 40],
    });

    const startMarker = L.marker(comparison.originCoords, { icon: startIcon, zIndexOffset: 1000 });
    startMarker.bindPopup(`
      <div style="padding: 10px 12px; font-family: inherit;">
        <div style="color: #2563EB; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Origin / Start</div>
        <div style="color: #111827; font-weight: 500; font-size: 12px;">${comparison.originName}</div>
      </div>
    `);
    layerGroup.addLayer(startMarker);

    // DESTINATION MARKER
    const destIcon = L.divIcon({
      className: 'gmaps-dest-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #059669; color: #FFFFFF; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(5,150,105,0.4); border: 1.5px solid #FFFFFF; white-space: nowrap; margin-bottom: 2px;">
            DESTINATION
          </div>
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(16, 185, 129, 0.25);"></div>
            <div style="width: 15px; height: 15px; border-radius: 50%; background: #059669; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 5px; height: 5px; border-radius: 50%; background: #FFFFFF;"></div>
            </div>
          </div>
        </div>
      `,
      iconSize: [78, 44],
      iconAnchor: [39, 42],
    });

    const destMarker = L.marker(comparison.destinationCoords, { icon: destIcon, zIndexOffset: 1000 });
    destMarker.bindPopup(`
      <div style="padding: 10px 12px; font-family: inherit;">
        <div style="color: #059669; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Destination / End</div>
        <div style="color: #111827; font-weight: 500; font-size: 12px;">${comparison.destinationName}</div>
      </div>
    `);
    layerGroup.addLayer(destMarker);

    // 5. LOCAL HAZARD PINS (Only render if in proximity of route)
    hazards.forEach((hazard) => {
      // Proximity check: only show if within ~20km of the route center
      const centerLat = (comparison.originCoords[0] + comparison.destinationCoords[0]) / 2;
      const centerLng = (comparison.originCoords[1] + comparison.destinationCoords[1]) / 2;
      const distToCenter =
        Math.hypot(hazard.coordinates.lat - centerLat, hazard.coordinates.lng - centerLng) * 111; // ~km

      if (distToCenter > 30) return; // Skip far-away hazards in other states

      const hazardColor =
        hazard.hazard_type === 'Garbage Burning'
          ? '#DC2626'
          : hazard.hazard_type === 'Construction Dust'
          ? '#D97706'
          : '#EA580C';

      const hazardIcon = L.divIcon({
        className: 'custom-hazard-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 24px; height: 24px; border-radius: 7px; background: #FFFFFF; border: 1.5px solid ${hazardColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${hazardColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const hazardMarker = L.marker([hazard.coordinates.lat, hazard.coordinates.lng], {
        icon: hazardIcon,
      });

      hazardMarker.bindPopup(`
        <div style="padding: 10px 12px; font-family: inherit; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: ${hazardColor}; font-weight: 500; font-size: 12px;">${hazard.hazard_type}</span>
            <span style="font-size: 9px; font-weight: 500; padding: 1px 5px; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; border-radius: 4px;">VERIFIED</span>
          </div>
          <div style="color: #4B5563; font-size: 11px; margin-bottom: 6px;">${hazard.location_name}</div>
          <div style="font-size: 10px; color: #6B7280; border-top: 1px solid #F3F4F6; padding-top: 5px;">
            <div>Rekognition Confidence: <strong style="color: #111827;">${hazard.rekognition_confidence}%</strong></div>
          </div>
        </div>
      `);
      layerGroup.addLayer(hazardMarker);
    });

    // 6. LOCAL CPCB SENSORS (Only render if in proximity of route)
    sensorStations.forEach((station) => {
      const centerLat = (comparison.originCoords[0] + comparison.destinationCoords[0]) / 2;
      const centerLng = (comparison.originCoords[1] + comparison.destinationCoords[1]) / 2;
      const distToCenter = Math.hypot(station.lat - centerLat, station.lng - centerLng) * 111;

      if (distToCenter > 30) return; // Skip far-away sensors in other cities

      const stationAqiColor =
        station.aqi <= 100 ? '#059669' : station.aqi <= 200 ? '#D97706' : '#DC2626';

      const sensorIcon = L.divIcon({
        className: 'custom-sensor-marker',
        html: `
          <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-left: 3px solid ${stationAqiColor}; border-radius: 4px; padding: 2px 5px; font-size: 10px; color: #111827; font-weight: 500; box-shadow: 0 1px 4px rgba(0,0,0,0.08); white-space: nowrap;">
            ${station.aqi} AQI
          </div>
        `,
        iconSize: [52, 20],
        iconAnchor: [26, 10],
      });

      const sensorMarker = L.marker([station.lat, station.lng], { icon: sensorIcon });
      sensorMarker.bindPopup(`
        <div style="padding: 10px 12px; font-family: inherit; min-width: 170px;">
          <div style="color: #6B7280; font-size: 9px; text-transform: uppercase;">Sensor Station</div>
          <div style="font-weight: 500; font-size: 12px; margin-bottom: 4px; color: #111827;">${station.name}</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #4B5563;">
            <span>AQI: <strong style="color: ${stationAqiColor};">${station.aqi}</strong></span>
            <span>PM2.5: ${station.pm25} µg/m³</span>
          </div>
        </div>
      `);
      layerGroup.addLayer(sensorMarker);
    });

    // 7. CLEAN GETAWAYS & HOLIDAY SPOTS (Render if enabled)
    if (showGetaways && cleanGetaways && cleanGetaways.length > 0) {
      cleanGetaways.forEach((spot) => {
        const centerLat = (comparison.originCoords[0] + comparison.destinationCoords[0]) / 2;
        const centerLng = (comparison.originCoords[1] + comparison.destinationCoords[1]) / 2;
        const distToCenter = Math.hypot(spot.lat - centerLat, spot.lng - centerLng) * 111;

        if (distToCenter > 60) return;

        const getawayIcon = L.divIcon({
          className: 'custom-getaway-marker',
          html: `
            <div style="background: #FFFFFF; border: 2px solid #059669; border-radius: 9999px; padding: 2px 8px; font-size: 10px; color: #059669; font-weight: 600; box-shadow: 0 3px 8px rgba(5,150,105,0.25); display: flex; align-items: center; gap: 4px; white-space: nowrap; cursor: pointer;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#059669" stroke="#FFFFFF" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>${spot.name.split(' ')[0]} · ${spot.aqi} AQI</span>
            </div>
          `,
          iconSize: [85, 24],
          iconAnchor: [42, 12],
        });

        const spotMarker = L.marker([spot.lat, spot.lng], { icon: getawayIcon, zIndexOffset: 900 });
        spotMarker.on('click', () => {
          if (onSelectGetawaySpot) onSelectGetawaySpot(spot);
        });
        spotMarker.bindPopup(`
          <div style="padding: 10px 12px; font-family: inherit; min-width: 190px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #059669; font-weight: 600; font-size: 11px;">${spot.categoryLabel}</span>
              <span style="font-size: 9px; font-weight: 600; padding: 1px 5px; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; border-radius: 4px;">${spot.aqi} AQI</span>
            </div>
            <div style="color: #111827; font-weight: 600; font-size: 12px; margin-bottom: 4px;">${spot.name}</div>
            <div style="color: #4B5563; font-size: 11px; margin-bottom: 6px;">${spot.description}</div>
            <div style="color: #059669; font-size: 10px; font-weight: 500;">Click marker for preview card & route</div>
          </div>
        `);
        layerGroup.addLayer(spotMarker);
      });
    }

    // Save active route bounds to ref for one-click re-centering
    routeBoundsRef.current = routeBounds;

    // FLY TO BOUNDS with Google Maps-style padding:
    // Top-left padding clears the top floating pill (120px)
    // Bottom-right padding clears the bottom comparison cards (240px)
    if (routeBounds.isValid()) {
      map.flyToBounds(routeBounds, {
        paddingTopLeft: [50, 120],
        paddingBottomRight: [50, 240],
        maxZoom: 16,
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [comparison, selectedRouteTab, hazards, sensorStations, cleanGetaways, showGetaways, onSelectGetawaySpot]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#F3F4F6] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Google Maps-style Re-center / Fit Route Button */}
      <div className="absolute bottom-6 right-3.5 z-[400] flex flex-col space-y-2 pointer-events-auto">
        <button
          onClick={handleRecenter}
          title="Fit Route (Google Maps View)"
          className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-md hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Picking Location Banner */}
      {isPickingLocation && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[400] bg-white border border-blue-500 rounded-xl px-4 py-2 text-xs font-medium text-gray-800 shadow-xl flex items-center space-x-2 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span>Click anywhere on the map to pin incident coordinates</span>
        </div>
      )}
    </div>
  );
}
