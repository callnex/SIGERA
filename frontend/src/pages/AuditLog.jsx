import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { PageHeader } from "../components/UI.jsx";

const hiddenAuditKey = "sigera_hidden_audit_logs";

function readHiddenIds() {
  try {
    return JSON.parse(localStorage.getItem(hiddenAuditKey) || "[]");
  } catch {
    return [];
  }
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [hiddenIds, setHiddenIds] = useState(readHiddenIds);

  useEffect(() => { api.get("/audit-logs/").then(({ data }) => setLogs(data)); }, []);

  useEffect(() => {
    localStorage.setItem(hiddenAuditKey, JSON.stringify(hiddenIds));
  }, [hiddenIds]);

  const visibleLogs = useMemo(() => logs.filter((log) => {
    if (hiddenIds.includes(log.id)) return false;
    return inDateRange(log.created_at, filters.from, filters.to);
  }), [logs, hiddenIds, filters]);

  function clearRange(days) {
    const now = new Date();
    const ids = logs.filter((log) => {
      const createdAt = new Date(log.created_at);
      if (Number.isFinite(days)) return (now - createdAt) / 86400000 <= days;
      return inDateRange(log.created_at, filters.from, filters.to);
    }).map((log) => log.id);
    setHiddenIds((current) => Array.from(new Set([...current, ...ids])));
  }

  return <>
    <PageHeader title="Auditoria" subtitle="Trazabilidad de las acciones realizadas en este refugio." />
    <section className="panel history-controls-panel">
      <div className="section-title"><i className="bi bi-funnel" /><div><h2>Filtros y limpieza</h2><p>Consulta acciones por fecha o limpia el historial visible por franjas.</p></div></div>
      <div className="history-controls">
        <label>Desde<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label>Hasta<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
        <button type="button" className="secondary" onClick={() => setFilters({ from: "", to: "" })}>Limpiar filtro</button>
        <button type="button" className="secondary" onClick={() => clearRange(7)}>Limpiar ultimos 7 dias</button>
        <button type="button" className="secondary" onClick={() => clearRange(30)}>Limpiar ultimos 30 dias</button>
        <button type="button" className="danger-button" onClick={() => setHiddenIds(logs.map((log) => log.id))}>Limpiar todo</button>
      </div>
    </section>
    <section className="table-panel"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>{visibleLogs.map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString()}</td><td>{log.actor_name}</td><td>{log.action}</td><td>{log.description}</td></tr>)}</tbody></table>{!visibleLogs.length && <p className="empty-state">No hay acciones para los filtros seleccionados.</p>}</section>
  </>;
}

function inDateRange(value, from, to) {
  if (!value) return true;
  const date = new Date(value);
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}
