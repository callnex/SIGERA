import { Link } from "react-router-dom";
import logoPaw from "../assets/logo-paw-blue.png";

const services = [
  {
    icon: "bi-grid-1x2",
    title: "Dashboard operativo",
    text: "Visualiza animales, adopciones, capacidad, alertas y tareas desde un resumen ejecutivo pensado para operar el refugio en tiempo real.",
    points: ["Metricas clave por refugio", "Alertas recientes", "Tendencia de adopciones"],
    preview: "dashboard",
  },
  {
    icon: "bi-database-check",
    title: "Gestion de animales",
    text: "Registra rescates, ubicaciones, comportamiento, estados clinicos y perfiles publicos desde un solo expediente por animal.",
    points: ["Ficha completa por animal", "Estados de cuidado y adopcion", "Ubicacion dentro del refugio"],
    preview: "animals",
  },
  {
    icon: "bi-clipboard2-pulse",
    title: "Historial medico",
    text: "Conserva cada vacuna, consulta y tratamiento para tomar decisiones clinicas con informacion actualizada.",
    points: ["Vacunas y desparasitacion", "Tratamientos y observaciones", "Adjuntos e historial por fecha"],
    preview: "medical",
  },
  {
    icon: "bi-box-seam",
    title: "Inventario y abastecimiento",
    text: "Controla alimentos, medicamentos y suministros con movimientos claros, minimos de stock y alertas antes de que falte algo.",
    points: ["Entradas y salidas", "Minimos de stock", "Alertas de reposicion"],
    preview: "inventory",
  },
  {
    icon: "bi-heart",
    title: "Adopciones y seguimiento",
    text: "Recibe solicitudes, evalua adoptantes y acompana cada caso hasta el seguimiento posterior a la adopcion.",
    points: ["Solicitudes centralizadas", "Estados del proceso", "Seguimiento post-adopcion"],
    preview: "adoptions",
  },
  {
    icon: "bi-people",
    title: "Equipo, tareas y auditoria",
    text: "Administra usuarios, asigna tareas y conserva trazabilidad de la operacion diaria del refugio.",
    points: ["Roles y permisos", "Tareas con responsables", "Bitacora de acciones"],
    preview: "operations",
  },
];

export default function Services() {
  return (
    <main className="services-page services-only">
      <section className="services-list">
        {services.map((service, index) => (
          <article className={`service-showcase ${index % 2 ? "is-reversed" : ""}`} key={service.title}>
            <div className="service-detail">
              <div className="service-mark">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i className={`bi ${service.icon}`} />
              </div>
              <h2>{service.title}</h2>
              <p>{service.text}</p>
              <ul>
                {service.points.map((point) => (
                  <li key={point}>
                    <i className="bi bi-check2" /> {point}
                  </li>
                ))}
              </ul>
            </div>
            <ServicePreview type={service.preview} />
          </article>
        ))}
      </section>
      <section className="system-section">
        <header>
          <span>Tu espacio de trabajo</span>
          <h2>Asi se ve SIGERA cuando operas el panel de control</h2>
          <p>Dashboard, modulos clinicos, inventario, equipo y adopciones conectados sobre la misma base de datos.</p>
        </header>
        <DashboardPreview />
        <Link className="primary" to="/registro">Registrar mi refugio <i className="bi bi-arrow-right" /></Link>
      </section>
    </main>
  );
}

function ServicePreview({ type }) {
  if (type === "dashboard") {
    return (
      <div className="product-preview dashboard-service-preview">
        <PreviewHeader label="Dashboard" action="Ver resumen" />
        <div className="dashboard-metrics">
          <span><img className="workspace-paw-logo" src={logoPaw} alt="" /><small>Animales</small><b>128</b></span>
          <span><i className="bi bi-house-heart" /><small>Disponibles</small><b>43</b></span>
          <span><i className="bi bi-heart" /><small>Adopciones</small><b>19</b></span>
        </div>
        <div className="dashboard-lower">
          <div className="mini-alerts">
            <strong>Alertas recientes</strong>
            <p><i className="bi bi-heart-pulse" /> Bruno requiere seguimiento medico</p>
            <p><i className="bi bi-box-seam" /> Vacuna antirrabica en stock critico</p>
          </div>
          <div className="mini-chart">
            <strong>Tareas activas</strong>
            <div><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "animals") {
    return (
      <div className="product-preview animals-preview">
        <PreviewHeader label="Gestion de animales" action="Nuevo animal" />
        <div className="preview-table">
          <div className="preview-row preview-table-head"><span>Animal</span><span>Estado</span><span>Ubicacion</span></div>
          <div className="preview-row"><span><b className="avatar-dot amber" /> Luna</span><em>Disponible</em><span>Pabellon A</span></div>
          <div className="preview-row"><span><b className="avatar-dot dark" /> Blacky</span><em>Ingresado</em><span>Canil Norte</span></div>
          <div className="preview-row"><span><b className="avatar-dot white" /> Simba</span><em className="warm">En tratamiento</em><span>Area medica</span></div>
        </div>
      </div>
    );
  }

  if (type === "medical") {
    return (
      <div className="product-preview medical-preview">
        <PreviewHeader label="Historial medico de Blacky" action="Nuevo registro" />
        <div className="medical-profile">
          <b className="avatar-dot dark" />
          <div><strong>Blacky</strong><span>Perro criollo, 10 anos</span></div>
          <em>Controlado</em>
        </div>
        <div className="medical-timeline">
          <div><i className="bi bi-shield-check" /><span><strong>Vacunacion multiple</strong><small>02 Jul 2026</small></span></div>
          <div><i className="bi bi-capsule" /><span><strong>Tratamiento digestivo</strong><small>Hace 1 dia</small></span></div>
          <div><i className="bi bi-file-earmark-medical" /><span><strong>Consulta general</strong><small>Hace 5 dias</small></span></div>
        </div>
      </div>
    );
  }

  if (type === "inventory") {
    return (
      <div className="product-preview inventory-preview">
        <PreviewHeader label="Inventario de suministros" action="Registrar entrada" />
        <div className="stock-cards"><span><b>142</b>Articulos</span><span className="warning"><b>8</b>Alertas</span></div>
        <div className="stock-row"><span>Croquetas perro adulto</span><b>125 kg</b><em>Optimo</em></div>
        <div className="stock-row"><span>Vacuna antirrabica</span><b>2 dosis</b><em className="danger">Critico</em></div>
        <div className="stock-row"><span>Guantes clinicos</span><b>18 cajas</b><em>Reposicion</em></div>
      </div>
    );
  }

  if (type === "adoptions") {
    return (
      <div className="product-preview adoption-preview">
        <PreviewHeader label="Solicitudes de adopcion" action="Ver todas" />
        <div className="adoption-columns">
          <div><span>Pendientes</span><b>12</b><p>Max - Laura M.</p></div>
          <div><span>Evaluacion</span><b>4</b><p>Luna - Carlos R.</p></div>
          <div><span>Completadas</span><b>156</b><p>Toby - Ana S.</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-preview operations-preview">
      <PreviewHeader label="Equipo y operaciones" action="Nuevo usuario" />
      <div className="preview-table">
        <div className="preview-row preview-table-head"><span>Miembro</span><span>Rol</span><span>Estado</span></div>
        <div className="preview-row"><span>Nicolas Martinez</span><em>Administrador</em><span>Activo</span></div>
        <div className="preview-row"><span>Camila Rojas</span><em>Veterinaria</em><span>Tarea asignada</span></div>
        <div className="preview-row"><span>Juan Perez</span><em>Voluntario</em><span>Turno hoy</span></div>
      </div>
    </div>
  );
}

function PreviewHeader({ label, action }) {
  return <div className="preview-header"><strong>{label}</strong><button type="button"><i className="bi bi-plus" /> {action}</button></div>;
}

function DashboardPreview() {
  return (
    <div className="workspace-preview">
      <aside>
        <strong><img className="workspace-paw-logo" src={logoPaw} alt="" /> SIGERA</strong>
        <span className="active"><i className="bi bi-grid" /> Dashboard</span>
        <span><img className="workspace-paw-logo" src={logoPaw} alt="" /> Animales</span>
        <span><i className="bi bi-clipboard2-pulse" /> Historial medico</span>
        <span><i className="bi bi-box-seam" /> Inventario</span>
        <span><i className="bi bi-heart" /> Adopciones</span>
        <span><i className="bi bi-people" /> Usuarios</span>
        <span><i className="bi bi-geo-alt" /> Ubicaciones</span>
        <span><i className="bi bi-check2-square" /> Tareas</span>
      </aside>
      <section>
        <div className="workspace-top">
          <div><h3>Dashboard</h3><p>Resumen operativo del refugio</p></div>
          <button type="button"><i className="bi bi-calendar3" /> Hoy</button>
        </div>
        <div className="dashboard-metrics">
          <span><img className="workspace-paw-logo" src={logoPaw} alt="" /><small>Animales</small><b>128</b></span>
          <span><i className="bi bi-house-heart" /><small>Disponibles</small><b>43</b></span>
          <span><i className="bi bi-heart" /><small>Adopciones</small><b>19</b></span>
        </div>
        <div className="dashboard-lower">
          <div className="mini-alerts">
            <strong>Alertas recientes</strong>
            <p><i className="bi bi-exclamation-triangle" /> Stock critico en medicina</p>
            <p><i className="bi bi-heart-pulse" /> Bruno sigue en recuperacion</p>
            <p><i className="bi bi-check2-square" /> 6 tareas activas hoy</p>
          </div>
          <div className="mini-chart">
            <strong>Adopciones del mes</strong>
            <div><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
