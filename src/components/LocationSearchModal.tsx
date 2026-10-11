'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Navigation, 
  Loader2, 
  ArrowUpDown
} from 'lucide-react';
import { GeocodingResult } from '@/types';
import { PRESET_ROUTES } from '@/lib/mockData';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute: (
    originName: string,
    destinationName: string,
    originCoords: [number, number],
    destinationCoords: [number, number]
  ) => void;
  currentOriginName: string;
  currentDestinationName: string;
  currentOriginCoords: [number, number];
  currentDestinationCoords: [number, number];
}

// Fallback Indian landmarks for fail-safe demo resilience
const POPULAR_INDIA_PLACES: Array<{ name: string; coords: [number, number]; city: string }> = [
  { name: 'Connaught Place, New Delhi', coords: [28.6315, 77.2167], city: 'Delhi' },
  { name: 'India Gate, New Delhi', coords: [28.6129, 77.2295], city: 'Delhi' },
  { name: 'Marine Drive, Mumbai', coords: [18.9438, 72.8232], city: 'Mumbai' },
  { name: 'Bandra Bandstand, Mumbai', coords: [19.0434, 72.8194], city: 'Mumbai' },
  { name: 'Koramangala 5th Block, Bengaluru', coords: [12.9352, 77.6245], city: 'Bengaluru' },
  { name: 'Cubbon Park, Bengaluru', coords: [12.9763, 77.5929], city: 'Bengaluru' },
  { name: 'Gachibowli Stadium, Hyderabad', coords: [17.4435, 78.3489], city: 'Hyderabad' },
  { name: 'Charminar, Hyderabad', coords: [17.3616, 78.4747], city: 'Hyderabad' },
];

export default function LocationSearchModal({
  isOpen,
  onClose,
  onSelectRoute,
  currentOriginName,
  currentDestinationName,
  currentOriginCoords,
  currentDestinationCoords,
}: LocationSearchModalProps) {
  const [originQuery, setOriginQuery] = useState(currentOriginName.split(' (')[0]);
  const [destQuery, setDestQuery] = useState(currentDestinationName.split(' (')[0]);

  const [originCoords, setOriginCoords] = useState<[number, number]>(currentOriginCoords);
  const [destCoords, setDestCoords] = useState<[number, number]>(currentDestinationCoords);

  const [originSuggestions, setOriginSuggestions] = useState<GeocodingResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodingResult[]>([]);

  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  const [activeInput, setActiveInput] = useState<'origin' | 'dest' | null>(null);

  const originTimerRef = useRef<NodeJS.Timeout | null>(null);
  const destTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search Nominatim with 300ms debounce
  const fetchNominatim = async (query: string): Promise<GeocodingResult[]> => {
    if (!query.trim() || query.length < 2) return [];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });
      if (res.ok) {
        const data: GeocodingResult[] = await res.json();
        return data;
      }
    } catch {
      // Fallback to local landmark filters if network blocked
    }
    // Fallback match
    const filtered = POPULAR_INDIA_PLACES.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) || p.city.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.map((f, idx) => ({
      place_id: 999000 + idx,
      lat: f.coords[0].toString(),
      lon: f.coords[1].toString(),
      display_name: f.name,
    }));
  };

  useEffect(() => {
    if (!originQuery || originQuery.length < 2) {
      setOriginSuggestions([]);
      return;
    }
    if (originTimerRef.current) clearTimeout(originTimerRef.current);
    setIsSearchingOrigin(true);
    originTimerRef.current = setTimeout(async () => {
      const results = await fetchNominatim(originQuery);
      setOriginSuggestions(results);
      setIsSearchingOrigin(false);
    }, 300);

    return () => {
      if (originTimerRef.current) clearTimeout(originTimerRef.current);
    };
  }, [originQuery]);

  useEffect(() => {
    if (!destQuery || destQuery.length < 2) {
      setDestSuggestions([]);
      return;
    }
    if (destTimerRef.current) clearTimeout(destTimerRef.current);
    setIsSearchingDest(true);
    destTimerRef.current = setTimeout(async () => {
      const results = await fetchNominatim(destQuery);
      setDestSuggestions(results);
      setIsSearchingDest(false);
    }, 300);

    return () => {
      if (destTimerRef.current) clearTimeout(destTimerRef.current);
    };
  }, [destQuery]);

  if (!isOpen) return null;

  const handleSelectOrigin = (item: GeocodingResult) => {
    const coords: [number, number] = [+parseFloat(item.lat).toFixed(5), +parseFloat(item.lon).toFixed(5)];
    setOriginCoords(coords);
    setOriginQuery(item.display_name.split(',')[0]);
    setOriginSuggestions([]);
    setActiveInput('dest');
  };

  const handleSelectDest = (item: GeocodingResult) => {
    const coords: [number, number] = [+parseFloat(item.lat).toFixed(5), +parseFloat(item.lon).toFixed(5)];
    setDestCoords(coords);
    setDestQuery(item.display_name.split(',')[0]);
    setDestSuggestions([]);
    setActiveInput(null);
  };

  const handleApply = () => {
    onSelectRoute(originQuery, destQuery, originCoords, destCoords);
    onClose();
  };

  const handleSwap = () => {
    const tempQ = originQuery;
    const tempC = originCoords;
    setOriginQuery(destQuery);
    setOriginCoords(destCoords);
    setDestQuery(tempQ);
    setDestCoords(tempC);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden text-gray-900 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-medium text-gray-900">Custom Route Across India</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-4 space-y-3 border-b border-gray-100 bg-gray-50/50">
          {/* Origin Input */}
          <div className="relative">
            <div className="flex items-center space-x-2 bg-white border border-gray-200 focus-within:border-blue-500 rounded-xl px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <input
                type="text"
                value={originQuery}
                onFocus={() => setActiveInput('origin')}
                onChange={(e) => setOriginQuery(e.target.value)}
                placeholder="Search Origin in India (e.g. Connaught Place, Bandra, Indiranagar)..."
                className="w-full bg-transparent text-xs text-gray-900 focus:outline-none placeholder-gray-400 font-medium"
              />
              {isSearchingOrigin && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            </div>

            {/* Origin Nominatim Dropdown */}
            {activeInput === 'origin' && originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {originSuggestions.map((item) => (
                  <button
                    key={item.place_id}
                    onClick={() => handleSelectOrigin(item)}
                    className="w-full text-left p-2.5 hover:bg-blue-50 text-xs flex items-start space-x-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="truncate text-gray-800 font-medium">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={handleSwap}
              type="button"
              className="p-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 shadow-2xs"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <div className="flex items-center space-x-2 bg-white border border-gray-200 focus-within:border-emerald-500 rounded-xl px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <input
                type="text"
                value={destQuery}
                onFocus={() => setActiveInput('dest')}
                onChange={(e) => setDestQuery(e.target.value)}
                placeholder="Search Destination in India (e.g. India Gate, BKC, MG Road)..."
                className="w-full bg-transparent text-xs text-gray-900 focus:outline-none placeholder-gray-400 font-medium"
              />
              {isSearchingDest && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            </div>

            {/* Destination Nominatim Dropdown */}
            {activeInput === 'dest' && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {destSuggestions.map((item) => (
                  <button
                    key={item.place_id}
                    onClick={() => handleSelectDest(item)}
                    className="w-full text-left p-2.5 hover:bg-emerald-50 text-xs flex items-start space-x-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="truncate text-gray-800 font-medium">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Metro Presets Shortcut */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Quick Metro Presets
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_ROUTES.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectRoute(p.origin.name, p.destination.name, p.origin.coords, p.destination.coords);
                  onClose();
                }}
                className="text-left p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs transition-colors flex flex-col"
              >
                <span className="font-medium text-gray-900 truncate">{p.name}</span>
                <span className="text-[10px] text-gray-500 mt-0.5">{p.region}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <span className="text-[11px] text-gray-500 flex items-center space-x-1">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>OpenStreetMap Nominatim API</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-colors"
            >
              Calculate Clean Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
