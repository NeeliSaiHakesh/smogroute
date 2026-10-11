# SmogRoute

Minimalist, high-impact web application for clean-air pedestrian and cyclist routing, micro-pollution incident reporting, and pristine getaway discovery across India.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/NeeliSaiHakesh/smogroute)

---

## Overview

SmogRoute optimizes urban pedestrian and cyclist transit paths by calculating inhaled particulate matter ($PM_{2.5}$) exposure rather than just geometric distance. Standard navigation routes often direct pedestrians along heavy arterial corridors with severe vehicular emissions. SmogRoute identifies low-exposure green pathways through residential roads, parks, and tree-lined buffers, calculating estimated inhalation reduction based on active ventilation rates.

### Core Capabilities

1. **Clean Route vs Fast Route Exposure Engine**
   - Calculates comparative metrics between standard shortest path and optimized clean-air corridors.
   - Computes estimated inhaled particulate reduction percentage using active tidal ventilation physics ($0.9\text{ m}^3/\text{hr}$ walking, $2.1\text{ m}^3/\text{hr}$ cycling).
   - Real-time route telemetry: distance (km), estimated duration (mins), average AQI score, and $PM_{2.5}$ saved.

2. **Micro-Incident Crowdsource Reporting**
   - 3-field modal for real-time hazard logging (Hazard Type, Pin Location, Evidence Image).
   - Simulated Amazon Rekognition computer vision verification pipeline.
   - Dynamic marker generation and incident ledger updates.

3. **Clean Getaways & Eco-Corridors**
   - Integration with OpenStreetMap Overpass API for discovering parks, nature reserves, and eco-resorts.
   - Preset green corridors in Delhi, Mumbai, Bengaluru, and Hyderabad.
   - Single-click routing from current origin to low-pollution getaways.

4. **Saved Routes & Places**
   - Persistent favorite origin-destination pairs synced to browser local storage and simulated AWS DynamoDB user profile.
   - All-India OpenStreetMap Nominatim geocoding search with 300ms debounce.

---

## System Architecture

```
[ Client: Next.js 14 / React / Tailwind / Leaflet ]
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
[ Route Engine ] [ Geocoding ] [ Overpass POI ]
(Inhalation Math)(OSM Nominatim) (Leisure Nodes)
       │               │               │
       └───────────────┼───────────────┘
                       ▼
            [ Next.js API Routes ]
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
[ AWS Lambda ]  [ Rekognition ]  [ DynamoDB ]
Route Compute    Hazard Verify   Incident Store
```

### AWS Integration Architecture

- **AWS Lambda & API Gateway**: High-throughput serverless microservices execute Dijkstra / A* routing with pollution-weighted edge costs (`/api/routes`).
- **Amazon Rekognition**: Computer vision endpoint (`/api/rekognition`) analyzes crowdsourced hazard uploads for validation (smoke, open fire, construction particulate).
- **Amazon DynamoDB**: Key-value document store (`/api/dynamodb` and `/api/user/saved-locations`) maintaining spatial hazard pins and user saved routes with sub-millisecond retrieval.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet.js with OpenStreetMap standard tiles (Zero API key dependencies, watermark-free)
- **Icons**: Lucide React
- **Geocoding & POI**: OpenStreetMap Nominatim & Overpass API
- **Deployment**: Netlify / Vercel

---

## Local Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation

```bash
git clone https://github.com/NeeliSaiHakesh/smogroute.git
cd smogroute
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Deployment on Netlify

This repository includes a preconfigured `netlify.toml` file with the official `@netlify/plugin-nextjs` runtime:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

### Deploy Steps
1. Log in to [Netlify](https://app.netlify.com).
2. Click **Add new site** > **Import an existing project**.
3. Connect your GitHub account and select **NeeliSaiHakesh/smogroute**.
4. The build settings (`npm run build`, publish directory `.next`) will be auto-detected from `netlify.toml`.
5. Click **Deploy smogroute**.
