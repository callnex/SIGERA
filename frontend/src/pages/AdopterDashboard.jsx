import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../api/auth.jsx";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, Badge } from "../components/UI.jsx";
import ImageWithFallback from "../components/ImageWithFallback.jsx";
import logoPaw from "../assets/logo-paw-blue.png";

export default function AdopterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/adopter/me/")
      .then((res) => {
        setData(res.data);
        setError("");
      })
      .catch(() => setError("No fue posible cargar tu perfil de adoptante."));
  }, []);

  const applications = data?.applications || [];
  const activeApplication = applications[0];
  const summary = useMemo(() => ({
    total: applications.length,
    review: applications.filter((item) => ["pending", "review", "interview", "home_visit"].includes(item.status_key)).length,
    approved: applications.filter((item) => ["approved", "formalized", "follow_up"].includes(item.status_key)).length,
    followUps: applications.filter((item) => item.follow_up_due_date).length,
  }), [applications]);

  const displayName = `${user?.first_name || data?.user?.first_name || ""} ${user?.last_name || data?.user?.last_name || ""}`.trim() || user?.email || "Adoptante";
  const profilePhoto = mediaUrl(user?.profile?.profile_photo_url || data?.user?.profile?.profile_photo_url);
  const fullProfileReady = Boolean(data?.phone && data?.address);

  if (error) return <AdopterEmpty message={error} />;
  if (!data) return <main className="auth-loading">Cargando tu espacio de adopcion...</main>;

  return (
    <section className="adopter-page">
      <div className="adopter-page-header">
        <div className="adopter-header-copy">
          <span>Panel de adoptante</span>
          <h1>Hola, {displayName}</h1>
          <p>Consulta tus solicitudes, revisa los siguientes pasos y manten actualizados tus datos para que el refugio pueda contactarte.</p>
        </div>
        <div className="adopter-header-photo">
          <ImageWithFallback src={profilePhoto} alt="Foto de perfil" fallback={<img src={logoPaw} alt="" />} />
        </div>
      </div>

      <div className="adopter-summary-grid">
        <AdopterStat icon="bi-clipboard-heart" label="Solicitudes" value={summary.total} />
        <AdopterStat icon="bi-hourglass-split" label="En revision" value={summary.review} />
        <AdopterStat icon="bi-check2-circle" label="Aprobadas" value={summary.approved} />
        <AdopterStat icon="bi-calendar-heart" label="Seguimientos" value={summary.followUps} />
      </div>

      <section className="dashboard-profile-banner adopter-dashboard-banner">
        <div>
          <span className="profile-mini-avatar">
            <ImageWithFallback src={profilePhoto} alt="Foto de perfil" fallback={<img src={logoPaw} alt="" />} />
          </span>
          <span>
            <strong>{displayName}</strong>
            <small>Adoptante · {fullProfileReady ? "Perfil completo" : "Completa tu perfil para agilizar tu proceso"}</small>
          </span>
        </div>
        <div className="dashboard-operational-data adopter-operational-data">
          <span><b>{summary.total}</b> solicitudes</span>
          <span><b>{summary.review}</b> en progreso</span>
        </div>
        <Link className="secondary small" to="/adoptante/perfil">Ver mi perfil <i className="bi bi-arrow-right" /></Link>
      </section>

      <section className="adopter-dashboard-grid">
        {activeApplication ? <CurrentApplication application={activeApplication} /> : <NoApplications />}
        <aside className="adopter-panel adopter-next-panel">
          <div className="section-title">
            <i className="bi bi-stars" />
            <div>
              <h2>Tu ruta de adopcion</h2>
              <p>Pasos normales del proceso.</p>
            </div>
          </div>
          <ol className="adopter-step-list">
            <li><strong>Solicitud enviada</strong><span>El refugio recibe tu informacion inicial.</span></li>
            <li><strong>Revision y entrevista</strong><span>Se valida compatibilidad y condiciones del hogar.</span></li>
            <li><strong>Visita o soporte</strong><span>Se verifican detalles finales del proceso.</span></li>
            <li><strong>Formalizacion</strong><span>Contrato, entrega y seguimiento post-adopcion.</span></li>
          </ol>
          <Link className="primary adopter-full-button" to="/adoptante/seguimiento">Ver seguimiento completo</Link>
        </aside>
      </section>
    </section>
  );
}

function CurrentApplication({ application }) {
  return (
    <article className="adopter-panel adopter-current-card">
      <div className="adopter-current-photo">
        <AnimalPhoto src={mediaUrl(application.animal_photo_url)} name={application.animal_name} />
      </div>
      <div className="adopter-current-info">
        <div className="adopter-current-title">
          <div>
            <span>Proceso activo</span>
            <h2>{application.animal_name}</h2>
          </div>
          <Badge tone={statusTone(application.status_key)}>{application.status}</Badge>
        </div>
        <p>{application.animal_species} {application.animal_breed ? `- ${application.animal_breed}` : ""}</p>
        <div className="adopter-location-line">
          <i className="bi bi-geo-alt" />
          <span>{application.animal_shelter || "Refugio"} - {locationLine(application) || "Ubicacion pendiente"}</span>
        </div>
        <div className="adopter-next-step">
          <strong>Siguiente paso</strong>
          <span>{nextStep(application)}</span>
        </div>
        <div className="adopter-actions">
          <Link className="primary" to={`/catalogo/${application.animal_id}`}>Ver perfil del animal</Link>
          <Link className="secondary" to="/adoptante/perfil">Actualizar mis datos</Link>
        </div>
      </div>
    </article>
  );
}

function NoApplications() {
  return (
    <article className="adopter-panel adopter-empty-application">
      <i className="bi bi-search-heart" />
      <h2>Aun no tienes solicitudes activas</h2>
      <p>Explora el catalogo y comienza el proceso con el animal que mejor encaje con tu hogar.</p>
      <Link className="primary" to="/catalogo">Explorar catalogo</Link>
    </article>
  );
}

function AdopterStat({ icon, label, value }) {
  return (
    <article className="adopter-stat">
      <i className={`bi ${icon}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AdopterEmpty({ message }) {
  return (
    <section className="adopter-page">
      <article className="adopter-panel adopter-empty-application">
        <i className="bi bi-exclamation-circle" />
        <h2>{message}</h2>
        <Link className="primary" to="/catalogo">Volver al catalogo</Link>
      </article>
    </section>
  );
}

export function statusTone(key) {
  if (["approved", "formalized", "follow_up"].includes(key)) return "green";
  if (key === "rejected") return "red";
  if (["interview", "home_visit", "review"].includes(key)) return "blue";
  return "orange";
}

export function nextStep(application) {
  if (application.status_key === "formalized") return application.follow_up_due_date ? `Seguimiento programado para ${formatDate(application.follow_up_due_date)}.` : "Adopcion formalizada. Espera el seguimiento del refugio.";
  if (application.status_key === "approved") return "Formalizar adopcion con el refugio.";
  if (application.home_visit_date) return `Visita domiciliaria: ${formatDate(application.home_visit_date)}.`;
  if (application.interview_date) return `Entrevista programada: ${formatDate(application.interview_date)}.`;
  if (application.status_key === "rejected") return "Proceso cerrado. Puedes consultar otros animales disponibles.";
  return "El refugio revisara tu solicitud y te contactara.";
}

export function locationLine(application) {
  return [application.animal_location, application.animal_region, application.animal_country].filter(Boolean).join(", ");
}

export function formatDate(value) {
  if (!value) return "Pendiente";
  return new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}
