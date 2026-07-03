import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../api/auth.jsx";
import { api } from "../api/client";
import officialLogo from "../assets/logo-sigera-official.png";

const initialForm = { username: "", password: "" };

function normalizeLoginValue(value, isShelter) {
  const trimmed = value.trim();
  if (isShelter && /^sig-/i.test(trimmed)) return trimmed.toUpperCase();
  return trimmed;
}

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("shelter");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function selectType(type) {
    setAccountType(type);
    setForm(initialForm);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const user = await login(normalizeLoginValue(form.username, isShelter), form.password);
      const role = user.profile?.role;
      if (accountType === "shelter" && !["admin", "vet", "volunteer"].includes(role)) {
        logout();
        setError("Esta cuenta es de adoptante. Usa la pestana de adoptantes.");
        return;
      }
      if (accountType === "adopter" && role !== "adopter") {
        logout();
        setError("Este acceso corresponde a la administracion de un refugio.");
        return;
      }
      navigate(accountType === "shelter" ? "/admin" : "/adoptante");
    } catch {
      setError("Las credenciales no son validas para esta cuenta.");
    }
  }

  async function requestRecovery(event) {
    event.preventDefault();
    setRecoveryMessage("");
    try {
      await api.post("/auth/password-reset/", { email: recoveryEmail });
      setRecoveryMessage("Si existe una cuenta con este correo, recibiras un enlace para crear una nueva contrasena.");
    } catch {
      setRecoveryMessage("No fue posible procesar la solicitud. Intentalo nuevamente.");
    }
  }

  if (recovery) {
    return (
      <main className="login-page">
        <Link className="login-home-link" to="/"><i className="bi bi-house" /> Home</Link>
        <div className="login-scene login-scene-left" />
        <div className="login-scene login-scene-right" />
        <form className="login-card recovery-card" onSubmit={requestRecovery}>
          <div className="login-brand"><img src={officialLogo} alt="SIGERA" /><p>Sistema de Gestion de Refugios de Animales</p></div>
          <div className="recovery-heading"><span><i className="bi bi-key" /></span><div><h1>Recupera tu contrasena</h1><p>Ingresa el correo asociado a tu cuenta.</p></div></div>
          {recoveryMessage && <div className="alert success">{recoveryMessage}</div>}
          <label>Correo electronico<input type="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} required /></label>
          <button className="primary">Enviar enlace <i className="bi bi-send" /></button>
          <button className="text-action" type="button" onClick={() => { setRecovery(false); setRecoveryMessage(""); }}><i className="bi bi-arrow-left" /> Volver a iniciar sesion</button>
        </form>
      </main>
    );
  }

  const isShelter = accountType === "shelter";
  return (
    <main className="login-page">
      <Link className="login-home-link" to="/"><i className="bi bi-house" /> Home</Link>
      <div className="login-scene login-scene-left" />
      <div className="login-scene login-scene-right" />
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand"><img src={officialLogo} alt="SIGERA" /><p>Sistema de Gestion de Refugios de Animales</p></div>
        <div className="login-tabs" role="tablist" aria-label="Tipo de acceso">
          <button className={isShelter ? "active" : ""} type="button" role="tab" aria-selected={isShelter} onClick={() => selectType("shelter")}><i className="bi bi-buildings" /> Refugio</button>
          <button className={accountType === "adopter" ? "active" : ""} type="button" role="tab" aria-selected={accountType === "adopter"} onClick={() => selectType("adopter")}><i className="bi bi-heart" /> Adoptante</button>
        </div>
        <div className="login-context"><span><i className={`bi ${isShelter ? "bi-shield-lock" : "bi-person-heart"}`} /></span><div><strong>{isShelter ? "Administracion del refugio" : "Cuenta de adoptante"}</strong><small>{isShelter ? "Ingresa con el codigo SIGERA asignado a tu refugio." : "Ingresa para consultar y continuar tus procesos de adopcion."}</small></div></div>
        {error && <div className="alert error">{error}</div>}
        <label>{isShelter ? "Correo electronico o codigo del refugio" : "Correo electronico"}<input placeholder={isShelter ? "correo@refugio.org o SIG-ABC123" : "correo@ejemplo.com"} value={form.username} autoComplete="username" onChange={(event) => setForm({ ...form, username: normalizeLoginValue(event.target.value, isShelter) })} required /></label>
        <label className="password-label">
          <span>Contrasena<button className="forgot-link" type="button" onClick={() => setRecovery(true)}>Olvidaste tu contrasena?</button></span>
          <span className="password-input"><input type={showPassword ? "text" : "password"} value={form.password} autoComplete="current-password" onChange={(event) => setForm({ ...form, password: event.target.value })} required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contrasena" : "Ver contrasena"}><i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} /></button></span>
        </label>
        <label className="check"><input type="checkbox" /> Recordarme por 30 dias</label>
        <button className="primary">Ingresar <i className="bi bi-box-arrow-in-right" /></button>
        <p className="login-register">No tienes cuenta? <Link to="/registro">Crear registro</Link></p>
      </form>
    </main>
  );
}
