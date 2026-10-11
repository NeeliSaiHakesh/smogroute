'use client';

import React, { useState } from 'react';
import { X, Bookmark, Check, TrendingDown } from 'lucide-react';
import { RouteComparisonResult, SavedRoute } from '@/types';

interface SaveRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: RouteComparisonResult | null;
  onSaveRoute: (route: SavedRoute) => void;
}

export default function SaveRouteModal({
  isOpen,
  onClose,
  comparison,
  onSaveRoute,
}: SaveRouteModalProps) {
  const [label, setLabel] = useState<string>('Daily Clean Commute');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen || !comparison) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSaved: SavedRoute = {
      id: `fav-${Date.now()}`,
      label: label.trim() || `${comparison.originName.split(',')[0]} ➔ ${comparison.destinationName.split(',')[0]}`,
      originName: comparison.originName,
      destinationName: comparison.destinationName,
      originCoords: comparison.originCoords,
      destinationCoords: comparison.destinationCoords,
      distanceKm: comparison.cleanRoute.distanceKm,
      durationMins: comparison.cleanRoute.durationMins,
      pm25ReductionPercent: comparison.particulateReductionPercent,
      avgCleanAqi: comparison.cleanRoute.avgAqi,
      savedAt: Date.now(),
    };

    onSaveRoute(newSaved);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden text-gray-900 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">Bookmark Clean Corridor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom Route Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Home ➔ Office, Gym Run, Campus Walk"
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs space-y-1">
            <div className="text-[11px] text-gray-500">Waypoints:</div>
            <div className="font-medium text-gray-800 truncate">
              {comparison.originName.split(',')[0]} ➔ {comparison.destinationName.split(',')[0]}
            </div>
            <div className="flex items-center space-x-3 text-[11px] pt-1 text-gray-600">
              <span>{comparison.cleanRoute.distanceKm} km</span>
              <span>·</span>
              <span>{comparison.cleanRoute.durationMins}m duration</span>
              <span>·</span>
              <span className="text-emerald-700 font-medium flex items-center space-x-0.5">
                <TrendingDown className="w-3 h-3" />
                <span>-{comparison.particulateReductionPercent}% PM2.5</span>
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaved}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-gray-900 hover:bg-black text-white flex items-center space-x-1.5 shadow-sm"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Route</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
