import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../api/auth.jsx";
import { mediaUrl } from "../api/client";
import logoPaw from "../assets/logo-paw-blue.png";

export default function PublicLayout() {
  const { token, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isLoggedIn = Boolean(token && user);
  const panelPath = user?.profile?.role === "adopter" ? "/adoptante" : "/admin/";
  const profilePhoto = mediaUrl(user?.profile?.profile_photo_url) || logoPaw;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`public-nav ${isScrolled ? "is-compact" : ""}`}>
        <NavLink className="public-brand" to="/">
          <span><img src={logoPaw} alt="" /></span>
          <strong>SIGERA</strong>
        </NavLink>
        <nav className="public-nav-pill" aria-label="Navegacion publica">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/servicios">Soluciones</NavLink>
          <NavLink to="/catalogo">Catalogo de adopcion</NavLink>
        </nav>
        <div className="public-access">
          {isLoggedIn && <span className="public-user-photo"><img src={profilePhoto} alt="Foto de perfil" /></span>}
          <NavLink className="login-link" to={isLoggedIn ? panelPath : "/login"}>{isLoggedIn ? "Mi panel" : "Login"}</NavLink>
        </div>
      </header>
      <Outlet />
      <footer className="public-footer">
        <div className="footer-brand">
          <span><img src={logoPaw} alt="" /></span>
          <div>
            <strong>SIGERA</strong>
            <p>Sistema de Gestion para Refugios de Animales.</p>
          </div>
        </div>
        <nav aria-label="Enlaces de pie de pagina">
          <NavLink to={isLoggedIn ? panelPath : "/login"}>{isLoggedIn ? "Mi panel" : "Login"}</NavLink>
          <NavLink to="/servicios">Soluciones</NavLink>
          <NavLink to="/catalogo">Catalogo</NavLink>
          <NavLink to="/contacto">Contacto</NavLink>
        </nav>
        <small>&copy; 2026 SIGERA. Todos los derechos reservados.</small>
      </footer>
    </>
  );
}
