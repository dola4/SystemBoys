import React, { useState, useEffect } from "react";
import ChildList from "../components/ChildList";
import ActionList from "../components/ActionList";
import "./AdminDashboard.css";
import HistoriqueAdmin from "./HistoriqueAdmin";

const API = process.env.REACT_APP_API_URL;

export default function AdminDashboard({ onLogout }) {
  const [children, setChildren] = useState([]);
  const [activeTab, setActiveTab] = useState("children");

  function fetchChildren() {
    fetch(`${API}/children`)
      .then(res => res.json())
      .then(setChildren);
  }

  useEffect(() => {
    fetchChildren();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1 className="admin-title">Tableau de bord Admin</h1>
      <div className="admin-tabs">
        <button
          className="admin-logout-btn"
          onClick={onLogout}
          title="Déconnexion"
        >
          Déconnexion
        </button>
        <button
          className={activeTab === "children" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("children")}
        >
          Enfants
        </button>
        <button
          className={activeTab === "actions" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("actions")}
        >
          Actions
        </button>
        <button
          className={activeTab === "history" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("history")}
        >
          Historique
        </button>
      </div>
      <div className="admin-content">
      </div>
      <div className="admin-content">
        {activeTab === "children" && (
          <ChildList children={children} fetchChildren={fetchChildren} />
        )}
        {activeTab === "actions" && (
          <ActionList children={children} />
        )}
        {activeTab === "history" && (
          <HistoriqueAdmin children={children} />
        )}
      </div>
    </div>
  );
}
