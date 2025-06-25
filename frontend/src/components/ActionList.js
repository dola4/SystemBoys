import React, { useState, useEffect } from "react";
import "./ActionList.css";

const API = process.env.REACT_APP_API_URL;

export default function ActionList({ children }) {
  const [actions, setActions] = useState([]);
  const [name, setName] = useState("");
  const [value, setValue] = useState(1);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // id de l'action en édition
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState(1);
  const [editChildren, setEditChildren] = useState([]);

  useEffect(() => {
    fetchActions();
  }, []);

  function fetchActions() {
    fetch(`${API}/actions`)
      .then(res => res.json())
      .then(data => setActions(data));
  }

  function handleAdd(e) {
    e.preventDefault();
    setLoading(true);
    fetch(`${API}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value, children: selectedChildren }),
    })
      .then(res => res.json())
      .then(() => {
        setName("");
        setValue(1);
        setSelectedChildren([]);
        fetchActions();
        setLoading(false);
      });
  }

  function handleCheckbox(e) {
    const id = e.target.value;
    setSelectedChildren(prev =>
      prev.includes(id)
        ? prev.filter(childId => childId !== id)
        : [...prev, id]
    );
  }

  function startEdit(action) {
    setEditing(action._id);
    setEditName(action.name);
    setEditValue(action.value);
    setEditChildren(action.children || []);
  }

  function cancelEdit() {
    setEditing(null);
    setEditName("");
    setEditValue(1);
    setEditChildren([]);
  }

  function saveEdit(actionId) {
    fetch(`${API}/actions/${actionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        value: editValue,
        children: editChildren,
      }),
    })
      .then(res => res.json())
      .then(() => {
        fetchActions();
        cancelEdit();
      })
      .catch(err => {
        alert("Erreur lors de la sauvegarde !");
        console.error(err);
      });
  }

  function handleEditCheckbox(childId) {
    setEditChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  }

  return (
    <div className="actionlist-root">
      <form onSubmit={handleAdd} className="actionlist-form">
        <input
          type="text"
          placeholder="Nom de l'action"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="actionlist-input"
        />
        <input
          type="number"
          placeholder="+1 ou -1"
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          className="actionlist-input actionlist-number"
        />
        <span className="actionlist-pour">Pour :</span>
        {children.map(child => (
          <label key={child._id} className="actionlist-checkbox-label">
            <input
              type="checkbox"
              value={child._id}
              checked={selectedChildren.includes(child._id)}
              onChange={handleCheckbox}
              className="actionlist-checkbox"
            />
            {child.name}
          </label>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="actionlist-btn actionlist-btn-add"
        >
          {loading ? "Ajout..." : "Ajouter"}
        </button>
      </form>
      <ul className="actionlist-list">
        {actions.map(action => {
          const enfants = action.children && action.children
            .map(childId => {
              const child = children.find(c => String(c._id) === String(childId));
              return child ? child.name : null;
            })
            .filter(Boolean);
          if (editing === action._id) {
            // Mode édition
            return (
              <li key={action._id} className="actionlist-li actionlist-li-edit">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="actionlist-input-edit"
                />
                <input
                  type="number"
                  value={editValue}
                  onChange={e => setEditValue(Number(e.target.value))}
                  className="actionlist-input-edit actionlist-number"
                />
                <span className="actionlist-pour">Pour :</span>
                {children.map(child => (
                  <label key={child._id} className="actionlist-checkbox-label">
                    <input
                      type="checkbox"
                      value={child._id}
                      checked={editChildren.includes(child._id)}
                      onChange={() => handleEditCheckbox(child._id)}
                      className="actionlist-checkbox"
                    />
                    {child.name}
                  </label>
                ))}
                <button
                  onClick={() => saveEdit(action._id)}
                  className="actionlist-btn actionlist-btn-save"
                >Enregistrer</button>
                <button
                  onClick={cancelEdit}
                  className="actionlist-btn actionlist-btn-cancel"
                >Annuler</button>
              </li>
            );
          }
          // Mode affichage normal
          return (
            <li key={action._id} className="actionlist-li">
              <span className="actionlist-name">{action.name}</span>
              <span className="actionlist-value">
                ({action.value > 0 ? "+" : ""}{action.value})
              </span>
              {enfants.length > 0 ? <span className="actionlist-enfants"> — <b>{enfants.join(", ")}</b></span> : null}
              <button
                onClick={() => startEdit(action)}
                className="actionlist-btn actionlist-btn-edit"
              >Modifier</button>
              <button
                onClick={() => {
                  if (window.confirm(`Supprimer l'action "${action.name}" ?`)) {
                    fetch(`${API}/actions/${action._id}`, {
                      method: "DELETE"
                    }).then(() => fetchActions());
                  }
                }}
                className="actionlist-btn actionlist-btn-delete"
              >Supprimer</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
