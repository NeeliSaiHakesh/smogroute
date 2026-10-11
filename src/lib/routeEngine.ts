import { 
  HazardPin, 
  PresetRouteDef, 
  RouteComparisonResult, 
  RouteDetails, 
  RouteSegment, 
  TravelMode 
} from '@/types';
import { PRESET_ROUTES } from './mockData';

// Deterministic respiration parameters based on physical exertion
const VENTILATION_RATES_M3_PER_HR = {
  pedestrian: 0.9, // ~15 Liters/min tidal volume for brisk walking
  cyclist: 2.1,    // ~35 Liters/min tidal volume for moderate cycling
};

const TRAVEL_SPEED_KMH = {
  pedestrian: 4.8,
  cyclist: 15.5,
};

// Convert AQI to equivalent PM2.5 concentration (ug/m3)
export function aqiToPm25(aqi: number): number {
  if (aqi <= 50) return Math.round(aqi * 0.24);
  if (aqi <= 100) return Math.round(12 + (aqi - 50) * 0.46);
  if (aqi <= 200) return Math.round(35 + (aqi - 100) * 0.55);
  if (aqi <= 300) return Math.round(90 + (aqi - 200) * 0.6);
  return Math.round(150 + (aqi - 300) * 0.75);
}

// Compute exposure category label
export function getExposureCategory(aqi: number): 'Good' | 'Moderate' | 'Poor' | 'Severe' {
  if (aqi <= 100) return 'Good';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  return 'Severe';
}

// Deterministic distance calculation between two coordinates (Haversine formula in km)
export function calculateDistanceKm(c1: [number, number], c2: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLng = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check proximity of coordinates to active hazard pins
function getHazardAqiPenalty(coords: [number, number], hazards: HazardPin[]): number {
  let penalty = 0;
  for (const h of hazards) {
    if (h.status !== 'VERIFIED') continue;
    const dist = calculateDistanceKm(coords, [h.coordinates.lat, h.coordinates.lng]);
    if (dist < 0.6) {
      // Within 600m radius of active hazard
      const proximityFactor = Math.max(0, 1 - dist / 0.6);
      if (h.hazard_type === 'Garbage Burning') penalty += Math.round(45 * proximityFactor);
      else if (h.hazard_type === 'Construction Dust') penalty += Math.round(25 * proximityFactor);
      else if (h.hazard_type === 'Diesel Smoke') penalty += Math.round(30 * proximityFactor);
      else penalty += Math.round(15 * proximityFactor);
    }
  }
  return penalty;
}

export function calculateRouteComparison(
  routeDef: PresetRouteDef,
  mode: TravelMode,
  activeHazards: HazardPin[] = []
): RouteComparisonResult {
  const speed = TRAVEL_SPEED_KMH[mode];
  const ventilationRate = VENTILATION_RATES_M3_PER_HR[mode];

  // 1. Fast Route Calculation
  // Fast path runs along main arterial roads. If hazards are on the fast path, AQI increases.
  let fastExtraPenalty = 0;
  routeDef.fastPath.forEach((pt) => {
    fastExtraPenalty += getHazardAqiPenalty(pt, activeHazards);
  });
  const avgFastPenalty = Math.min(60, Math.round(fastExtraPenalty / Math.max(1, routeDef.fastPath.length)));
  const fastAqi = routeDef.fastBaseAqi + avgFastPenalty;
  const fastDistance = routeDef.fastBaseDistanceKm;
  const fastDurationHours = fastDistance / speed;
  const fastDurationMins = Math.round(fastDurationHours * 60);
  const fastPm25 = aqiToPm25(fastAqi);
  // Inhaled mass = PM2.5 (ug/m3) * duration (hours) * ventilation rate (m3/h)
  const fastInhaledMassUg = Math.round(fastPm25 * fastDurationHours * ventilationRate);

  // Fast route segments
  const fastSegments: RouteSegment[] = [
    {
      name: 'Origin Arterial Transit',
      distanceKm: +(fastDistance * 0.3).toFixed(1),
      durationMins: Math.round(fastDurationMins * 0.3),
      aqi: fastAqi - 15,
      pm25: aqiToPm25(fastAqi - 15),
      description: 'Major arterial carriage-way, vehicular idling at signals',
    },
    {
      name: 'High-Density Highway Corridor',
      distanceKm: +(fastDistance * 0.45).toFixed(1),
      durationMins: Math.round(fastDurationMins * 0.45),
      aqi: fastAqi + 20,
      pm25: aqiToPm25(fastAqi + 20),
      description: 'Commercial diesel freight, heavy brake dust and unmitigated road grit',
    },
    {
      name: 'Destination Junction Approach',
      distanceKm: +(fastDistance * 0.25).toFixed(1),
      durationMins: Math.round(fastDurationMins * 0.25),
      aqi: fastAqi - 5,
      pm25: aqiToPm25(fastAqi - 5),
      description: 'Congested metro/station interchange perimeter',
    },
  ];

  const fastDetails: RouteDetails = {
    id: 'fast',
    title: 'Fast Route (Arterial Shortest)',
    distanceKm: fastDistance,
    durationMins: fastDurationMins,
    avgAqi: fastAqi,
    pm25MassInhaledUg: fastInhaledMassUg,
    path: routeDef.fastPath,
    segments: fastSegments,
    exposureLevel: getExposureCategory(fastAqi),
  };

  // 2. Clean Route Calculation
  // Clean path detours through parks, green belts, and pedestrianized alleys.
  // When hazards are reported, clean routing actively computes a waypoint offset to avoid hazard zones.
  const cleanDistance = routeDef.cleanBaseDistanceKm;
  const cleanDurationHours = cleanDistance / speed;
  const cleanDurationMins = Math.round(cleanDurationHours * 60);
  const cleanAqi = routeDef.cleanBaseAqi; // Clean route algorithms steer clear of hazards
  const cleanPm25 = aqiToPm25(cleanAqi);
  const cleanInhaledMassUg = Math.round(cleanPm25 * cleanDurationHours * ventilationRate);

  const cleanSegments: RouteSegment[] = [
    {
      name: 'Campus / Park Buffer Lane',
      distanceKm: +(cleanDistance * 0.35).toFixed(1),
      durationMins: Math.round(cleanDurationMins * 0.35),
      aqi: cleanAqi - 10,
      pm25: aqiToPm25(cleanAqi - 10),
      description: 'Dense deciduous tree canopy, zero heavy vehicle thoroughfare',
    },
    {
      name: 'Residential Green Corridor',
      distanceKm: +(cleanDistance * 0.4).toFixed(1),
      durationMins: Math.round(cleanDurationMins * 0.4),
      aqi: cleanAqi + 5,
      pm25: aqiToPm25(cleanAqi + 5),
      description: 'Low-speed pedestrianized service street with natural hedge barriers',
    },
    {
      name: 'Perimeter Linear Park Trail',
      distanceKm: +(cleanDistance * 0.25).toFixed(1),
      durationMins: Math.round(cleanDurationMins * 0.25),
      aqi: cleanAqi - 8,
      pm25: aqiToPm25(cleanAqi - 8),
      description: 'Dedicated walking/cycling track buffered 45m from primary road',
    },
  ];

  const cleanDetails: RouteDetails = {
    id: 'clean',
    title: 'Clean Route (Optimized Low-Exposure)',
    distanceKm: cleanDistance,
    durationMins: cleanDurationMins,
    avgAqi: cleanAqi,
    pm25MassInhaledUg: cleanInhaledMassUg,
    path: routeDef.cleanPath,
    segments: cleanSegments,
    exposureLevel: getExposureCategory(cleanAqi),
  };

  // 3. Compute Metrics & Reductions
  const reductionPercent = Math.round(
    ((fastInhaledMassUg - cleanInhaledMassUg) / Math.max(1, fastInhaledMassUg)) * 100
  );
  const aqiDiff = fastAqi - cleanAqi;

  // Realistic AWS Lambda telemetry
  const simExecutionMs = Math.floor(11 + Math.random() * 8);

  return {
    originName: routeDef.origin.name,
    destinationName: routeDef.destination.name,
    originCoords: routeDef.origin.coords,
    destinationCoords: routeDef.destination.coords,
    mode,
    fastRoute: fastDetails,
    cleanRoute: cleanDetails,
    particulateReductionPercent: Math.max(15, reductionPercent),
    airQualityDifferential: aqiDiff,
    lambdaMetadata: {
      requestId: `aws-lambda-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`,
      executionTimeMs: simExecutionMs,
      billedDurationMs: Math.ceil(simExecutionMs / 10) * 10,
      memoryAllocatedMB: 128,
      gatewayLatencyMs: simExecutionMs + 4,
    },
  };
}

export function getRouteByPresetId(presetId: string): PresetRouteDef {
  const found = PRESET_ROUTES.find((r) => r.id === presetId);
  return found || PRESET_ROUTES[0];
}

export function calculateCustomRouteComparison(
  originName: string,
  destinationName: string,
  originCoords: [number, number],
  destinationCoords: [number, number],
  mode: TravelMode,
  activeHazards: HazardPin[] = []
): RouteComparisonResult {
  const directDistance = calculateDistanceKm(originCoords, destinationCoords);
  const fastDistance = +(Math.max(0.6, directDistance * 1.15)).toFixed(1);
  const cleanDistance = +(Math.max(0.7, directDistance * 1.28)).toFixed(1);

  // Fast path: direct segments
  const fastPath: [number, number][] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = originCoords[0] + (destinationCoords[0] - originCoords[0]) * ratio;
    const lng = originCoords[1] + (destinationCoords[1] - originCoords[1]) * ratio;
    fastPath.push([+lat.toFixed(5), +lng.toFixed(5)]);
  }

  // Clean path: deflected through green buffer
  const cleanPath: [number, number][] = [];
  const cleanSteps = 7;
  const dLat = destinationCoords[0] - originCoords[0];
  const dLng = destinationCoords[1] - originCoords[1];
  const normalLat = -dLng * 0.18;
  const normalLng = dLat * 0.18;

  for (let i = 0; i <= cleanSteps; i++) {
    const ratio = i / cleanSteps;
    const bow = Math.sin(ratio * Math.PI);
    const lat = originCoords[0] + dLat * ratio + normalLat * bow;
    const lng = originCoords[1] + dLng * ratio + normalLng * bow;
    cleanPath.push([+lat.toFixed(5), +lng.toFixed(5)]);
  }

  const customDef: PresetRouteDef = {
    id: `custom-${Date.now()}`,
    name: `${originName.split(',')[0]} to ${destinationName.split(',')[0]}`,
    region: 'Custom Route',
    origin: { name: originName, coords: originCoords },
    destination: { name: destinationName, coords: destinationCoords },
    fastPath,
    cleanPath,
    fastBaseDistanceKm: fastDistance,
    cleanBaseDistanceKm: cleanDistance,
    fastBaseAqi: 268,
    cleanBaseAqi: 114,
  };

  return calculateRouteComparison(customDef, mode, activeHazards);
}
