import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import heroImage from "../assets/dog-home.jpg";
import logoPaw from "../assets/logo-paw-blue.png";

const features = [
  {
    image: logoPaw,
    title: "Gestión de animales",
    text: "Administra registros de rescate y perfiles completos de cada animal.",
  },
  {
    icon: "bi-clipboard2-pulse",
    title: "Historial médico",
    text: "Controla vacunaciones, tratamientos y el estado de salud general.",
  },
  {
    icon: "bi-box-seam",
    title: "Inventario",
    text: "Manten el control del stock de alimentos, medicinas y suministros.",
  },
  {
    icon: "bi-heart",
    title: "Adopciones",
    text: "Agiliza solicitudes y realiza seguimiento post-adopción de manera eficiente.",
  },
];

export default function Home() {
  const [impact, setImpact] = useState({
    animals_registered: 0,
    available: 0,
    adoptions: 0,
    alerts_attended_rate: 100,
  });

  useEffect(() => {
    api.get("/public/impact-stats/")
      .then(({ data }) => setImpact(data))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => ([
    { value: impact.animals_registered, label: "Animales registrados", suffix: "+" },
    { value: impact.available, label: "Disponibles" },
    { value: impact.adoptions, label: "Adopciones", suffix: "+" },
    { value: impact.alerts_attended_rate, label: "Alertas atendidas", suffix: "%" },
  ]), [impact]);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-copy">
          <span className="home-kicker">Sistema de Gestión</span>
          <h1>Administración inteligente para refugios de animales</h1>
          <p>
            SIGERA centraliza la gestión de animales rescatados, salud,
            inventario y adopciones para ayudar a los refugios a trabajar mejor
            y conectar más animales con familias responsables.
          </p>
          <div className="home-actions">
            <Link className="primary" to="/login">Ingresar al sistema</Link>
            <Link className="secondary" to="/catalogo">Ver animales en adopción</Link>
          </div>
        </div>
        <div className="home-hero-media">
          <img src={heroImage} alt="Perro rescatado en un entorno seguro" />
        </div>
      </section>

      <section className="home-section" id="sobre">
        <div className="section-heading">
          <h2>Soluciones Integrales</h2>
          <p>Herramientas diseñadas especificamente para las necesidades de los refugios modernos.</p>
        </div>
        <div className="home-feature-grid">
          {features.map((feature) => (
            <article className="home-feature" key={feature.title}>
              <span>
                {feature.image ? (
                  <img src={feature.image} alt="" />
                ) : (
                  <i className={`bi ${feature.icon}`} />
                )}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
        <div className="home-services-action"><Link className="secondary" to="/servicios">Nuestros Servicios <i className="bi bi-arrow-right" /></Link></div>
      </section>

      <section className="home-stats" aria-label="Indicadores de impacto">
        {stats.map((item) => (
          <article key={item.label}>
            <strong><AnimatedNumber value={item.value} suffix={item.suffix} /></strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="home-adoption-callout">
        <span><i className="bi bi-house-heart-fill" /></span>
        <h2>Listo para dar un hogar?</h2>
        <p>
          Consulta nuestro catálogo y adopta de forma responsable. Cada animal
          merece una segunda oportunidad en un hogar amoroso.
        </p>
        <Link className="primary" to="/catalogo">Explorar catálogo</Link>
      </section>
    </main>
  );
}

function AnimatedNumber({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    let frameId = 0;
    const duration = 700;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.round(target * progress));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return `${displayValue}${suffix}`;
}
