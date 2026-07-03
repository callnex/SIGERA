import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import officialLogo from "../assets/logo-sigera-official.png";

export default function PasswordReset() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    try {
      await api.post("/auth/password-reset/confirm/", { uid, token, password });
      setMessage("Tu contrasena fue actualizada. Ya puedes iniciar sesion.");
    } catch (requestError) {
      setError(requestError.response?.data?.non_field_errors?.[0] || "El enlace no es valido o ya vencio.");
    }
  }

  return <main className="login-page">
    <Link className="login-home-link" to="/"><i className="bi bi-house" /> Home</Link>
    <div className="login-scene login-scene-left" />
    <div className="login-scene login-scene-right" />
    <form className="login-card recovery-card" onSubmit={submit}>
      <div className="login-brand">
        <img src={officialLogo} alt="SIGERA" />
        <p>Sistema de Gestion de Refugios de Animales</p>
      </div>
      <div className="recovery-heading">
        <span><i className="bi bi-shield-check" /></span>
        <div>
          <h1>Nueva contrasena</h1>
          <p>Elige una contrasena segura de al menos 8 caracteres.</p>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      {message ? <>
        <div className="alert success">{message}</div>
        <Link className="primary" to="/login">Ir a iniciar sesion</Link>
      </> : <>
        <label>
          Nueva contrasena
          <span className="password-input">
            <input type={showPassword ? "text" : "password"} minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contrasena" : "Ver contrasena"}>
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </span>
        </label>
        <label>
          Confirmar nueva contrasena
          <input type={showPassword ? "text" : "password"} minLength="8" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
        </label>
        <button className="primary">Actualizar contrasena <i className="bi bi-check2" /></button>
      </>}
    </form>
  </main>;
}
