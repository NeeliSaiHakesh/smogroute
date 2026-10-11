'use client';

import React from 'react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  ArrowRight, 
  TrendingDown, 
  Check, 
  Database,
  Compass
} from 'lucide-react';
import { SavedRoute } from '@/types';

interface SavedRoutesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoutes: SavedRoute[];
  onLoadRoute: (route: SavedRoute) => void;
  onDeleteRoute: (routeId: string) => void;
}

export default function SavedRoutesDrawer({
  isOpen,
  onClose,
  savedRoutes,
  onLoadRoute,
  onDeleteRoute,
}: SavedRoutesDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col text-gray-900 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">Saved Places & Routes</h2>
              <p className="text-xs text-gray-500">Quick-load frequent clean corridors across India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Telemetry Banner */}
        <div className="px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>AWS DynamoDB User Profile</span>
          </div>
          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Synced · Active
          </span>
        </div>

        {/* Routes List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {savedRoutes.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs">No saved routes yet.</p>
              <p className="text-[11px] text-gray-400">
                Click &apos;Save Route&apos; on the bottom comparison card to bookmark any corridor.
              </p>
            </div>
          ) : (
            savedRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-4 shadow-xs transition-all group flex flex-col space-y-2.5"
              >
                {/* Title & Delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-gray-900">{route.label}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRoute(route.id);
                    }}
                    title="Delete saved route"
                    className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Origin / Destination text */}
                <div className="text-[11px] text-gray-500 flex items-center space-x-1.5">
                  <span className="font-medium text-gray-700 truncate max-w-[150px]">
                    {route.originName.split(',')[0]}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-700 truncate max-w-[150px]">
                    {route.destinationName.split(',')[0]}
                  </span>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-center bg-gray-50 rounded-lg p-2 text-xs">
                  <div>
                    <div className="text-[10px] text-gray-500">Distance</div>
                    <div className="font-medium text-gray-800">{route.distanceKm} km</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Duration</div>
                    <div className="font-medium text-gray-800">{route.durationMins}m</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">PM2.5 Saved</div>
                    <div className="font-medium text-emerald-700 flex items-center justify-center space-x-0.5">
                      <TrendingDown className="w-3 h-3" />
                      <span>-{route.pm25ReductionPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Load Route Button */}
                <button
                  onClick={() => {
                    onLoadRoute(route);
                    onClose();
                  }}
                  className="w-full py-1.5 px-3 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  <span>Load Corridor & Recalculate</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500 text-center">
          Persisted locally in browser localStorage and synced to DynamoDB
        </div>
      </div>
    </div>
  );
}
