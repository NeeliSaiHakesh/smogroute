import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'SmogRoute — Clean-Air Pedestrian & Cyclist Routing Engine',
  description: 'Deterministic micro-exposure route comparison and crowdsourced hazard reporting.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FFFFFF] text-[#111827] min-h-screen antialiased selection:bg-emerald-50 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
