import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../api/auth.jsx";
import { mediaUrl } from "../api/client";
import logoPaw from "../assets/logo-paw-blue.png";
import ImageWithFallback from "./ImageWithFallback.jsx";

const nav = [
  { path: "", icon: "bi-grid", label: "Resumen" },
  { path: "perfil", icon: "bi-person-circle", label: "Mi perfil" },
  { path: "seguimiento", icon: "bi-heart-pulse", label: "Seguimiento" },
];

export default function AdopterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profilePhoto = mediaUrl(user?.profile?.profile_photo_url);

  function signOut() {
    logout();
    navigate("/");
  }

  return (
    <div className="adopter-shell">
      <aside className="adopter-sidebar">
        <Link className="brand-home-link brand-block adopter-brand-block" to="/" title="Ir al inicio de SIGERA">
          <div className={`brand-icon ${profilePhoto ? "user-brand-photo" : ""}`}>
            <ImageWithFallback src={profilePhoto} fallback={<img src={logoPaw} alt="" />} alt="" />
          </div>
          <div>
            <strong>SIGERA</strong>
            <span>Sistema de Gestion de Refugios de Animales</span>
          </div>
        </Link>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.path} to={`/adoptante/${item.path}`} end={item.path === ""}>
              <i className={`bi ${item.icon}`} /> {item.label}
            </NavLink>
          ))}
          <NavLink to="/catalogo"><i className="bi bi-search-heart" /> Catalogo</NavLink>
        </nav>
        <button className="logout adopter-logout" type="button" onClick={signOut}><i className="bi bi-box-arrow-right" /> Cerrar sesion</button>
      </aside>
      <main className="adopter-main">
        <Outlet />
      </main>
    </div>
  );
}
