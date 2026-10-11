'use client';

import React from 'react';
import { 
  Footprints, 
  Bike, 
  AlertTriangle, 
  Server, 
  MapPin, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { TravelMode } from '@/types';
import { PRESET_ROUTES } from '@/lib/mockData';

interface HeaderProps {
  travelMode: TravelMode;
  onModeChange: (mode: TravelMode) => void;
  selectedPresetId: string;
  onPresetChange: (id: string) => void;
  onOpenReportModal: () => void;
  onOpenArchModal: () => void;
  activeHazardsCount: number;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  travelMode,
  onModeChange,
  selectedPresetId,
  onPresetChange,
  onOpenReportModal,
  onOpenArchModal,
  activeHazardsCount,
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#232733] bg-[#0E1017] px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Area Segment */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          title="Toggle Navigation Panel"
          className={`p-1.5 rounded transition-colors ${
            isSidebarOpen 
              ? 'text-[#F3F4F6] bg-[#181B24] border border-[#272B38]' 
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#181B24] border border-transparent'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
            <span className="text-xs font-medium tracking-tight">S</span>
          </div>
          <span className="text-sm font-medium tracking-tight text-[#F3F4F6]">SmogRoute</span>
          <span className="text-[11px] text-[#6B7280] hidden sm:inline-block px-1.5 py-0.5 rounded border border-[#232733] bg-[#12141C]">
            v1.2
          </span>
        </div>

        {/* Region selector */}
        <div className="hidden md:flex items-center pl-3 border-l border-[#232733]">
          <div className="relative flex items-center">
            <MapPin className="w-3.5 h-3.5 text-[#6B7280] mr-1.5" />
            <select
              value={selectedPresetId}
              onChange={(e) => onPresetChange(e.target.value)}
              className="bg-transparent text-xs text-[#D1D5DB] hover:text-white cursor-pointer pr-6 py-1 focus:outline-none appearance-none font-medium"
            >
              {PRESET_ROUTES.map((route) => (
                <option key={route.id} value={route.id} className="bg-[#12141C] text-[#F3F4F6]">
                  {route.region}: {route.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#6B7280] pointer-events-none absolute right-1" />
          </div>
        </div>
      </div>

      {/* Mode & Action Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Travel Mode Toggle */}
        <div className="flex items-center bg-[#141721] p-0.5 rounded border border-[#232733]">
          <button
            onClick={() => onModeChange('pedestrian')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              travelMode === 'pedestrian'
                ? 'bg-[#202534] text-[#F3F4F6] font-medium shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#D1D5DB]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Walk</span>
          </button>
          <button
            onClick={() => onModeChange('cyclist')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              travelMode === 'cyclist'
                ? 'bg-[#202534] text-[#F3F4F6] font-medium shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#D1D5DB]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cycle</span>
          </button>
        </div>

        {/* Report Micro-Hazard */}
        <button
          onClick={onOpenReportModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#1E2330] hover:bg-[#262C3D] text-[#F3F4F6] border border-[#2E3547] transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Report Hazard</span>
          {activeHazardsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-[#2D1B1B] text-rose-400 border border-rose-900/50 rounded text-[10px]">
              {activeHazardsCount}
            </span>
          )}
        </button>

        {/* AWS Architecture Diagram */}
        <button
          onClick={onOpenArchModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#11131A] hover:bg-[#181B24] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232733] transition-colors"
        >
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Architecture</span>
        </button>

        {/* Live System Indicator */}
        <div className="hidden lg:flex items-center space-x-1.5 pl-2 border-l border-[#232733]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-[#9CA3AF]">Lambda: 14ms</span>
        </div>
      </div>
    </header>
  );
}
