'use client';

import React, { useState } from 'react';
import { 
  TrendingDown, 
  Flame, 
  Construction, 
  Truck, 
  AlertOctagon,
  ChevronDown,
  Zap,
  Database
} from 'lucide-react';
import { HazardPin, RouteComparisonResult, TravelMode } from '@/types';
import { PRESET_ROUTES } from '@/lib/mockData';

interface SidebarProps {
  comparison: RouteComparisonResult | null;
  selectedRouteTab: 'clean' | 'fast';
  onSelectRouteTab: (tab: 'clean' | 'fast') => void;
  selectedPresetId: string;
  onPresetChange: (id: string) => void;
  hazards: HazardPin[];
  activeMode: TravelMode;
  isLoading: boolean;
  onFocusHazard: (hazard: HazardPin) => void;
}

export default function Sidebar({
  comparison,
  selectedRouteTab,
  onSelectRouteTab,
  selectedPresetId,
  onPresetChange,
  hazards,
  activeMode,
  isLoading,
  onFocusHazard,
}: SidebarProps) {
  const [showSegments, setShowSegments] = useState<boolean>(true);
  const [showHazardsList, setShowHazardsList] = useState<boolean>(false);

  if (!comparison) {
    return (
      <div className="w-full lg:w-[40%] h-full bg-[#0E1017] border-r border-[#232733] p-6 flex items-center justify-center text-[#9CA3AF]">
        <div className="text-xs">Computing route exposure matrix...</div>
      </div>
    );
  }

  const { fastRoute, cleanRoute, particulateReductionPercent, airQualityDifferential, lambdaMetadata } = comparison;

  const getAqiPill = (aqi: number) => {
    if (aqi <= 100) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {aqi} AQI · Good
        </span>
      );
    }
    if (aqi <= 200) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
          {aqi} AQI · Moderate
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
        {aqi} AQI · Severe
      </span>
    );
  };

  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'Garbage Burning':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'Construction Dust':
        return <Construction className="w-3.5 h-3.5 text-amber-400" />;
      case 'Diesel Smoke':
        return <Truck className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <AlertOctagon className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <aside className="w-full lg:w-[40%] h-full bg-[#0E1017] border-r border-[#232733] flex flex-col overflow-y-auto select-none shrink-0 z-20">
      {/* 1. ROUTE INPUT & SELECTION */}
      <div className="p-4 border-b border-[#232733] bg-[#11131C]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium">
            Route Waypoints
          </span>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#6B7280]">
            {isLoading && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />}
            <span>{activeMode === 'pedestrian' ? 'Walking (4.8 km/h)' : 'Cycling (15.5 km/h)'}</span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Origin */}
          <div className="flex items-center space-x-2.5 bg-[#0A0B10] px-3 py-2 rounded border border-[#232733]">
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-[#6B7280]">Origin</div>
              <div className="text-xs text-[#F3F4F6] truncate font-medium">{comparison.originName}</div>
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-center space-x-2.5 bg-[#0A0B10] px-3 py-2 rounded border border-[#232733]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-[#6B7280]">Destination</div>
              <div className="text-xs text-[#F3F4F6] truncate font-medium">{comparison.destinationName}</div>
            </div>
          </div>
        </div>

        {/* Quick Corridor Switcher */}
        <div className="mt-3 flex items-center space-x-1.5 overflow-x-auto pb-1">
          {PRESET_ROUTES.map((p) => (
            <button
              key={p.id}
              onClick={() => onPresetChange(p.id)}
              className={`text-[11px] px-2.5 py-1 rounded border whitespace-nowrap transition-colors ${
                selectedPresetId === p.id
                  ? 'bg-[#1F2433] text-[#F3F4F6] border-[#3B82F6]/50 font-medium'
                  : 'bg-[#141722] text-[#9CA3AF] border-[#232733] hover:text-[#D1D5DB]'
              }`}
            >
              {p.name.split(' to ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. EXPOSURE COMPARISON SUMMARY BANNER */}
      <div className="p-4 border-b border-[#232733] bg-[#121520]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium">
            Exposure Optimization
          </span>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-{particulateReductionPercent}% Inhaled PM2.5</span>
          </span>
        </div>

        {/* High-impact Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#0A0B10] p-2.5 rounded border border-[#232733]">
            <div className="text-[10px] text-[#6B7280] mb-0.5">AQI Exposure Delta</div>
            <div className="text-base text-emerald-400 font-medium">-{airQualityDifferential} AQI</div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5">Lower atmospheric toxicity</div>
          </div>
          <div className="bg-[#0A0B10] p-2.5 rounded border border-[#232733]">
            <div className="text-[10px] text-[#6B7280] mb-0.5">Particulate Avoided</div>
            <div className="text-base text-[#F3F4F6] font-medium">
              {fastRoute.pm25MassInhaledUg - cleanRoute.pm25MassInhaledUg} µg
            </div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5">Respiratory mass reduction</div>
          </div>
        </div>
      </div>

      {/* 3. TWO ROUTE COMPARISON CARDS */}
      <div className="p-4 border-b border-[#232733] space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium mb-1">
          Route Profiles
        </div>

        {/* Clean Route Card (Recommended) */}
        <div
          onClick={() => onSelectRouteTab('clean')}
          className={`cursor-pointer rounded border p-3 transition-all ${
            selectedRouteTab === 'clean'
              ? 'bg-[#10241B]/30 border-emerald-500/50 shadow-sm'
              : 'bg-[#11131A] border-[#232733] hover:border-[#2C3242]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-[#F3F4F6]">Clean Route</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 rounded">
                Optimized
              </span>
            </div>
            {getAqiPill(cleanRoute.avgAqi)}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center py-2 bg-[#0A0B10]/60 rounded border border-[#1F2433] mb-2">
            <div>
              <div className="text-[10px] text-[#6B7280]">Distance</div>
              <div className="text-xs font-medium text-[#F3F4F6]">{cleanRoute.distanceKm} km</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B7280]">Time</div>
              <div className="text-xs font-medium text-[#F3F4F6]">{cleanRoute.durationMins}m</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B7280]">Avg AQI</div>
              <div className="text-xs font-medium text-emerald-400">{cleanRoute.avgAqi}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B7280]">PM2.5 Mass</div>
              <div className="text-xs font-medium text-[#F3F4F6]">{cleanRoute.pm25MassInhaledUg} µg</div>
            </div>
          </div>

          <div className="text-[11px] text-[#9CA3AF] flex items-center justify-between">
            <span>Park canopy & residential green corridor paths</span>
            <span className="text-emerald-400 font-medium">-{particulateReductionPercent}%</span>
          </div>
        </div>

        {/* Fast Route Card */}
        <div
          onClick={() => onSelectRouteTab('fast')}
          className={`cursor-pointer rounded border p-3 transition-all ${
            selectedRouteTab === 'fast'
              ? 'bg-[#291717]/30 border-rose-500/50 shadow-sm'
              : 'bg-[#11131A] border-[#232733] hover:border-[#2C3242]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs font-medium text-[#F3F4F6]">Fast Route</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                Shortest
              </span>
            </div>
            {getAqiPill(fastRoute.avgAqi)}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center py-2 bg-[#0A0B10]/60 rounded border border-[#1F2433] mb-2">
            <div>
              <div className="text-[10px] text-[#6B7280]">Distance</div>
              <div className="text-xs font-medium text-[#F3F4F6]">{fastRoute.distanceKm} km</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B7280]">Time</div>
              <div className="text-xs font-medium text-[#F3F4F6]">{fastRoute.durationMins}m</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B7280]">Avg AQI</div>
              <div className="text-xs font-medium text-rose-400">{fastRoute.avgAqi}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B7280]">PM2.5 Mass</div>
              <div className="text-xs font-medium text-[#F3F4F6]">{fastRoute.pm25MassInhaledUg} µg</div>
            </div>
          </div>

          <div className="text-[11px] text-[#9CA3AF] flex items-center justify-between">
            <span>Arterial highway corridor with commercial diesel exhaust</span>
            <span className="text-rose-400 font-medium">Standard baseline</span>
          </div>
        </div>
      </div>

      {/* 4. SEGMENT-BY-SEGMENT AIR QUALITY ACCORDION */}
      <div className="p-4 border-b border-[#232733]">
        <button
          onClick={() => setShowSegments(!showSegments)}
          className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium"
        >
          <span>Segment Air Quality Breakdown</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showSegments ? 'rotate-180' : ''}`}
          />
        </button>

        {showSegments && (
          <div className="mt-3 space-y-2">
            {(selectedRouteTab === 'clean' ? cleanRoute.segments : fastRoute.segments).map(
              (seg, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B0C12] p-2.5 rounded border border-[#1D212C] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F3F4F6] text-[11px]">
                      {idx + 1}. {seg.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        seg.aqi <= 140
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-900/60'
                      }`}
                    >
                      {seg.aqi} AQI
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9CA3AF]">{seg.description}</div>
                  <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-1 border-t border-[#191D26]">
                    <span>{seg.distanceKm} km · {seg.durationMins} mins</span>
                    <span>PM2.5: {seg.pm25} µg/m³</span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* 5. ACTIVE HAZARDS ON CORRIDOR */}
      <div className="p-4 border-b border-[#232733]">
        <button
          onClick={() => setShowHazardsList(!showHazardsList)}
          className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium"
        >
          <div className="flex items-center space-x-1.5">
            <span>Verified Micro-Hazards</span>
            <span className="px-1.5 py-0.2 bg-[#2D1B1B] text-rose-400 rounded text-[10px] border border-rose-900/50">
              {hazards.length} Active
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showHazardsList ? 'rotate-180' : ''}`}
          />
        </button>

        {showHazardsList && (
          <div className="mt-3 space-y-2">
            {hazards.map((h) => (
              <div
                key={h.hazard_id}
                onClick={() => onFocusHazard(h)}
                className="bg-[#0B0C12] p-2.5 rounded border border-[#1D212C] text-xs hover:border-[#384054] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    {getHazardIcon(h.hazard_type)}
                    <span className="font-medium text-[#F3F4F6] text-[11px]">{h.hazard_type}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 rounded">
                    Rekognition {h.rekognition_confidence}%
                  </span>
                </div>
                <div className="text-[11px] text-[#9CA3AF]">{h.location_name}</div>
                <div className="text-[10px] text-[#6B7280] mt-1 flex items-center justify-between">
                  <span>ID: {h.hazard_id}</span>
                  <span>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. AWS TELEMETRY FOOTER */}
      <div className="mt-auto p-3.5 bg-[#08090D] border-t border-[#232733] text-[10px] text-[#6B7280] space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>AWS API Gateway (HTTP REST)</span>
          </span>
          <span className="text-[#9CA3AF] font-medium">{lambdaMetadata.gatewayLatencyMs}ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-blue-400" />
            <span>AWS Lambda Route Optimizer</span>
          </span>
          <span className="text-[#9CA3AF] font-medium">
            {lambdaMetadata.executionTimeMs}ms ({lambdaMetadata.memoryAllocatedMB}MB)
          </span>
        </div>
      </div>
    </aside>
  );
}
