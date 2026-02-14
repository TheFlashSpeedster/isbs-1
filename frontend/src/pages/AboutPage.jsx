import React from "react";
import Navbar from "../components/Navbar.jsx";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-md border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">About QuickSeva</h1>
          <p className="mt-4 text-sm text-gray-700">
            QuickSeva connects customers with verified home service professionals in minutes.
            From cleaning to repairs, our platform focuses on reliable dispatch, transparent pricing,
            and real-time tracking.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Trusted Providers</div>
              <p className="mt-2 text-xs text-gray-600">Background-verified professionals with visible ratings.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Fast Dispatch</div>
              <p className="mt-2 text-xs text-gray-600">Smart matching to the nearest available provider.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Live Updates</div>
              <p className="mt-2 text-xs text-gray-600">Real-time tracking and chat during each booking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
