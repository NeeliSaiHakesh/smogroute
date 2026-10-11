export type TravelMode = 'pedestrian' | 'cyclist';

export type HazardType = 
  | 'Garbage Burning' 
  | 'Construction Dust' 
  | 'Diesel Smoke' 
  | 'Road Spill';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface PresetRouteDef {
  id: string;
  name: string;
  region: string;
  origin: { name: string; coords: [number, number] };
  destination: { name: string; coords: [number, number] };
  fastPath: [number, number][];
  cleanPath: [number, number][];
  fastBaseDistanceKm: number;
  cleanBaseDistanceKm: number;
  fastBaseAqi: number;
  cleanBaseAqi: number;
}

export interface RouteSegment {
  name: string;
  distanceKm: number;
  durationMins: number;
  aqi: number;
  pm25: number; // in ug/m3
  description: string;
}

export interface RouteDetails {
  id: 'fast' | 'clean';
  title: string;
  distanceKm: number;
  durationMins: number;
  avgAqi: number;
  pm25MassInhaledUg: number; // in micrograms
  path: [number, number][];
  segments: RouteSegment[];
  exposureLevel: 'Good' | 'Moderate' | 'Poor' | 'Severe';
}

export interface RouteComparisonResult {
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  mode: TravelMode;
  fastRoute: RouteDetails;
  cleanRoute: RouteDetails;
  particulateReductionPercent: number;
  airQualityDifferential: number;
  lambdaMetadata: {
    requestId: string;
    executionTimeMs: number;
    billedDurationMs: number;
    memoryAllocatedMB: number;
    gatewayLatencyMs: number;
  };
}

export interface HazardPin {
  hazard_id: string;
  hazard_type: HazardType;
  coordinates: {
    lat: number;
    lng: number;
  };
  location_name: string;
  timestamp: number;
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';
  rekognition_confidence: number;
  detected_labels: Array<{ Name: string; Confidence: number }>;
  reporter_id: string;
  ttl_expires_at: number;
  image_url?: string;
}

export interface RekognitionVerificationResponse {
  verificationStatus: 'VERIFIED' | 'REJECTED';
  confidenceScore: number;
  detectedLabels: Array<{ Name: string; Confidence: number }>;
  hazardType: HazardType;
  passCriteriaMet: boolean;
  awsExecutionMetadata: {
    service: string;
    modelArn: string;
    inferenceLatencyMs: number;
    s3BucketUri: string;
  };
}

export interface SensorStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  updatedAt: string;
}

export interface SavedRoute {
  id: string;
  label: string;
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  distanceKm: number;
  durationMins: number;
  pm25ReductionPercent: number;
  avgCleanAqi: number;
  savedAt: number;
  presetId?: string;
}

export interface GeocodingResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  name?: string;
}

export interface CleanGetawaySpot {
  id: string;
  name: string;
  category: 'park' | 'resort' | 'theme_park' | 'nature_reserve';
  categoryLabel: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  city: string;
  description: string;
  treeCanopyIndex: number;
}
