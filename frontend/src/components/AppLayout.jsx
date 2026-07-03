import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../api/auth.jsx";
import { mediaUrl } from "../api/client";
import logoPaw from "../assets/logo-paw-blue.png";
import ImageWithFallback from "./ImageWithFallback.jsx";

const nav = [
  { path: "", icon: "bi-grid", label: "Dashboard", roles: ["admin", "vet", "volunteer"] },
  { path: "perfil", icon: "bi-person-circle", label: "Mi perfil", roles: ["admin", "vet", "volunteer"] },
  { path: "animales", icon: "paw-logo", label: "Animales", roles: ["admin", "vet", "volunteer"] },
  { path: "medico", icon: "bi-clipboard2-pulse", label: "Historial medico", roles: ["admin", "vet"] },
  { path: "inventario", icon: "bi-box-seam", label: "Inventario", roles: ["admin", "vet", "volunteer"] },
  { path: "adopciones", icon: "bi-heart", label: "Adopciones", roles: ["admin", "volunteer"] },
  { path: "adoptantes", icon: "bi-people", label: "Adoptantes", roles: ["admin", "volunteer"] },
  { path: "tareas", icon: "bi-check2-square", label: "Tareas", roles: ["admin", "vet", "volunteer"] },
  { path: "usuarios", icon: "bi-person-gear", label: "Usuarios", roles: ["admin"] },
  { path: "ubicaciones", icon: "bi-geo-alt", label: "Ubicaciones", roles: ["admin"] },
  { path: "configuracion", icon: "bi-sliders", label: "Configuracion", roles: ["admin"] },
  { path: "auditoria", icon: "bi-journal-text", label: "Auditoria", roles: ["admin"] },
  { path: "reportes", icon: "bi-bar-chart", label: "Reportes", roles: ["admin", "vet", "volunteer"] },
];

export default function AppLayout() {
  const { logout, user } = useAuth();
  const role = user?.profile?.role;
  const profilePhoto = mediaUrl(user?.profile?.profile_photo_url);
  const visibleNavigation = nav.filter((item) => item.roles.includes(role));
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand-home-link brand-block" to="/" title="Ir al inicio de SIGERA">
          <div className={`brand-icon ${profilePhoto ? "user-brand-photo" : ""}`}>
            <ImageWithFallback src={profilePhoto} fallback={<img src={logoPaw} alt="" />} alt="" />
          </div>
          <div><strong>SIGERA</strong><span>Sistema de Gestion de Refugios de Animales</span></div>
        </Link>
        <nav>
          {visibleNavigation.map(({ path, icon, label }) => (
            <NavLink key={path} to={`/admin/${path}`} end={path === ""}>
              {icon === "paw-logo" ? <img className="sidebar-nav-icon" src={logoPaw} alt="" /> : <i className={`bi ${icon}`} />} {label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={logout}><i className="bi bi-box-arrow-right" /> Cerrar sesion</button>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
