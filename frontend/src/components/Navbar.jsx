import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetSocket } from "../utils/socket.js";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    resetSocket();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="h-8" onError={(e) => e.target.style.display = 'none'} />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-700 md:flex">
          <Link to="/" className="hover:text-purple-600">Home</Link>
          <a href="/#services" className="hover:text-purple-600">Services</a>
          <Link to="/about" className="hover:text-purple-600">About Us</Link>
          {token ? <Link to="/dashboard" className="hover:text-purple-600">Dashboard</Link> : null}
        </nav>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <div className="hidden text-sm text-gray-700 md:block">
                Hi, {user?.name || "User"}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
