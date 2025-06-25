import React, { useState } from "react";
import "./ChildList.css";
const API = process.env.REACT_APP_API_URL;

export default function ChildList({ children, fetchChildren }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    setLoading(true);
    fetch(`${API}/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then(res => res.json())
      .then(() => {
        setName("");
        fetchChildren();
        setLoading(false);
      });
  }

  return (
    <div className="childlist-root">
      <form onSubmit={handleAdd} className="childlist-form">
        <input
          type="text"
          placeholder="Nom de l'enfant"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="childlist-input"
        />
        <button
          type="submit"
          disabled={loading}
          className="childlist-btn-add"
        >
          {loading ? "Ajout..." : "Ajouter"}
        </button>
      </form>
      <ul className="childlist-list">
        {children.map(child => (
          <li key={child._id} className="childlist-li">
            <span className="childlist-name">{child.name}</span>
            <button
              onClick={() => {
                if (window.confirm(`Supprimer ${child.name} ?`)) {
                  fetch(`${API}/children/${child._id}`, {
                    method: "DELETE"
                  }).then(() => fetchChildren());
                }
              }}
              className="childlist-btn-delete"
            >Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
