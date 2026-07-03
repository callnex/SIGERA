import logoPaw from "../assets/logo-paw-blue.png";

const headerIcons = {
  Dashboard: "bi-grid", "Mi perfil": "bi-person-vcard", Animales: "bi-heart-pulse",
  "Historial Medico": "bi-clipboard2-pulse", Inventario: "bi-box-seam", Adopciones: "bi-heart",
  "Gestion de Adoptantes": "bi-people", "Gestion de Usuarios": "bi-person-gear",
  "Tareas del refugio": "bi-check2-square", Ubicaciones: "bi-geo-alt",
  "Configuracion del refugio": "bi-sliders", Auditoria: "bi-journal-text", "Reportes Operativos": "bi-bar-chart",
};

export function PageHeader({ title, subtitle, action, icon }) {
  const resolvedIcon = icon || headerIcons[title] || (title.includes("perfil animal") ? "bi-heart-pulse" : title.includes("Registrar animal") ? "bi-plus-circle" : "bi-grid");
  return <div className="page-header"><div className="page-title-group"><i className={`bi ${resolvedIcon}`} /><div><h1>{title}</h1><p>{subtitle}</p></div></div>{action}</div>;
}

export function StatCard({ icon, image, label, value, tone = "green", note }) {
  return (
    <article className={`stat-card ${tone}`}>
      {image ? <img className="stat-image" src={image} alt="" /> : <i className={`bi ${icon}`} />}
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

export function Badge({ children, tone = "green" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function AnimalPhoto({ src, name }) {
  return src ? <img src={src} alt={name} /> : <div className="photo-fallback"><img src={logoPaw} alt="" /></div>;
}

export function FileUpload({ id, accept, file, onChange, title = "Adjuntar archivo", helper = "PDF o imagen", icon = "bi-paperclip" }) {
  const fileName = file instanceof File ? file.name : "";
  return (
    <div className="file-upload-control">
      <input id={id} className="visually-hidden" type="file" accept={accept} onChange={(event) => onChange(event.target.files[0] || null)} />
      <label htmlFor={id}>
        <i className={`bi ${icon}`} />
        <span>
          <strong>{title}</strong>
          <small>{fileName || helper}</small>
        </span>
      </label>
    </div>
  );
}
