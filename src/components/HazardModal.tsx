'use client';

import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Database 
} from 'lucide-react';
import { HazardPin, HazardType, RekognitionVerificationResponse } from '@/types';
import { DEMO_HAZARD_SAMPLES } from '@/lib/mockData';

interface HazardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedHazardAdded: (hazard: HazardPin) => void;
  initialCoords: { lat: number; lng: number };
  onStartLocationPick: () => void;
}

export default function HazardModal({
  isOpen,
  onClose,
  onVerifiedHazardAdded,
  initialCoords,
  onStartLocationPick,
}: HazardModalProps) {
  const [hazardType, setHazardType] = useState<HazardType>('Garbage Burning');
  const [locationName, setLocationName] = useState<string>('Shahbad Daulatpur Junction');
  const coords = initialCoords;
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample-garbage');
  const [uploadedFileName, setUploadedFileName] = useState<string>('waste_incineration_detected.jpg');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<RekognitionVerificationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectSample = (sample: typeof DEMO_HAZARD_SAMPLES[0]) => {
    setSelectedSampleId(sample.id);
    setHazardType(sample.type);
    setUploadedFileName(sample.fileName);
    setVerificationResult(null);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setSelectedSampleId('');
      setVerificationResult(null);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMsg(null);
    setVerificationResult(null);

    try {
      // Step 1: Call Amazon Rekognition / SageMaker endpoint mock
      const rekognitionRes = await fetch('/api/rekognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazardType,
          sampleId: selectedSampleId,
          fileName: uploadedFileName,
          coordinates: coords,
        }),
      });

      const rekData = await rekognitionRes.json();
      const verification: RekognitionVerificationResponse = rekData.body;
      setVerificationResult(verification);

      if (verification.verificationStatus === 'VERIFIED') {
        // Step 2: Store in DynamoDB table
        const newHazard: HazardPin = {
          hazard_id: `hz-del-${Math.random().toString(36).substring(2, 7)}`,
          hazard_type: hazardType,
          coordinates: coords,
          location_name: locationName || `${hazardType} near ${coords.lat}, ${coords.lng}`,
          timestamp: Date.now(),
          status: 'VERIFIED',
          rekognition_confidence: verification.confidenceScore,
          detected_labels: verification.detectedLabels,
          reporter_id: `usr-node-${Math.floor(1000 + Math.random() * 9000)}`,
          ttl_expires_at: Math.floor(Date.now() / 1000) + 14400,
        };

        const ddbRes = await fetch('/api/dynamodb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newHazard),
        });

        if (ddbRes.ok) {
          setTimeout(() => {
            onVerifiedHazardAdded(newHazard);
            onClose();
          }, 1200);
        }
      } else {
        setErrorMsg('Computer vision verification failed: Image labels do not match reported hazard criteria.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to verification endpoints: ' + (err as Error).message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden text-gray-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-sm font-medium text-gray-900">Report Micro-Pollution Hazard</h2>
            <p className="text-xs text-gray-500">
              Amazon Rekognition verification with DynamoDB incident ledger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Field Minimal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* FIELD 1: Hazard Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              1. Hazard Classification
            </label>
            <select
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value as HazardType)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none transition-colors"
            >
              <option value="Garbage Burning">Garbage Burning (Open Waste Combustion)</option>
              <option value="Construction Dust">Construction Dust (Unmitigated Aggregates)</option>
              <option value="Diesel Smoke">Diesel Smoke (Heavy Transport Exhaust)</option>
              <option value="Road Spill">Road Spill (Chemical / Residue Obstruct)</option>
            </select>
          </div>

          {/* FIELD 2: Location Tag */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">2. Location Coordinates</label>
              <button
                type="button"
                onClick={() => {
                  onStartLocationPick();
                  onClose();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Pin on Map</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Location description"
                className="col-span-2 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
              />
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-600 flex items-center justify-center font-mono">
                {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
              </div>
            </div>
          </div>

          {/* FIELD 3: Image Evidence & Rekognition Trigger */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              3. Image Evidence (Automated Rekognition Verification)
            </label>

            {/* Test Samples Selector for Instant Verification Testing */}
            <div className="text-[11px] text-gray-500 mb-1.5">Demo Evidence Samples:</div>
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {DEMO_HAZARD_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-colors ${
                    selectedSampleId === s.id
                      ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-medium shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="truncate">{s.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">{s.fileName}</div>
                </button>
              ))}
            </div>

            {/* Custom File Upload Option */}
            <div className="flex items-center space-x-2">
              <label className="flex-1 flex items-center justify-center space-x-2 border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600 truncate">
                  {uploadedFileName ? uploadedFileName : 'Upload custom photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Verification Results Panel */}
          {verificationResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                verificationResult.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-medium">
                  {verificationResult.verificationStatus === 'VERIFIED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>Rekognition {verificationResult.verificationStatus}</span>
                </div>
                <span className="font-mono text-xs font-medium">
                  Confidence: {verificationResult.confidenceScore}%
                </span>
              </div>

              {/* Detected Labels Pill */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {verificationResult.detectedLabels.map((l, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-800 shadow-2xs"
                  >
                    {l.Name}: {l.Confidence}%
                  </span>
                ))}
              </div>

              <div className="text-[10px] text-gray-500 pt-1.5 border-t border-gray-200/60 flex items-center justify-between">
                <span>DynamoDB Table: SmogRoute_MicroHazards_Prod</span>
                <span className="font-mono">{verificationResult.awsExecutionMetadata.inferenceLatencyMs}ms latency</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-900 hover:bg-black text-white transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              {isVerifying ? (
                <>
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying via Rekognition...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Submit & Verify</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
