'use client';

import React from 'react';
import { X, Trees, Navigation, Wind } from 'lucide-react';
import { CleanGetawaySpot } from '@/types';

interface GetawayCardProps {
  spot: CleanGetawaySpot | null;
  onClose: () => void;
  onRouteHere: (spot: CleanGetawaySpot) => void;
}

export default function GetawayCard({ spot, onClose, onRouteHere }: GetawayCardProps) {
  if (!spot) return null;

  return (
    <div className="absolute top-28 right-4 z-[450] w-80 bg-white border border-emerald-300 shadow-xl rounded-2xl p-4 text-gray-900 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Trees className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {spot.categoryLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-900 leading-snug">{spot.name}</h3>
      <p className="text-[11px] text-gray-500 mt-0.5">{spot.city}</p>

      {/* AQI & Canopy Metrics */}
      <div className="my-2.5 p-2 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-emerald-800 font-medium">
          <Wind className="w-3.5 h-3.5 text-emerald-600" />
          <span>{spot.aqi} AQI · Pristine Air</span>
        </div>
        <span className="text-[10px] text-emerald-700 font-medium">
          {spot.treeCanopyIndex}% Canopy
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
        {spot.description}
      </p>

      {/* Route Here Button */}
      <button
        onClick={() => onRouteHere(spot)}
        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
      >
        <Navigation className="w-3.5 h-3.5" />
        <span>Route Here (Clean Air Corridor)</span>
      </button>
    </div>
  );
}
