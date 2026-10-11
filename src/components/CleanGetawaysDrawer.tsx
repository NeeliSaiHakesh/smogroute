'use client';

import React, { useState } from 'react';
import { 
  X, 
  Trees, 
  Navigation, 
  Wind, 
  Sparkles, 
  Loader2,
  Compass
} from 'lucide-react';
import { CleanGetawaySpot } from '@/types';

interface CleanGetawaysDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  spots: CleanGetawaySpot[];
  isLoading: boolean;
  onRouteHere: (spot: CleanGetawaySpot) => void;
  onSelectSpotOnMap: (spot: CleanGetawaySpot) => void;
  querySource?: string;
}

export default function CleanGetawaysDrawer({
  isOpen,
  onClose,
  spots,
  isLoading,
  onRouteHere,
  onSelectSpotOnMap,
  querySource = 'OpenStreetMap Overpass API (Live)',
}: CleanGetawaysDrawerProps) {
  const [filterCat, setFilterCat] = useState<string>('all');

  if (!isOpen) return null;

  const filteredSpots = spots.filter((s) => {
    if (filterCat === 'all') return true;
    return s.category === filterCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col text-gray-900 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">Clean Getaways & Holiday Spots</h2>
              <p className="text-xs text-gray-500">Parks, resorts & sanctuaries in low-AQI green belts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Telemetry Banner */}
        <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Overpass API Leisure & Tourism Nodes</span>
          </div>
          <span className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
            {querySource}
          </span>
        </div>

        {/* Filter categories */}
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center space-x-1.5 overflow-x-auto">
          {['all', 'nature_reserve', 'park', 'resort', 'theme_park'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                filterCat === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Spots' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Spots List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs text-gray-600">Querying OpenStreetMap Overpass leisure nodes...</p>
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs">No getaways found in this category.</p>
            </div>
          ) : (
            filteredSpots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => onSelectSpotOnMap(spot)}
                className="bg-white border border-gray-200 hover:border-emerald-400 rounded-xl p-4 shadow-xs transition-all flex flex-col space-y-2 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {spot.categoryLabel}
                    </span>
                    <h4 className="text-xs font-medium text-gray-900 mt-1">{spot.name}</h4>
                    <p className="text-[11px] text-gray-500">{spot.city}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Wind className="w-3 h-3 text-emerald-600" />
                      <span>{spot.aqi} AQI</span>
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {spot.treeCanopyIndex}% Canopy
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 line-clamp-2">
                  {spot.description}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                  <span className="text-[11px] text-gray-400 font-mono">
                    {spot.lat.toFixed(3)}, {spot.lng.toFixed(3)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRouteHere(spot);
                      onClose();
                    }}
                    className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 shadow-2xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Route Here</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500 text-center">
          OpenStreetMap Overpass API · Verified Clean Air Holiday Zones
        </div>
      </div>
    </div>
  );
}
