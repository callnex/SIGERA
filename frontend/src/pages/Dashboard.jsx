import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../api/auth.jsx";
import { PageHeader, StatCard } from "../components/UI.jsx";
import logoPaw from "../assets/logo-paw-blue.png";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ alerts: [], adoption_trend: [] });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  const loadSummary = async () => {
    try {
      const response = await api.get("/reports/summary/");
      setSummary(response.data);
      setError("");
    } catch {
      setError("No fue posible cargar el resumen del refugio.");
    }
  };

  useEffect(() => { loadSummary(); }, []);

  const resetDemoData = async () => {
    if (!window.confirm("Se reemplazarán los animales, inventario y procesos de prueba de este refugio. Esta acción no afecta a otros refugios. Deseas continuar?")) return;
    setResetting(true);
    try {
      const response = await api.post("/demo/reset/");
      setMessage(response.data.detail);
      await loadSummary();
    } catch {
      setError("No fue posible restablecer los datos de prueba.");
    } finally {
      setResetting(false);
    }
  };

  const isAdmin = user?.profile?.role === "admin";
  const profilePhoto = mediaUrl(user?.profile?.profile_photo_url);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen operativo de ${user?.profile?.shelter_name || "tu refugio"}`}
        action={isAdmin ? <button className="secondary small reset-demo" onClick={resetDemoData} disabled={resetting}><i className="bi bi-arrow-clockwise" /> {resetting ? "Restableciendo..." : "Restablecer datos de prueba"}</button> : null}
      />
      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}
      <section className="stats-grid">
        <StatCard image={logoPaw} label="Total animales" value={summary.animals_total ?? 0} />
        <StatCard icon="bi-house-heart" label="Disponibles" value={summary.available ?? 0} tone="blue" />
        <StatCard icon="bi-heart" label="Adopciones del mes" value={summary.adopted_month ?? 0} />
        <StatCard icon="bi-exclamation-triangle" label="Alertas criticas" value={summary.stock_critical ?? 0} tone="red" />
      </section>
      <section className="dashboard-profile-banner">
        <div>
          <span className="profile-mini-avatar">{profilePhoto ? <img src={profilePhoto} alt="Foto de perfil" /> : <i className="bi bi-person-circle" />}</span>
          <span><strong>{user?.first_name || "Usuario"} {user?.last_name || ""}</strong><small>{user?.profile?.role_label} · {user?.profile?.shelter_name}</small></span>
        </div>
        <div className="dashboard-operational-data"><span><b>{summary.tasks_pending ?? 0}</b> tareas activas</span><span><b>{summary.occupancy ?? 0}/{summary.capacity || "-"}</b> ocupación</span></div>
        <Link className="secondary small" to="/admin/perfil">Ver mi perfil <i className="bi bi-arrow-right" /></Link>
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <h2>Alertas recientes</h2>
          <div className="alert-list">
            {summary.alerts?.length ? summary.alerts.map((alert, index) => (
              <article className={`dashboard-alert ${alert.severity}`} key={`${alert.type}-${index}`}>
                <i className={`bi ${alert.type === "inventory" ? "bi-box-seam" : alert.type === "task" ? "bi-check2-square" : "bi-heart-pulse"}`} />
                <div><strong>{alert.title}</strong><small>{alert.detail}</small></div>
                <span>{alert.type === "inventory" ? "Inventario" : alert.type === "task" ? "Tareas" : "Medico"}</span>
              </article>
            )) : <p className="empty-state"><i className="bi bi-check2-circle" /> No hay alertas pendientes.</p>}
          </div>
        </div>
        <div className="panel chart-panel">
          <h2>Tendencia de adopciones</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.adoption_trend || []}><CartesianGrid vertical={false} stroke="#d9e7fb" /><XAxis dataKey="mes" /><YAxis allowDecimals={false} /><Legend /><Bar dataKey="perros" name="Perros" fill="#0b63f6" radius={[4, 4, 0, 0]} /><Bar dataKey="gatos" name="Gatos" fill="#6f93d7" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
