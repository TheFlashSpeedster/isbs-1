import React from "react";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/book/:serviceId" element={<BookingPage />} />
      <Route path="/booking/:bookingId" element={<TrackingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
