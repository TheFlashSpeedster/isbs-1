import React from "react";
import { useNavigate } from "react-router-dom";

export default function ServiceCard({ service }) {
  const navigate = useNavigate();

  const handleBook = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    navigate(`/book/${service.id}`);
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Service Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full ${service.color} text-5xl transition-transform group-hover:scale-110`}>
            {service.icon}
          </div>
        </div>
        {service.category && (
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              {service.category}
            </span>
          </div>
        )}
      </div>

      {/* Service Details */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
        
        {service.provider && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span className="text-purple-600">👤</span>
            <span>{service.provider}</span>
          </div>
        )}
        
        {service.address && (
          <div className="mt-1 flex items-start gap-2 text-sm text-gray-500">
            <span className="text-purple-600 mt-0.5">📍</span>
            <span className="line-clamp-2">{service.address}</span>
          </div>
        )}

        <button
          onClick={handleBook}
          className="mt-4 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
