import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px"
};

export default function ProvidersMap({ 
  userLocation, 
  providers = [], 
  onLocationSelect, 
  selectedProvider,
  onProviderSelect 
}) {
  const [map, setMap] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [manualLat, setManualLat] = useState(userLocation?.lat?.toString() || "31.2520");
  const [manualLng, setManualLng] = useState(userLocation?.lng?.toString() || "75.7050");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const center = userLocation || { lat: 31.2520, lng: 75.7050 };

  // Log providers for debugging
  useEffect(() => {
    console.log("ProvidersMap - providers updated:", providers.length, providers);
    console.log("ProvidersMap - userLocation:", userLocation);
    console.log("ProvidersMap - isScriptLoaded:", isScriptLoaded);
  }, [providers, userLocation, isScriptLoaded]);

  // Update map bounds when providers change
  useEffect(() => {
    if (map && providers.length > 0) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        
        // Include user location
        if (userLocation) {
          bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
        }
        
        // Include all provider locations
        providers.forEach(provider => {
          bounds.extend({ 
            lat: provider.location.latitude, 
            lng: provider.location.longitude 
          });
        });
        
        map.fitBounds(bounds);
      } catch (err) {
        console.error("Error fitting bounds:", err);
      }
    }
  }, [map, providers, userLocation]);

  const onMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    onLocationSelect?.({ lat, lng });
    setSelectedMarker(null);
  }, [onLocationSelect]);

  const handleAutoDetect = () => {
    setIsLoadingGPS(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
        onLocationSelect?.({ lat, lng });
        setIsLoadingGPS(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setLocationError("Please enter valid coordinates");
      return;
    }

    setLocationError("");
    onLocationSelect?.({ lat, lng });
  };

  const handleProviderClick = (provider) => {
    setSelectedMarker(provider.id);
    onProviderSelect?.(provider);
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
        <strong>⚠️ Google Maps API Key Missing</strong>
        <p className="mt-1">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable map features.</p>
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Latitude"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
            />
            <input
              type="number"
              step="0.000001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="Longitude"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
            />
          </div>
          <button
            onClick={handleManualUpdate}
            className="w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Set Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAutoDetect}
          disabled={isLoadingGPS}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          <span>📍</span>
          {isLoadingGPS ? "Detecting..." : "Auto Detect My Location"}
        </button>
        
        <button
          onClick={() => {
            const coords = prompt("Enter coordinates as: latitude, longitude\nExample: 31.2520, 75.7050");
            if (coords) {
              const [lat, lng] = coords.split(",").map(s => parseFloat(s.trim()));
              if (!isNaN(lat) && !isNaN(lng)) {
                setManualLat(lat.toFixed(6));
                setManualLng(lng.toFixed(6));
                onLocationSelect?.({ lat, lng });
              }
            }
          }}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <span>✏️</span>
          Enter Manually
        </button>
      </div>

      {locationError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {locationError}
        </div>
      )}

      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        onLoad={() => setIsScriptLoaded(true)}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          onClick={onMapClick}
          onLoad={setMap}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true
          }}
        >
          {/* User Location Marker (Blue) */}
          {userLocation && (
            <Marker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              icon={window.google ? {
                url: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3e%3ccircle cx='12' cy='12' r='10' fill='%233B82F6' stroke='white' stroke-width='3'/%3e%3c/svg%3e",
                scaledSize: new window.google.maps.Size(24, 24)
              } : undefined}
              title="Your Location"
            />
          )}

          {/* Provider Markers (Red/Purple/Green) */}
          {providers.length > 0 && providers.map((provider, index) => {
            const isSelected = selectedProvider?.id === provider.id;
            const isNearest = index === 0;
            const color = isSelected ? "%2310B981" : isNearest ? "%239333EA" : "%23EF4444";
            const scale = isSelected ? 28 : isNearest ? 24 : 20;
            
            return (
              <Marker
                key={provider.id}
                position={{ 
                  lat: provider.location.latitude, 
                  lng: provider.location.longitude 
                }}
                icon={window.google ? {
                  url: `data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='${scale}' height='${scale}' viewBox='0 0 24 24'%3e%3ccircle cx='12' cy='12' r='10' fill='${color}' stroke='white' stroke-width='3'/%3e%3c/svg%3e`,
                  scaledSize: new window.google.maps.Size(scale, scale)
                } : undefined}
                title={provider.name}
                onClick={() => handleProviderClick(provider)}
              />
            );
          })}

          {/* Info Window for selected provider */}
          {selectedMarker && providers.find(p => p.id === selectedMarker) && (
            <InfoWindow
              position={{
                lat: providers.find(p => p.id === selectedMarker).location.latitude,
                lng: providers.find(p => p.id === selectedMarker).location.longitude
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <h4 className="font-semibold text-gray-900">
                  {providers.find(p => p.id === selectedMarker).name}
                </h4>
                <div className="mt-1 text-xs text-gray-600">
                  <div>⭐ {providers.find(p => p.id === selectedMarker).rating}</div>
                  <div>📍 {providers.find(p => p.id === selectedMarker).distanceKm} km away</div>
                  <div>⏱️ ~{providers.find(p => p.id === selectedMarker).etaMinutes} min ETA</div>
                </div>
                <button
                  onClick={() => {
                    onProviderSelect?.(providers.find(p => p.id === selectedMarker));
                    setSelectedMarker(null);
                  }}
                  className="mt-2 w-full rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700"
                >
                  Select This Provider
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
        <div className="font-semibold mb-2">🗺️ Map Legend:</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></span>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-600 border-2 border-white"></span>
            <span>Nearest Provider</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 border-2 border-white"></span>
            <span>Other Providers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
            <span>Selected Provider</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p>💡 <strong>Tip:</strong> Click anywhere on the map to set your location</p>
        <p>💡 <strong>Tip:</strong> Click on provider markers to view details and select them</p>
      </div>
    </div>
  );
}
