import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, Badge } from "../components/UI.jsx";
import { formatDate, locationLine, nextStep, statusTone } from "./AdopterDashboard.jsx";

export default function AdopterTracking() {
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/adopter/me/")
      .then((res) => {
        setApplications(res.data.applications || []);
        setError("");
      })
      .catch(() => setError("No fue posible cargar tus procesos de adopcion."));
  }, []);

  if (error) return <TrackingShell><p className="alert error">{error}</p></TrackingShell>;
  if (!applications) return <main className="auth-loading">Cargando seguimiento...</main>;

  return (
    <TrackingShell>
      {applications.length ? (
        <div className="adopter-application-list">
          {applications.map((application) => <ApplicationCard key={application.id} application={application} />)}
        </div>
      ) : (
        <article className="adopter-panel adopter-empty-application">
          <i className="bi bi-heart" />
          <h2>No hay procesos registrados</h2>
          <p>Cuando envies una solicitud, aqui podras ver cada avance del proceso.</p>
          <Link className="primary" to="/catalogo">Buscar animales disponibles</Link>
        </article>
      )}
    </TrackingShell>
  );
}

function TrackingShell({ children }) {
  return (
    <section className="adopter-page">
      <div className="adopter-section-header">
        <i className="bi bi-heart-pulse" />
        <div>
          <h1>Seguimiento de adopcion</h1>
          <p>Estado de tus solicitudes, fechas importantes y comunicacion con el refugio.</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ApplicationCard({ application }) {
  const timeline = [
    { label: "Solicitud", value: formatDate(application.created_at), done: true },
    { label: "Entrevista", value: formatDate(application.interview_date), done: Boolean(application.interview_date) },
    { label: "Visita", value: formatDate(application.home_visit_date), done: Boolean(application.home_visit_date) },
    { label: "Formalizacion", value: formatDate(application.official_adoption_date), done: Boolean(application.official_adoption_date) },
    { label: "Seguimiento", value: formatDate(application.follow_up_due_date), done: Boolean(application.follow_up_due_date) },
  ];

  return (
    <article className="adopter-panel adopter-application-card">
      <div className="adopter-application-animal">
        <AnimalPhoto src={mediaUrl(application.animal_photo_url)} name={application.animal_name} />
        <div>
          <span>{application.animal_species}</span>
          <h2>{application.animal_name}</h2>
          <p>{application.animal_shelter || "Refugio"} - {locationLine(application) || "Ubicacion pendiente"}</p>
        </div>
        <Badge tone={statusTone(application.status_key)}>{application.status}</Badge>
      </div>
      <div className="adopter-timeline">
        {timeline.map((item) => (
          <div className={item.done ? "done" : ""} key={item.label}>
            <span />
            <strong>{item.label}</strong>
            <small>{item.value}</small>
          </div>
        ))}
      </div>
      <div className="adopter-note-box">
        <strong>Siguiente paso</strong>
        <p>{nextStep(application)}</p>
        {application.decision_notes && <p>{application.decision_notes}</p>}
        {application.follow_up_notes && <p>{application.follow_up_notes}</p>}
      </div>
      <div className="adopter-actions">
        <Link className="primary" to={`/catalogo/${application.animal_id}`}>Ver perfil del animal</Link>
        <Link className="secondary" to="/catalogo">Explorar catalogo</Link>
      </div>
    </article>
  );
}
