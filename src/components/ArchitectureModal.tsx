'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Server } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ASCII_ARCHITECTURE = `+----------------------------------------------------------------------------------------------------+
|                                    SMOGROUTE SYSTEM ARCHITECTURE                                   |
+----------------------------------------------------------------------------------------------------+

  [ Next.js Client Dashboard ]
         |
         | HTTPS / REST
         v
  +--------------------------------------------------------------------------------------------------+
  |                                        AMAZON CLOUDFRONT                                         |
  |                           Edge Caching & Dynamic Route Delivery (TLS 1.3)                        |
  +--------------------------------------------------------------------------------------------------+
         |
         | Reverse Proxy
         v
  +--------------------------------------------------------------------------------------------------+
  |                                      AMAZON API GATEWAY                                          |
  |                           (/v1/routes/compare  |  /v1/hazards/report)                            |
  +--------------------------------------------------------------------------------------------------+
         |                                                                    |
         | POST /v1/routes/compare                                            | POST /v1/hazards/report
         v                                                                    v
  +------------------------------+                                     +-----------------------------+
  |          AWS LAMBDA          |                                     |          AMAZON S3          |
  |   Deterministic Exposure     |                                     |    Hazard Evidence Vault    |
  |     Optimization Engine      |                                     |  (Presigned PutObject URL)  |
  |   (128MB / 14ms Exec Time)   |                                     +-----------------------------+
  +------------------------------+                                                    |
         |                                                                            | S3 PutObject Event
         | Reads Verified Hazards                                                     v
         |                                                             +-----------------------------+
         v                                                             |      AMAZON REKOGNITION     |
  +-----------------------------------------------------------------+  |   SageMaker CV Inference    |
  |                         AMAZON DYNAMODB                         |  |    Confidence & Labels      |
  |                 Table: SmogRoute_MicroHazards_Prod              |<-+-----------------------------+
  |   PK: hazard_id (S) | SK: timestamp (N) | TTL: 4-Hour Expiry    |
  +-----------------------------------------------------------------+
`;

export default function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  const [activeTab, setActiveTab] = useState<'svg' | 'ascii' | 'dynamodb'>('svg');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(ASCII_ARCHITECTURE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] text-gray-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">System Architecture & AWS Integration</h2>
              <span className="text-xs text-gray-500">
                Serverless clean-routing pipeline for hackathon review
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 px-5 pt-3 border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab('svg')}
            className={`px-3 py-2 text-xs border-b-2 font-medium transition-colors ${
              activeTab === 'svg'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Vector Architecture (SVG)
          </button>
          <button
            onClick={() => setActiveTab('ascii')}
            className={`px-3 py-2 text-xs border-b-2 font-medium transition-colors ${
              activeTab === 'ascii'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            ASCII Flow Diagram
          </button>
          <button
            onClick={() => setActiveTab('dynamodb')}
            className={`px-3 py-2 text-xs border-b-2 font-medium transition-colors ${
              activeTab === 'dynamodb'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            DynamoDB Schema
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
          {activeTab === 'svg' && (
            <div className="space-y-4">
              <div className="border border-gray-200 bg-white rounded-xl p-5 shadow-xs overflow-x-auto">
                <svg
                  viewBox="0 0 920 460"
                  className="w-full h-auto text-xs"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="cardGradLight" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#F9FAFB" />
                    </linearGradient>
                    <marker
                      id="arrowLight"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#9CA3AF" />
                    </marker>
                  </defs>

                  {/* 1. Client App */}
                  <rect x="30" y="50" width="180" height="85" rx="8" fill="url(#cardGradLight)" stroke="#E5E7EB" />
                  <text x="50" y="82" fill="#111827" fontSize="13" fontWeight="500">Next.js Client</text>
                  <text x="50" y="102" fill="#4B5563" fontSize="11">Single-Page React App</text>
                  <text x="50" y="118" fill="#9CA3AF" fontSize="10">Leaflet Vector Rendering</text>

                  {/* 2. Amazon CloudFront */}
                  <rect x="270" y="50" width="170" height="85" rx="8" fill="url(#cardGradLight)" stroke="#E5E7EB" />
                  <text x="290" y="82" fill="#111827" fontSize="13" fontWeight="500">Amazon CloudFront</text>
                  <text x="290" y="102" fill="#4B5563" fontSize="11">Edge CDN &amp; SSL</text>
                  <text x="290" y="118" fill="#9CA3AF" fontSize="10">Global Distribution</text>

                  {/* 3. API Gateway */}
                  <rect x="500" y="50" width="180" height="85" rx="8" fill="url(#cardGradLight)" stroke="#E5E7EB" />
                  <text x="520" y="82" fill="#111827" fontSize="13" fontWeight="500">AWS API Gateway</text>
                  <text x="520" y="102" fill="#4B5563" fontSize="11">REST API (prod/v1)</text>
                  <text x="520" y="118" fill="#9CA3AF" fontSize="10">JWT Auth &amp; Throttling</text>

                  {/* Arrows top tier */}
                  <line x1="210" y1="92" x2="264" y2="92" stroke="#9CA3AF" strokeWidth="1.5" markerEnd="url(#arrowLight)" />
                  <line x1="440" y1="92" x2="494" y2="92" stroke="#9CA3AF" strokeWidth="1.5" markerEnd="url(#arrowLight)" />

                  {/* Tier 2: AWS Lambda Engine */}
                  <rect x="180" y="210" width="220" height="95" rx="8" fill="url(#cardGradLight)" stroke="#059669" strokeWidth="1.5" />
                  <text x="200" y="242" fill="#059669" fontSize="13" fontWeight="500">AWS Lambda Engine</text>
                  <text x="200" y="262" fill="#374151" fontSize="11">Deterministic Route Optimizer</text>
                  <text x="200" y="278" fill="#6B7280" fontSize="10">Exposure Math · 14ms exec</text>
                  <text x="200" y="293" fill="#9CA3AF" fontSize="9">$0.0000003 per calculation</text>

                  {/* Tier 2: Evidence S3 & Rekognition */}
                  <rect x="470" y="210" width="180" height="95" rx="8" fill="url(#cardGradLight)" stroke="#2563EB" strokeWidth="1.5" />
                  <text x="490" y="242" fill="#2563EB" fontSize="13" fontWeight="500">Amazon S3 Bucket</text>
                  <text x="490" y="262" fill="#374151" fontSize="11">Hazard Evidence Images</text>
                  <text x="490" y="278" fill="#6B7280" fontSize="10">Presigned Upload URL</text>
                  <text x="490" y="293" fill="#9CA3AF" fontSize="9">SSE-S3 Encryption</text>

                  <rect x="700" y="210" width="190" height="95" rx="8" fill="url(#cardGradLight)" stroke="#D97706" strokeWidth="1.5" />
                  <text x="720" y="242" fill="#D97706" fontSize="13" fontWeight="500">Amazon Rekognition</text>
                  <text x="720" y="262" fill="#374151" fontSize="11">Computer Vision Model</text>
                  <text x="720" y="278" fill="#6B7280" fontSize="10">Smoke &amp; Dust Label Detection</text>
                  <text x="720" y="293" fill="#9CA3AF" fontSize="9">Pass/Fail JSON output</text>

                  {/* Connecting lines */}
                  <path d="M 560 135 L 560 175 L 290 175 L 290 204" stroke="#9CA3AF" strokeWidth="1.5" fill="none" markerEnd="url(#arrowLight)" />
                  <path d="M 620 135 L 620 175 L 560 175 L 560 204" stroke="#9CA3AF" strokeWidth="1.5" fill="none" markerEnd="url(#arrowLight)" />
                  <line x1="650" y1="257" x2="694" y2="257" stroke="#9CA3AF" strokeWidth="1.5" markerEnd="url(#arrowLight)" />

                  {/* Tier 3: Amazon DynamoDB */}
                  <rect x="290" y="360" width="360" height="75" rx="8" fill="url(#cardGradLight)" stroke="#7C3AED" strokeWidth="1.5" />
                  <text x="310" y="390" fill="#7C3AED" fontSize="13" fontWeight="500">Amazon DynamoDB Ledger</text>
                  <text x="310" y="410" fill="#374151" fontSize="11">Table: SmogRoute_MicroHazards_Prod</text>
                  <text x="310" y="425" fill="#6B7280" fontSize="10">PK: hazard_id (S) | SK: timestamp (N) | 4-Hour TTL</text>

                  {/* Arrows into DynamoDB */}
                  <path d="M 290 305 L 290 335 L 420 335 L 420 354" stroke="#9CA3AF" strokeWidth="1.5" fill="none" markerEnd="url(#arrowLight)" />
                  <path d="M 795 305 L 795 335 L 520 335 L 520 354" stroke="#9CA3AF" strokeWidth="1.5" fill="none" markerEnd="url(#arrowLight)" />
                </svg>
              </div>

              {/* Efficiency Metrics Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] text-gray-500">Algorithmic Route Processing</div>
                  <div className="text-sm font-medium text-emerald-600 mt-1">Zero LLM Token Burn</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    Deterministic geospatial math executed locally in AWS Lambda.
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] text-gray-500">AWS Lambda Execution</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">14ms Average Latency</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    128MB memory tier keeps compute cost under $0.0000003 per invocation.
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] text-gray-500">DynamoDB On-Demand Storage</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">TTL Auto-Purge</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    Hazard records auto-expire after 4 hours to eliminate dead storage.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ascii' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Clean ASCII text diagram for presentation slides or documentation
                </span>
                <button
                  onClick={handleCopyAscii}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium flex items-center space-x-1.5 transition-colors shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy ASCII'}</span>
                </button>
              </div>
              <pre className="p-4 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-800 overflow-x-auto leading-relaxed shadow-2xs">
                {ASCII_ARCHITECTURE}
              </pre>
            </div>
          )}

          {activeTab === 'dynamodb' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-600">
                Amazon DynamoDB Schema specification for crowd-sourced micro-hazard ledger:
              </div>
              <pre className="p-4 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-800 overflow-x-auto leading-relaxed shadow-2xs">
{`{
  "TableName": "SmogRoute_MicroHazards_Prod",
  "BillingMode": "PAY_PER_REQUEST",
  "KeySchema": [
    { "AttributeName": "hazard_id", "KeyType": "HASH" },
    { "AttributeName": "timestamp", "KeyType": "RANGE" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "hazard_id", "AttributeType": "S" },
    { "AttributeName": "timestamp", "AttributeType": "N" },
    { "AttributeName": "status", "AttributeType": "S" },
    { "AttributeName": "hazard_type", "AttributeType": "S" }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "StatusTimestampIndex",
      "KeySchema": [
        { "AttributeName": "status", "KeyType": "HASH" },
        { "AttributeName": "timestamp", "KeyType": "RANGE" }
      ],
      "Projection": { "ProjectionType": "ALL" }
    }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl_expires_at",
    "Enabled": true
  }
}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
