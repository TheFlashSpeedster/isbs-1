import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../utils/api.js";

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    serviceType: "Cooking",
    latitude: "28.6139",
    longitude: "77.209"
  });

  const isLogin = mode === "login";

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post("/login", {
          email: form.email,
          password: form.password
        });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        await api.post("/register", form);
        const response = await api.post("/login", {
          email: form.email,
          password: form.password
        });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      const redirect = location.state?.from || "/dashboard";
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-6xl justify-center px-4 py-16">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-card">
          <h2 className="text-2xl font-display font-bold text-white">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin
              ? "Log in to book verified home professionals instantly."
              : "Start booking verified professionals in under a minute."}
          </p>
          {error ? (
            <div className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {!isLogin ? (
              <input
                type="text"
                name="name"
                placeholder="Full name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : null}
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {!isLogin ? (
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                required
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : null}
            {!isLogin ? (
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="CUSTOMER">👤 Customer</option>
                <option value="PROVIDER">🛠 Service Provider</option>
              </select>
            ) : null}
            {!isLogin && form.role === "PROVIDER" ? (
              <>
                <select
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Cooking">Cooking</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Misc">Misc</option>
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="number"
                    step="0.0001"
                    name="latitude"
                    placeholder="Latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    name="longitude"
                    placeholder="Longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </>
            ) : null}
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary-500 py-3 text-sm font-semibold text-white shadow-soft hover:bg-primary-400"
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-400">
            {isLogin ? "New to Instant Service?" : "Already have an account?"}{" "}
            <Link to={isLogin ? "/register" : "/login"} className="text-primary-200 hover:text-white">
              {isLogin ? "Sign up" : "Login"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
