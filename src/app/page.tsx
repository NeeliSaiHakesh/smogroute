'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Footprints, 
  Bike, 
  AlertTriangle, 
  Server, 
  Search, 
  Bookmark, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Construction, 
  Truck, 
  AlertOctagon, 
  Zap, 
  Database,
  Navigation,
  MapPin,
  Trees
} from 'lucide-react';
import HazardModal from '@/components/HazardModal';
import ArchitectureModal from '@/components/ArchitectureModal';
import SavedRoutesDrawer from '@/components/SavedRoutesDrawer';
import SaveRouteModal from '@/components/SaveRouteModal';
import LocationSearchModal from '@/components/LocationSearchModal';
import CleanGetawaysDrawer from '@/components/CleanGetawaysDrawer';
import GetawayCard from '@/components/GetawayCard';
import { CleanGetawaySpot, HazardPin, RouteComparisonResult, SavedRoute, TravelMode } from '@/types';
import { INITIAL_HAZARDS, SENSOR_STATIONS, PRESET_ROUTES, INITIAL_SAVED_ROUTES, DEMO_CLEAN_GETAWAYS } from '@/lib/mockData';
import { calculateRouteComparison, calculateCustomRouteComparison, getRouteByPresetId } from '@/lib/routeEngine';

// Dynamically import Leaflet MapView to disable server-side rendering
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center text-gray-400 text-xs font-medium">
      Loading OpenStreetMap vector tiles...
    </div>
  ),
});

export default function SmogRouteDashboard() {
  const [travelMode, setTravelMode] = useState<TravelMode>('pedestrian');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('delhi-dtu-rohini');
  const [selectedRouteTab, setSelectedRouteTab] = useState<'clean' | 'fast'>('clean');
  const [hazards, setHazards] = useState<HazardPin[]>(INITIAL_HAZARDS);
  const [comparison, setComparison] = useState<RouteComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals & Drawers
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  // Clean Getaways & Holiday Spots (Overpass API)
  const [showGetaways, setShowGetaways] = useState<boolean>(true);
  const [cleanGetaways, setCleanGetaways] = useState<CleanGetawaySpot[]>(DEMO_CLEAN_GETAWAYS);
  const [isGetawaysDrawerOpen, setIsGetawaysDrawerOpen] = useState<boolean>(false);
  const [isFetchingGetaways, setIsFetchingGetaways] = useState<boolean>(false);
  const [selectedGetawaySpot, setSelectedGetawaySpot] = useState<CleanGetawaySpot | null>(null);
  const [getawaysQuerySource, setGetawaysQuerySource] = useState<string>('OpenStreetMap Overpass API (Live)');

  // Saved Routes state with localStorage persistence
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(INITIAL_SAVED_ROUTES);

  // Active custom coordinates (if custom route selected)
  const [customOrigin, setCustomOrigin] = useState<{ name: string; coords: [number, number] } | null>(null);
  const [customDest, setCustomDest] = useState<{ name: string; coords: [number, number] } | null>(null);

  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.7425,
    lng: 77.1215,
  });

  // Query Overpass API for Clean Getaways
  const fetchCleanGetaways = useCallback(async (lat: number, lng: number) => {
    setIsFetchingGetaways(true);
    try {
      const res = await fetch(`/api/getaways?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.spots) && data.spots.length > 0) {
          setCleanGetaways(data.spots);
          setGetawaysQuerySource(data.querySource || 'OpenStreetMap Overpass API (Live)');
        }
      }
    } catch (err) {
      console.error('Failed to query Overpass getaways', err);
    } finally {
      setIsFetchingGetaways(false);
    }
  }, []);

  // Load saved routes from localStorage on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('smogroute_saved_routes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedRoutes(parsed);
        }
      }
    } catch {
      // Fallback to initial
    }
  }, []);

  // Save routes helper
  const handleSaveRoute = async (newRoute: SavedRoute) => {
    const updated = [newRoute, ...savedRoutes.filter((r) => r.id !== newRoute.id)];
    setSavedRoutes(updated);
    try {
      localStorage.setItem('smogroute_saved_routes', JSON.stringify(updated));
      await fetch('/api/user/saved-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoute),
      });
    } catch (err) {
      console.error('Failed to persist saved route', err);
    }
  };

  // Delete saved route helper
  const handleDeleteSavedRoute = async (routeId: string) => {
    const updated = savedRoutes.filter((r) => r.id !== routeId);
    setSavedRoutes(updated);
    try {
      localStorage.setItem('smogroute_saved_routes', JSON.stringify(updated));
      await fetch(`/api/user/saved-locations?id=${routeId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete saved route', err);
    }
  };

  // Calculate or fetch route comparison
  const refreshRoute = useCallback(
    async (
      presetId: string,
      mode: TravelMode,
      currentHazards: HazardPin[],
      customOrig: { name: string; coords: [number, number] } | null,
      customDst: { name: string; coords: [number, number] } | null
    ) => {
      setIsLoading(true);
      try {
        if (customOrig && customDst) {
          const result = calculateCustomRouteComparison(
            customOrig.name,
            customDst.name,
            customOrig.coords,
            customDst.coords,
            mode,
            currentHazards
          );
          setComparison(result);
          // Query Overpass for getaways near the active route center
          const centerLat = (customOrig.coords[0] + customDst.coords[0]) / 2;
          const centerLng = (customOrig.coords[1] + customDst.coords[1]) / 2;
          fetchCleanGetaways(centerLat, centerLng);
        } else {
          const routeDef = getRouteByPresetId(presetId);
          const result = calculateRouteComparison(routeDef, mode, currentHazards);
          setComparison(result);
          fetchCleanGetaways(routeDef.origin.coords[0], routeDef.origin.coords[1]);
        }
      } catch (err) {
        console.error('Route evaluation error', err);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCleanGetaways]
  );

  // Recalculate when dependencies change
  useEffect(() => {
    refreshRoute(selectedPresetId, travelMode, hazards, customOrigin, customDest);
  }, [selectedPresetId, travelMode, hazards, customOrigin, customDest, refreshRoute]);

  // Load a saved route
  const handleLoadSavedRoute = (route: SavedRoute) => {
    if (route.presetId) {
      setCustomOrigin(null);
      setCustomDest(null);
      setSelectedPresetId(route.presetId);
    } else {
      setCustomOrigin({ name: route.originName, coords: route.originCoords });
      setCustomDest({ name: route.destinationName, coords: route.destinationCoords });
    }
  };

  // Custom route search applied
  const handleCustomRouteSelect = (
    origName: string,
    destName: string,
    origCoords: [number, number],
    destCoords: [number, number]
  ) => {
    setCustomOrigin({ name: origName, coords: origCoords });
    setCustomDest({ name: destName, coords: destCoords });
  };

  // Select one of the 4 India Metro presets
  const handleSelectMetroPreset = (presetId: string) => {
    setCustomOrigin(null);
    setCustomDest(null);
    setSelectedPresetId(presetId);
  };

  // Route to clean getaway spot
  const handleRouteToGetaway = (spot: CleanGetawaySpot) => {
    setSelectedGetawaySpot(null);
    // Keep current origin or use default
    const originToUse = customOrigin || {
      name: comparison?.originName || 'DTU Main Gate',
      coords: comparison?.originCoords || [28.7501, 77.1175],
    };
    setCustomOrigin(originToUse);
    setCustomDest({ name: spot.name, coords: [spot.lat, spot.lng] });
  };

  // Handle map click for incident location tagging
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (isPickingLocation) {
      setPickedCoords(coords);
      setIsPickingLocation(false);
      setIsReportModalOpen(true);
    }
  };

  // Add verified hazard and re-optimize routes dynamically
  const handleVerifiedHazardAdded = (newHazard: HazardPin) => {
    const updated = [newHazard, ...hazards];
    setHazards(updated);
    refreshRoute(selectedPresetId, travelMode, updated, customOrigin, customDest);
  };

  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'Garbage Burning':
        return <Flame className="w-3.5 h-3.5 text-rose-500" />;
      case 'Construction Dust':
        return <Construction className="w-3.5 h-3.5 text-amber-500" />;
      case 'Diesel Smoke':
        return <Truck className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <AlertOctagon className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const activeOriginLabel = customOrigin
    ? customOrigin.name.split(',')[0]
    : (comparison?.originName || 'DTU Main Gate').split(' (')[0];
  const activeDestLabel = customDest
    ? customDest.name.split(',')[0]
    : (comparison?.destinationName || 'Rohini Sector 16').split(' (')[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white text-gray-900 select-none">
      {/* 1. FULL-SCREEN LEAFLET MAP WITH OPENSTREETMAP TILES */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapView
          comparison={comparison}
          selectedRouteTab={selectedRouteTab}
          hazards={hazards}
          sensorStations={SENSOR_STATIONS}
          cleanGetaways={cleanGetaways}
          showGetaways={showGetaways}
          onSelectGetawaySpot={(spot) => setSelectedGetawaySpot(spot)}
          onMapClick={handleMapClick}
          isPickingLocation={isPickingLocation}
        />
      </div>

      {/* Floating Getaway Card when marker clicked */}
      {selectedGetawaySpot && (
        <GetawayCard
          spot={selectedGetawaySpot}
          onClose={() => setSelectedGetawaySpot(null)}
          onRouteHere={handleRouteToGetaway}
        />
      )}

      {/* 2. TOP FLOATING APP BAR */}
      <div className="absolute top-3.5 inset-x-3.5 z-30 flex flex-col space-y-2 pointer-events-none">
        <div className="flex items-center justify-between w-full">
          {/* Top Left: Brand & Travel Mode */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl px-3 py-2 flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-medium text-xs shadow-xs">
                S
              </div>
              <div>
                <span className="text-xs font-medium tracking-tight text-gray-900">SmogRoute</span>
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-500 font-mono">
                  India
                </span>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl p-1 flex items-center space-x-1">
              <button
                onClick={() => setTravelMode('pedestrian')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  travelMode === 'pedestrian'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Walk</span>
              </button>
              <button
                onClick={() => setTravelMode('cyclist')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  travelMode === 'cyclist'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cycle</span>
              </button>
            </div>
          </div>

          {/* Top Center: Floating Search Pill (Opens Geocoding Modal across India) */}
          <div className="pointer-events-auto hidden md:flex items-center bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl p-1.5 space-x-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center space-x-2 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors text-left"
            >
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="text-xs font-medium text-gray-800 max-w-[130px] truncate">
                {activeOriginLabel}
              </span>
            </button>

            <span className="text-gray-400 text-xs font-medium">➔</span>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center space-x-2 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors text-left"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-xs font-medium text-gray-800 max-w-[130px] truncate">
                {activeDestLabel}
              </span>
            </button>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              title="Search Any Location in India"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
            </button>

            {isLoading && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mx-1" />
            )}
          </div>

          {/* Top Right: Actions (Clean Getaways, Saved, Report, Architecture) */}
          <div className="flex items-center space-x-1.5 pointer-events-auto">
            {/* CLEAN GETAWAYS TOGGLE & DIRECTORY */}
            <button
              onClick={() => {
                setShowGetaways(true);
                setIsGetawaysDrawerOpen(true);
              }}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border shadow-sm transition-colors ${
                showGetaways
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white/95 backdrop-blur-md hover:bg-gray-50 text-gray-800 border-gray-200'
              }`}
            >
              <Trees className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Clean Getaways</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100/70 text-emerald-800 border border-emerald-300 text-[10px] font-mono">
                {cleanGetaways.length}
              </span>
            </button>

            {/* Saved Places Drawer Toggle */}
            <button
              onClick={() => setIsSavedDrawerOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/95 backdrop-blur-md hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Saved</span>
              <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono">
                {savedRoutes.length}
              </span>
            </button>

            {/* Report Hazard */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/95 backdrop-blur-md hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Report</span>
              {hazards.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-mono">
                  {hazards.length}
                </span>
              )}
            </button>

            {/* Architecture View Toggle */}
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/95 backdrop-blur-md hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">AWS Arch</span>
            </button>
          </div>
        </div>

        {/* 4 PRESET QUICK-PILLS (INDIA METROS) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 pointer-events-auto">
          {PRESET_ROUTES.map((p) => {
            const isSelected = selectedPresetId === p.id && !customOrigin;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectMetroPreset(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-xs whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white/95 backdrop-blur-md text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span>{p.name}</span>
              </button>
            );
          })}

          {/* Quick Custom Search Pill */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 shadow-xs whitespace-nowrap transition-all flex items-center space-x-1"
          >
            <Search className="w-3 h-3 text-blue-600" />
            <span>+ Search Any City</span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM FLOATING COMPARISON CARDS & COLLAPSIBLE DRAWER */}
      {comparison && (
        <div className="absolute bottom-4 inset-x-4 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-full max-w-2xl pointer-events-auto flex flex-col space-y-2">
            {/* Collapsible Details Drawer */}
            {showDrawer && (
              <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-gray-900">Route Waypoint Breakdown</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-500 text-[11px]">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Lambda: {comparison.lambdaMetadata.executionTimeMs}ms</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Database className="w-3 h-3 text-blue-500" />
                      <span>DynamoDB User Ledger: Synced</span>
                    </span>
                  </div>
                </div>

                {/* Segments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  <div>
                    <div className="text-[10px] uppercase font-medium text-emerald-700 mb-1">
                      Clean Route Path
                    </div>
                    <div className="space-y-1.5">
                      {comparison.cleanRoute.segments.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[11px]"
                        >
                          <div className="flex justify-between font-medium text-emerald-950">
                            <span>{s.name}</span>
                            <span>{s.aqi} AQI</span>
                          </div>
                          <div className="text-gray-500 text-[10px] mt-0.5">{s.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-medium text-rose-700 mb-1">
                      Fast Route Path (Arterial)
                    </div>
                    <div className="space-y-1.5">
                      {comparison.fastRoute.segments.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-[11px]"
                        >
                          <div className="flex justify-between font-medium text-rose-950">
                            <span>{s.name}</span>
                            <span>{s.aqi} AQI</span>
                          </div>
                          <div className="text-gray-500 text-[10px] mt-0.5">{s.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Micro-Hazards in radius */}
                {hazards.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-[10px] uppercase font-medium text-gray-500 mb-1.5 flex items-center justify-between">
                      <span>Active Verified Micro-Hazards</span>
                      <span>{hazards.length} pins</span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                      {hazards.map((h) => (
                        <div
                          key={h.hazard_id}
                          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center space-x-1.5 shrink-0 text-[11px]"
                        >
                          {getHazardIcon(h.hazard_type)}
                          <span className="font-medium text-gray-800">{h.hazard_type}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{h.location_name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TWO SIDE-BY-SIDE ROUTE COMPARISON CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Clean Route Card (Recommended) */}
              <div
                onClick={() => setSelectedRouteTab('clean')}
                className={`cursor-pointer rounded-2xl p-3.5 transition-all bg-white border shadow-sm relative ${
                  selectedRouteTab === 'clean'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="text-xs font-medium text-gray-900">Clean Route</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Optimized
                    </span>
                  </div>
                  {/* % INHALED PM2.5 SAVED HIGHLIGHT */}
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>-{comparison.particulateReductionPercent}% PM2.5</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 px-2 bg-gray-50/80 rounded-xl text-center">
                  <div>
                    <div className="text-[10px] text-gray-500">Distance</div>
                    <div className="text-xs font-medium text-gray-900">
                      {comparison.cleanRoute.distanceKm} km
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Duration</div>
                    <div className="text-xs font-medium text-gray-900">
                      {comparison.cleanRoute.durationMins} mins
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Avg Exposure</div>
                    <div className="text-xs font-medium text-emerald-600">
                      {comparison.cleanRoute.avgAqi} AQI
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
                  <span className="truncate max-w-[140px]">Park & green buffer canopy</span>
                  {/* FLOATING BOOKMARK BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSaveModalOpen(true);
                    }}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>Save Route</span>
                  </button>
                </div>
              </div>

              {/* Fast Route Card */}
              <div
                onClick={() => setSelectedRouteTab('fast')}
                className={`cursor-pointer rounded-2xl p-3.5 transition-all bg-white border shadow-sm ${
                  selectedRouteTab === 'fast'
                    ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-medium text-gray-900">Fast Route</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      Shortest
                    </span>
                  </div>
                  <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    {comparison.fastRoute.avgAqi} AQI · Severe
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 px-2 bg-gray-50/80 rounded-xl text-center">
                  <div>
                    <div className="text-[10px] text-gray-500">Distance</div>
                    <div className="text-xs font-medium text-gray-900">
                      {comparison.fastRoute.distanceKm} km
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Duration</div>
                    <div className="text-xs font-medium text-gray-900">
                      {comparison.fastRoute.durationMins} mins
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Avg Exposure</div>
                    <div className="text-xs font-medium text-rose-600">
                      {comparison.fastRoute.avgAqi} AQI
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
                  <span>Arterial vehicular corridor</span>
                  <span className="text-gray-700 font-medium">
                    {comparison.fastRoute.pm25MassInhaledUg} µg inhaled
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Drawer Toggle Pill */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowDrawer(!showDrawer)}
                className="bg-white/95 backdrop-blur-md hover:bg-gray-50 border border-gray-200 shadow-sm rounded-full px-3.5 py-1 text-[11px] font-medium text-gray-700 flex items-center space-x-1 transition-colors"
              >
                <span>{showDrawer ? 'Hide Details' : 'View Waypoints & Air Quality Segments'}</span>
                {showDrawer ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODALS & DRAWERS */}
      <HazardModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onVerifiedHazardAdded={handleVerifiedHazardAdded}
        initialCoords={pickedCoords}
        onStartLocationPick={() => setIsPickingLocation(true)}
      />

      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      <SavedRoutesDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedRoutes={savedRoutes}
        onLoadRoute={handleLoadSavedRoute}
        onDeleteRoute={handleDeleteSavedRoute}
      />

      <SaveRouteModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        comparison={comparison}
        onSaveRoute={handleSaveRoute}
      />

      <LocationSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectRoute={handleCustomRouteSelect}
        currentOriginName={comparison?.originName || 'DTU Main Gate'}
        currentDestinationName={comparison?.destinationName || 'Rohini Sector 16'}
        currentOriginCoords={comparison?.originCoords || [28.7501, 77.1175]}
        currentDestinationCoords={comparison?.destinationCoords || [28.7285, 77.1245]}
      />

      {/* CLEAN GETAWAYS DRAWER */}
      <CleanGetawaysDrawer
        isOpen={isGetawaysDrawerOpen}
        onClose={() => setIsGetawaysDrawerOpen(false)}
        spots={cleanGetaways}
        isLoading={isFetchingGetaways}
        onRouteHere={handleRouteToGetaway}
        onSelectSpotOnMap={(spot) => setSelectedGetawaySpot(spot)}
        querySource={getawaysQuerySource}
      />
    </div>
  );
}
