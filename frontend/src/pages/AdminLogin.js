import React, { useState } from "react";
import "./AdminLogin.css";
const API = process.env.REACT_APP_API_URL;

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(`${API}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      onLogin();
    } else {
      setError("Mauvais mot de passe !");
      setPassword("");
    }
  }

  return (
    <div className="adminlogin-root">
      <form onSubmit={handleSubmit} className="adminlogin-form">
        <div className="adminlogin-title">
          Connexion Admin
        </div>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          autoFocus
          onChange={e => setPassword(e.target.value)}
          className="adminlogin-input"
        />
        <button type="submit" className="adminlogin-btn">
          Entrer
        </button>
        {error && (
          <div className="adminlogin-error">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
