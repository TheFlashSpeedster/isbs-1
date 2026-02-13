import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import { services } from "../utils/services.js";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-glow opacity-40" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-20 md:flex-row">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-slate-200">
              Fast help for rural and urban homes
            </div>
            <h1 className="mt-6 text-4xl font-display font-bold text-white md:text-5xl">
              House Help in 15 Minutes. Guaranteed.
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Simple booking for cooking, electrician, plumbing, and misc tasks. Trusted pros arrive quickly.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/register")}
                className="rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-primary-400"
              >
                Book Now
              </button>
              <button
                onClick={() => navigate("/book/cooking?emergency=1")}
                className="rounded-full bg-emergency px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-red-500"
              >
                Need Help in 5 Minutes?
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-300">
              <div>
                <div className="text-lg font-semibold text-white">Trusted</div>
                Verified professionals
              </div>
              <div>
                <div className="text-lg font-semibold text-white">15 mins</div>
                On-time guarantee
              </div>
            </div>
          </div>
          <div className="relative w-full max-w-md">
            <div className="glass-panel animate-float rounded-[32px] p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Live Dispatch</h3>
                <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-200">Online</span>
              </div>
              <div className="mt-6 space-y-4">
                {services.slice(0, 3).map((service) => (
                  <div key={service.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/20 text-lg text-primary-200">
                        {service.icon}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">{service.name}</div>
                        <div className="text-xs text-slate-400">Near you, ready to dispatch</div>
                      </div>
                    </div>
                    <span className="text-xs text-accent-200">{service.arrival}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-primary-500/20 p-4 text-sm text-primary-100">
                Clear pricing in rupees and simple booking steps.
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-accent-500/30 blur-2xl" />
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">Services</h2>
            <p className="mt-2 text-sm text-slate-400">Easy for towns and cities, quick for emergencies.</p>
          </div>
          {localStorage.getItem("token") ? (
            <Link to="/dashboard" className="hidden text-sm text-primary-200 hover:text-white md:block">
              View Dashboard
            </Link>
          ) : null}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="glass-panel rounded-3xl p-8 shadow-card">
          <h3 className="text-xl font-semibold text-white">Built for India</h3>
          <p className="mt-2 text-sm text-slate-300">
            Clear rupee pricing, Hindi-friendly support scripts, and reliable help whether you live in a city
            apartment or a rural home. Instant assignment keeps things simple and fast.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
            <span className="rounded-full bg-white/10 px-3 py-1">Rural access</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Urban speed</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Transparent pricing</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>Instant Service Booking System - Fast help, simple booking</p>
          <p>Support: hello@instantservice.dev</p>
        </div>
      </footer>
    </div>
  );
}
