import React, { useState, useEffect } from "react";
import "./PointagePage.css";

const API = process.env.REACT_APP_API_URL;

export default function PointagePage() {
  const [children, setChildren] = useState([]);
  const [actions, setActions] = useState([]);
  const [scores, setScores] = useState({});
  const [bounce, setBounce] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [globalTotals, setGlobalTotals] = useState({});
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [resetDates, setResetDates] = useState({});
  const [cumulResets, setCumulResets] = useState({});
  const [resetConfirm, setResetConfirm] = useState({});
  const [resetPassword, setResetPassword] = useState({});
  const [resetError, setResetError] = useState({});

  useEffect(() => {
    fetch(`${API}/pointages/reset-cumul`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(r => (map[r.child] = r.date));
        setResetDates(map);
      });
  }, []);

  async function handleResetCumul(childId, password) {
    const res = await fetch(`${API}/pointages/reset-cumul/${childId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erreur inconnue");
    }
    // Recharge le cumul et la date de reset
    fetch(`${API}/pointages/reset-cumul`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(r => (map[r.child] = r.date));
        setResetDates(map);
      });
  }

  // Charger le draft du serveur d'abord
  useEffect(() => {
    fetch(`${API}/pointages/draft`)
      .then(res => res.json())
      .then(data => {
        if (data && data.scores) setScores(data.scores);
        setIsDraftLoaded(true);
      });
  }, []);

  // Sauver automatiquement les scores dans le draft du serveur à chaque changement
  useEffect(() => {
    if (isDraftLoaded) {
      fetch(`${API}/pointages/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });
    }
  }, [scores, isDraftLoaded]);

  useEffect(() => {
    if (children.length === 0) return;
    // Charger cumul "depuis dernier reset" pour chaque enfant
    Promise.all(
      children.map(child =>
        fetch(`${API}/pointages/cumul/${child._id}`).then(res => res.json())
      )
    ).then(arr => {
      const map = {};
      children.forEach((child, idx) => {
        map[child._id] = arr[idx].total;
      });
      setCumulResets(map);
    });
  }, [children, resetDates, scores]);

  // Charger les enfants, actions, totaux globaux
  useEffect(() => {
    fetch(`${API}/children`).then(res => res.json()).then(setChildren);
    fetch(`${API}/actions`).then(res => res.json()).then(setActions);
    fetch(`${API}/pointages/summary`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(({ childId, total }) => {
          map[childId] = total;
        });
        setGlobalTotals(map);
      });
  }, []);

  function handleAddPoint(childId, action) {
    setScores(prev => ({
      ...prev,
      [childId]: {
        ...(prev[childId] || {}),
        [action._id]: (prev[childId]?.[action._id] || 0) + 1,
      },
    }));
    setBounce(b => ({ ...b, [childId]: true }));
    setTimeout(() => setBounce(b => ({ ...b, [childId]: false })), 400);
  }

  function handleRemovePoint(childId, action) {
    setScores(prev => {
      const prevChild = prev[childId] || {};
      const oldCount = prevChild[action._id] || 0;
      if (oldCount === 0) return prev;
      return {
        ...prev,
        [childId]: {
          ...prevChild,
          [action._id]: oldCount - 1,
        },
      };
    });
  }

  async function handleSave() {
    setError("");
    try {
      const res = await fetch(`${API}/pointages/secure-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, scores }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur inconnue !");
        return;
      }
      await fetch(`${API}/pointages/draft`, { method: "DELETE" });
      setScores({});
      setShowPwd(false);
      setPassword("");
      alert("Points enregistrés !");
      fetch(`${API}/pointages/summary`)
        .then(res => res.json())
        .then(data => {
          const map = {};
          data.forEach(({ childId, total }) => {
            map[childId] = total;
          });
          setGlobalTotals(map);
        });
    } catch (e) {
      setError(e.message || "Erreur inconnue !");
    }
  }

  function getTotalScore(childId) {
    const actionsForChild = scores[childId] || {};
    return Object.entries(actionsForChild).reduce((sum, [actionId, count]) => {
      const action = actions.find(a => a._id === actionId);
      if (!action) return sum;
      return sum + count * action.value;
    }, 0);
  }

  if (!isDraftLoaded) return <div>Chargement...</div>;

  return (
    <div className="pointage-page-main">
      {children.map(child => (
        <div key={child._id} className="carte-enfant">
          <div className="enfant-nom">
            {child.name.toLowerCase().includes("arnaud")
              ? "Arnaud 🎨"
              : child.name.toLowerCase().includes("olivier")
                ? "Olivier 🏒"
                : child.name + "⭐"}
          </div>
          <div className={`score-affiche ${bounce[child._id] ? "bounce" : ""}`}>
            +{getTotalScore(child._id)}
          </div>
          <div className="cumul-reset-zone">
            Cumul pour récompense : <b>{cumulResets[child._id] || 0}</b>
            <button
              className="cumul-reset-btn"
              onClick={() =>
                setResetConfirm(prev => ({ ...prev, [child._id]: true }))
              }
              title="Remettre le cumul à zéro"
            >
              Réinitialiser
            </button>
            {resetConfirm[child._id] && (
              <span className="reset-confirm-zone">
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={resetPassword[child._id] || ""}
                  onChange={e =>
                    setResetPassword(p => ({
                      ...p,
                      [child._id]: e.target.value,
                    }))
                  }
                />
                <button
                  className="reset-confirm-btn"
                  onClick={async () => {
                    try {
                      await handleResetCumul(
                        child._id,
                        resetPassword[child._id] || ""
                      );
                      setResetError(errs => ({
                        ...errs,
                        [child._id]: "",
                      }));
                      setResetConfirm(prev => ({
                        ...prev,
                        [child._id]: false,
                      }));
                      setResetPassword(prev => ({
                        ...prev,
                        [child._id]: "",
                      }));
                    } catch (err) {
                      setResetError(errs => ({
                        ...errs,
                        [child._id]: err.message || "Mot de passe incorrect!",
                      }));
                    }
                  }}
                >
                  Confirmer
                </button>
                <button
                  className="reset-cancel-btn"
                  onClick={() => {
                    setResetConfirm(prev => ({
                      ...prev,
                      [child._id]: false,
                    }));
                    setResetPassword(prev => ({
                      ...prev,
                      [child._id]: "",
                    }));
                    setResetError(errs => ({
                      ...errs,
                      [child._id]: "",
                    }));
                  }}
                >
                  Annuler
                </button>
                {resetError[child._id] && (
                  <div className="reset-error">{resetError[child._id]}</div>
                )}
              </span>
            )}
          </div>
          <div>
            {actions
              .filter(a => (a.children || []).includes(child._id))
              .map(action => {
                const count = scores[child._id]?.[action._id] || 0;
                return (
                  <div key={action._id} className="actions-zone">
                    <button
                      className="bouton-action"
                      onClick={() => handleAddPoint(child._id, action)}
                    >
                      {action.name}{" "}
                      <span style={{ fontWeight: "bold" }}>
                        ({action.value > 0 ? "+" : ""}
                        {action.value})
                      </span>
                    </button>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>
                      {count > 0 ? count : ""}
                    </span>
                    <button
                      className="bouton-action remove"
                      onClick={() => handleRemovePoint(child._id, action)}
                      disabled={count === 0}
                      title="Annuler un point"
                    >
                      –
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
      <div className="zone-save">
        <button
          className="save-btn"
          onClick={() => setShowPwd(true)}
          disabled={Object.values(scores).every(
            val => !val || Object.values(val).every(v => v === 0)
          )}
        >
          Enregistrer la journée
        </button>
        {showPwd && (
          <div className="save-popup">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <div>
              <button className="save-confirm-btn" onClick={handleSave}>
                Confirmer
              </button>
              <button
                className="save-cancel-btn"
                onClick={() => {
                  setShowPwd(false);
                  setPassword("");
                  setError("");
                }}
              >
                Annuler
              </button>
            </div>
            {error && <div className="save-error">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
