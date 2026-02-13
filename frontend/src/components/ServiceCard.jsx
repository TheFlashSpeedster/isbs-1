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
    <div className="glass-panel rounded-3xl p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20 text-xl text-primary-100">
          {service.icon}
        </div>
        <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-200">
          {service.arrival}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{service.name}</h3>
      <p className="mt-1 text-sm text-slate-300">Starting at Rs {service.price}</p>
      <button
        onClick={handleBook}
        className="mt-6 w-full rounded-full bg-primary-500 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-400"
      >
        Book Now
      </button>
    </div>
  );
}
