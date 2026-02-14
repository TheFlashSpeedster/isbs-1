import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import { services } from "../utils/services.js";

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 md:text-6xl lg:text-7xl">
              Find Home <span className="text-purple-600">Service/Repair</span>
              <br />
              <span className="text-purple-600">Near You</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Explore Best Home Service & Repair near you
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-gray-900 placeholder-gray-500 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-8 py-4 text-white font-semibold shadow-md hover:bg-purple-700 transition-colors duration-200"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Hero Image */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop"
                alt="Home Service"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Explore Best Home Service & Repair near you
          </h2>
        </div>
        
        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                const token = localStorage.getItem("token");
                if (!token) {
                  navigate("/login");
                  return;
                }
                navigate(`/book/${service.id}`);
              }}
              className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:scale-105 hover:shadow-md"
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${service.color} text-3xl`}>
                {service.icon}
              </div>
              <span className="text-sm font-semibold text-gray-900">{service.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Business Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Popular Business
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Sample Business Cards */}
            <ServiceCard 
              service={{
                id: "cleaning",
                name: "House Cleaning",
                icon: "🧹",
                price: 249,
                provider: "Jenny Wilson",
                address: "255 Grand Park Ave, New York",
                category: "Cleaning",
                color: "bg-purple-100"
              }}
            />
            <ServiceCard 
              service={{
                id: "repair",
                name: "House Repairing",
                icon: "🔧",
                price: 399,
                provider: "Ronaldo Epric",
                address: "412 N Tryon Street, New York",
                category: "Repair",
                color: "bg-blue-100"
              }}
            />
            <ServiceCard 
              service={{
                id: "cleaning",
                name: "Bathroom Cleaning",
                icon: "🧹",
                price: 199,
                provider: "Henny Wilson",
                address: "525 N Tryon Street, NC",
                category: "Cleaning",
                color: "bg-purple-100"
              }}
            />
            <ServiceCard 
              service={{
                id: "plumbing",
                name: "Plumbing Services",
                icon: "🚰",
                price: 349,
                provider: "Mike Johnson",
                address: "123 Main Street, Chicago",
                category: "Plumbing",
                color: "bg-pink-100"
              }}
            />
            <ServiceCard 
              service={{
                id: "electric",
                name: "Electrical Repair",
                icon: "💡",
                price: 399,
                provider: "Sarah Davis",
                address: "789 Park Avenue, Boston",
                category: "Electric",
                color: "bg-yellow-100"
              }}
            />
            <ServiceCard 
              service={{
                id: "painting",
                name: "House Painting",
                icon: "🎨",
                price: 499,
                provider: "Tom Anderson",
                address: "456 Oak Street, Seattle",
                category: "Painting",
                color: "bg-orange-100"
              }}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="h-8" onError={(e) => e.target.style.display = 'none'} />
              <span className="text-xl font-bold text-gray-900">Home Service</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <Link to="/" className="hover:text-purple-600">Home</Link>
              <a href="/#services" className="hover:text-purple-600">Services</a>
              <Link to="/about" className="hover:text-purple-600">About Us</Link>
            </nav>
            <p className="text-sm text-gray-500">
              © 2026 QuickSeva App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
