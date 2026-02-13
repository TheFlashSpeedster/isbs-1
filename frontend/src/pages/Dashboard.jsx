import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import ProviderDashboard from "./ProviderDashboard.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "CUSTOMER";

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: "/dashboard" } });
    }
  }, [navigate, token]);

  if (!token) {
    return null;
  }

  if (role === "PROVIDER") {
    return <ProviderDashboard />;
  }

  if (role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}
