import { Link } from "react-router-dom";
import logoPaw from "../assets/logo-paw-blue.png";

const services = [
  {
    icon: "bi-database-check",
    title: "Gestion de animales",
    text: "Registra rescates, ubicaciones, comportamiento y perfiles publicos desde un solo expediente.",
    points: ["Ficha completa por animal", "Estados de cuidado y adopcion", "Ubicacion dentro del refugio"],
    preview: "animals",
  },
  {
    icon: "bi-clipboard2-pulse",
    title: "Historial medico",
    text: "Conserva cada vacuna, consulta y tratamiento para tomar decisiones clinicas con informacion actualizada.",
    points: ["Vacunas y desparasitacion", "Tratamientos y observaciones", "Eventos y alertas medicas"],
    preview: "medical",
  },
  {
    icon: "bi-box-seam",
    title: "Inventario",
    text: "Controla alimentos, medicamentos y suministros, con movimientos claros y alertas antes de que falte algo.",
    points: ["Entradas y salidas", "Minimos de stock", "Alertas de reposicion"],
    preview: "inventory",
  },
  {
    icon: "bi-heart",
    title: "Adopciones",
    text: "Recibe solicitudes, evalua adoptantes y acompana cada caso hasta el seguimiento posterior a la adopcion.",
    points: ["Solicitudes centralizadas", "Evaluacion de perfiles", "Seguimiento post-adopcion"],
    preview: "adoptions",
  },
];

export default function Services() {
  return <main className="services-page services-only">
    <section className="services-list">
      {services.map((service, index) => <article className={`service-showcase ${index % 2 ? "is-reversed" : ""}`} key={service.title}>
        <div className="service-detail"><div className="service-mark"><span>0{index + 1}</span><i className={`bi ${service.icon}`} /></div><h2>{service.title}</h2><p>{service.text}</p><ul>{service.points.map((point) => <li key={point}><i className="bi bi-check2" /> {point}</li>)}</ul></div>
        <ServicePreview type={service.preview} />
      </article>)}
    </section>
    <section className="system-section"><header><span>Tu espacio de trabajo</span><h2>Asi se ve SIGERA cuando registras tu refugio</h2><p>Un dashboard operativo y un sistema interno para que el equipo trabaje sobre la misma informacion.</p></header><DashboardPreview /><Link className="primary" to="/registro">Registrar mi refugio <i className="bi bi-arrow-right" /></Link></section>
  </main>;
}

function ServicePreview({ type }) {
  if (type === "animals") return <div className="product-preview animals-preview"><PreviewHeader label="Gestion de animales" action="Nuevo animal" /><div className="preview-table"><div className="preview-row preview-table-head"><span>Animal</span><span>Estado</span><span>Ubicacion</span></div><div className="preview-row"><span><b className="avatar-dot amber" /> Luna</span><em>Disponible</em><span>Pabellon A</span></div><div className="preview-row"><span><b className="avatar-dot dark" /> Milo</span><em>Disponible</em><span>Gateria</span></div><div className="preview-row"><span><b className="avatar-dot white" /> Simba</span><em className="warm">En revision</em><span>Area medica</span></div></div></div>;
  if (type === "medical") return <div className="product-preview medical-preview"><PreviewHeader label="Expediente de Luna" action="Nuevo registro" /><div className="medical-profile"><b className="avatar-dot amber" /><div><strong>Luna</strong><span>Golden Retriever Mix</span></div><em>En tratamiento leve</em></div><div className="medical-timeline"><div><i className="bi bi-shield-check" /><span><strong>Vacunacion multiple</strong><small>15 Oct 2026</small></span></div><div><i className="bi bi-capsule" /><span><strong>Tratamiento otico</strong><small>Hace 2 dias</small></span></div></div></div>;
  if (type === "inventory") return <div className="product-preview inventory-preview"><PreviewHeader label="Inventario de suministros" action="Registrar entrada" /><div className="stock-cards"><span><b>142</b>Articulos</span><span className="warning"><b>8</b>Alertas</span></div><div className="stock-row"><span>Croquetas perro adulto</span><b>125 kg</b><em>Optimo</em></div><div className="stock-row"><span>Vacuna antirrabica</span><b>2 dosis</b><em className="danger">Critico</em></div></div>;
  return <div className="product-preview adoption-preview"><PreviewHeader label="Solicitudes de adopcion" action="Ver todas" /><div className="adoption-columns"><div><span>Pendientes</span><b>12</b><p>Max - Laura M.</p></div><div><span>Evaluacion</span><b>4</b><p>Luna - Carlos R.</p></div><div><span>Completadas</span><b>156</b><p>Toby - Ana S.</p></div></div></div>;
}

function PreviewHeader({ label, action }) {
  return <div className="preview-header"><strong>{label}</strong><button type="button"><i className="bi bi-plus" /> {action}</button></div>;
}

function DashboardPreview() {
  return <div className="workspace-preview"><aside><strong><img className="workspace-paw-logo" src={logoPaw} alt="" /> SIGERA</strong><span className="active"><i className="bi bi-grid" /> Dashboard</span><span><img className="workspace-paw-logo" src={logoPaw} alt="" /> Animales</span><span><i className="bi bi-clipboard2-pulse" /> Salud</span><span><i className="bi bi-box-seam" /> Inventario</span><span><i className="bi bi-heart" /> Adopciones</span></aside><section><div className="workspace-top"><div><h3>Dashboard</h3><p>Resumen operativo del refugio</p></div><button type="button"><i className="bi bi-calendar3" /> Hoy</button></div><div className="dashboard-metrics"><span><img className="workspace-paw-logo" src={logoPaw} alt="" /><small>Animales</small><b>50</b></span><span><i className="bi bi-house-heart" /><small>Disponibles</small><b>35</b></span><span><i className="bi bi-heart" /><small>Adopciones</small><b>10</b></span></div><div className="dashboard-lower"><div className="mini-alerts"><strong>Alertas recientes</strong><p><i className="bi bi-exclamation-triangle" /> Vacunacion pendiente</p><p><i className="bi bi-box" /> Stock critico</p></div><div className="mini-chart"><strong>Adopciones del mes</strong><div><i /><i /><i /><i /><i /><i /></div></div></div></section></div>;
}
