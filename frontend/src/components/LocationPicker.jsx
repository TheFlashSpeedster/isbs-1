import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px"
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

export default function LocationPicker({ onLocationSelect, initialLocation }) {
  const [selectedPosition, setSelectedPosition] = useState(
    initialLocation || defaultCenter
  );
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [manualLat, setManualLat] = useState(
    initialLocation?.lat?.toString() || "28.6139"
  );
  const [manualLng, setManualLng] = useState(
    initialLocation?.lng?.toString() || "77.2090"
  );

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const onMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedPosition({ lat, lng });
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    onLocationSelect?.({ lat, lng });
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
        setSelectedPosition({ lat, lng });
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
        onLocationSelect?.({ lat, lng });
        setIsLoadingGPS(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingGPS(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setLocationError("Please enter valid latitude and longitude");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocationError("Latitude must be between -90 and 90, Longitude between -180 and 180");
      return;
    }

    setLocationError("");
    setSelectedPosition({ lat, lng });
    onLocationSelect?.({ lat, lng });
  };

  useEffect(() => {
    if (initialLocation) {
      setSelectedPosition(initialLocation);
      setManualLat(initialLocation.lat.toFixed(6));
      setManualLng(initialLocation.lng.toFixed(6));
    }
  }, [initialLocation]);

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
          {isLoadingGPS ? (
            <>
              <span className="animate-spin">⌛</span>
              Detecting...
            </>
          ) : (
            <>
              📍 Auto Detect My Location
            </>
          )}
        </button>
        <button
          onClick={() => {
            const input = document.getElementById("manual-location-inputs");
            if (input) {
              input.classList.toggle("hidden");
            }
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          📝 Enter Manually
        </button>
      </div>

      {locationError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {locationError}
        </div>
      )}

      <div id="manual-location-inputs" className="hidden space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="28.6139"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="77.2090"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 mt-1"
            />
          </div>
        </div>
        <button
          onClick={handleManualUpdate}
          className="w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Update Location on Map
        </button>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-300">
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={selectedPosition}
            zoom={14}
            onClick={onMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            <Marker
              position={selectedPosition}
              draggable={true}
              onDragEnd={(event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                setSelectedPosition({ lat, lng });
                setManualLat(lat.toFixed(6));
                setManualLng(lng.toFixed(6));
                onLocationSelect?.({ lat, lng });
              }}
            />
          </GoogleMap>
        </LoadScript>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
        <strong>💡 How to select location:</strong>
        <ul className="mt-1 ml-4 list-disc space-y-1">
          <li>Click "Auto Detect" to use your current GPS location</li>
          <li>Click anywhere on the map to select a location</li>
          <li>Drag the red marker to adjust the position</li>
          <li>Enter coordinates manually if needed</li>
        </ul>
      </div>

      <div className="text-sm text-gray-600">
        <strong>Selected Location:</strong> {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
      </div>
    </div>
  );
}
