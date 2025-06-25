import React, { useEffect, useState } from "react";
import "./HistoriqueAdmin.css";
const API = process.env.REACT_APP_API_URL;

export default function HistoriqueAdmin() {
  const [history, setHistory] = useState([]);
  const [children, setChildren] = useState([]);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch(`${API}/children`).then(res => res.json()).then(setChildren);
    fetch(`${API}/pointages/history`)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, []);

  function handleShowDetails(childId, date) {
    fetch(`${API}/pointages/details/${childId}/${date}`)
      .then(res => res.json())
      .then(list => setDetails({ childId, date, list }));
  }

  return (

    <div className="historique-root">
      <div className="historique-box">
        <h1 className="historique-title">
          Historique des points
        </h1>
        <div style={{ overflowX: "auto" }}>
          <table className="historique-table">
            <thead>
              <tr>
                <th>Date</th>
                {children.map(child => (
                  <th key={child._id}>{child.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(jour => (
                <tr key={jour.date}>
                  <td>{jour.date}</td>
                  {children.map(child => {
                    const hasPoints = !!jour.scores[child._id];
                    return (
                      <td
                        key={child._id}
                        className={hasPoints ? "point-cell" : ""}
                        onClick={() =>
                          hasPoints && handleShowDetails(child._id, jour.date)
                        }
                        title={
                          hasPoints
                            ? "Voir le détail de cette journée"
                            : ""
                        }
                      >
                        {jour.scores[child._id] || ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {details && (
        <>
          <div
            className="historique-details-overlay"
            onClick={() => setDetails(null)}
          />
          <div className="historique-details-popup">
            <b style={{ fontSize: 17 }}>
              Détail du {details.date} –{" "}
              {children.find(c => c._id === details.childId)?.name}
            </b>
            <ul className="historique-details-list">
              {details.list.length === 0 && <li>Aucun point.</li>}
              {details.list.map((d, idx) => (
                <li key={idx}>
                  <span>
                    <b>{d.actionName}</b>{" "}
                    {d.value > 0 ? "+" : ""}
                    {d.value}{" "}
                    <span className="historique-details-heure">
                      ({d.heure})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="historique-close-btn"
              onClick={() => setDetails(null)}
            >
              Fermer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
