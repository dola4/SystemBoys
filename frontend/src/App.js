import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PointagePage from "./pages/PointagePage";

export default function App() {
  const [admin, setAdmin] = useState(false);

  return (
    <Router>
      <nav style={{ padding: 12, background: "#d6f5f5" }}>
        <Link to="/pointage" style={{ marginRight: 16 }}>Zone enfants</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/pointage" element={<PointagePage />} />
        <Route
          path="/admin"
          element={
            admin ? (
              <AdminDashboard onLogout={() => setAdmin(false)} />
            ) : (
              <AdminLogin onLogin={() => setAdmin(true)} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/pointage" />} />
      </Routes>
    </Router>
  );
}
