'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const SeatMapPage = dynamic(() => import('./seat-map/page'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Venue Management System</h1>
      <div className="mb-12">
        <SeatMapPage />
      </div>
    </main>
  );
}
