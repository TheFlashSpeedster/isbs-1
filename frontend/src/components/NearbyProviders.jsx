import React, { useEffect, useState, useRef } from "react";
import api from "../utils/api.js";

export default function NearbyProviders({ serviceType, userLocation, selectedProvider, onProviderSelect, onProvidersLoad }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!serviceType || !userLocation?.latitude || !userLocation?.longitude) return;
    if (isFetchingRef.current) return; // Prevent concurrent requests

    const fetchNearbyProviders = async () => {
      isFetchingRef.current = true;
      setLoading(true);
      setError("");
      
      try {
        const response = await api.post("/nearby-providers", {
          serviceType,
          userLocation: {
            latitude: parseFloat(userLocation.latitude),
            longitude: parseFloat(userLocation.longitude)
          }
        });
        
        const fetchedProviders = response.data.providers || [];
        setProviders(fetchedProviders);
        onProvidersLoad?.(fetchedProviders);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load nearby providers");
        setProviders([]);
        onProvidersLoad?.([]);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchNearbyProviders();
  }, [serviceType, userLocation?.latitude, userLocation?.longitude]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">📍 Nearby Providers</h3>
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="animate-spin inline-block">⌛</div> Finding nearby providers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">📍 Nearby Providers</h3>
        <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          {error}
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">📍 Nearby Providers</h3>
        <div className="mt-4 text-center text-sm text-gray-600">
          No providers available in your area at the moment.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">📍 Nearby Providers</h3>
        <span className="text-xs text-gray-600">{providers.length} available</span>
      </div>
      
      <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
        {providers.map((provider, index) => {
          const isSelected = selectedProvider?.id === provider.id;
          const isNearest = index === 0;
          
          return (
            <div
              key={provider.id}
              onClick={() => onProviderSelect?.(provider)}
              className={`rounded-lg p-4 border transition-all cursor-pointer ${
                isSelected
                  ? "bg-green-50 border-green-400 ring-2 ring-green-300"
                  : isNearest
                  ? "bg-purple-50 border-purple-300 ring-2 ring-purple-200 hover:bg-purple-100"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    {isSelected && (
                      <span className="inline-flex items-center rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                        ✓ Selected
                      </span>
                    )}
                    {!isSelected && isNearest && (
                      <span className="inline-flex items-center rounded-full bg-purple-600 px-2 py-1 text-xs font-semibold text-white">
                        Nearest
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{provider.name}</h4>
                      {provider.rating && (
                        <span className="text-xs text-yellow-600">⭐ {provider.rating}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        📍 {provider.distanceKm} km away
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱️ ~{provider.etaMinutes} min ETA
                      </span>
                    </div>
                  </div>
                </div>
                {provider.availability && (
                  <span className="flex-shrink-0 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Available
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {providers.length > 0 && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          <strong>💡 {selectedProvider ? "Custom Selection:" : "Smart Assignment:"}</strong>{" "}
          {selectedProvider 
            ? `${selectedProvider.name} will be assigned to your booking.`
            : "Click on any provider to select them, or we'll auto-assign the nearest one."
          }
        </div>
      )}
    </div>
  );
}
