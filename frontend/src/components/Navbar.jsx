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
    <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-display font-bold text-white">
          Instant Service
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
          <Link to="/" className="hover:text-white">Home</Link>
          <a href="#services" className="hover:text-white">Services</a>
          {token ? <Link to="/dashboard" className="hover:text-white">Dashboard</Link> : null}
        </nav>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <div className="hidden text-sm text-slate-300 md:block">
                Hi, {user?.name || "User"}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-400"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
