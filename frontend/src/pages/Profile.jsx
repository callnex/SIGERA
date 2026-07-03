import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../api/auth.jsx";
import { PageHeader } from "../components/UI.jsx";

const empty = { first_name: "", last_name: "", email: "", phone: "", address: "", position: "", emergency_contact: "", emergency_phone: "", profile_photo: null, profile_photo_url: "" };

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canEdit = Boolean(user?.profile?.role);

  useEffect(() => {
    api.get("/profile/").then(({ data }) => {
      setProfile({ ...empty, first_name: data.first_name, last_name: data.last_name, email: data.email, ...data.profile });
    }).catch(() => setError("No fue posible cargar el perfil."));
  }, []);

  async function save(event) {
    event.preventDefault();
    const payload = new FormData();
    ["first_name", "last_name", "email", "phone", "address", "position", "emergency_contact", "emergency_phone"].forEach((field) => payload.append(field, profile[field] || ""));
    if (profile.profile_photo instanceof File) payload.append("profile_photo", profile.profile_photo);
    try {
      const { data } = await api.patch("/profile/", payload);
      setProfile({ ...empty, first_name: data.first_name, last_name: data.last_name, email: data.email, ...data.profile });
      await refreshUser();
      setMessage("Perfil actualizado correctamente.");
      setError("");
    } catch {
      setError("No fue posible actualizar el perfil.");
    }
  }

  const photo = profile.profile_photo_url || (profile.profile_photo instanceof File ? URL.createObjectURL(profile.profile_photo) : "");
  return <>
    <PageHeader title="Mi perfil" subtitle="Informacion personal y acceso dentro del refugio." action={<Link className="secondary small" to="/admin/"><i className="bi bi-grid" /> Volver al dashboard</Link>} />
    {message && <div className="alert success">{message}</div>}
    {error && <div className="alert error">{error}</div>}
    <section className="profile-layout">
      <aside className="panel profile-card">
        <div className="profile-photo">{photo ? <img src={photo.startsWith("blob:") ? photo : mediaUrl(photo)} alt="Foto de perfil" /> : <i className="bi bi-person" />}{canEdit && <><input id="profile-photo-input" className="visually-hidden" type="file" accept="image/*" onChange={(event) => setProfile({ ...profile, profile_photo: event.target.files[0] })} /><label className="profile-photo-upload" htmlFor="profile-photo-input" title="Cambiar foto de perfil"><i className="bi bi-camera" /></label></>}</div>
        <h2>{profile.first_name} {profile.last_name}</h2>
        <p>{profile.position || profile.role_label || "Miembro del refugio"}</p>
        <span className="badge blue">{profile.shelter_name || user?.profile?.shelter_name}</span>
        <small>Rol: {profile.role_label || user?.profile?.role_label}</small>
      </aside>
      <form className="panel form-section profile-form" onSubmit={save}>
        <div className="section-title"><i className="bi bi-person-vcard" /><div><h2>Datos del usuario</h2><p>Actualiza tu informacion personal dentro del refugio.</p></div></div>
        <div className="two-cols">
          <Field label="Nombres" value={profile.first_name} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, first_name: value })} />
          <Field label="Apellidos" value={profile.last_name} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, last_name: value })} />
          <Field label="Correo electronico" type="email" value={profile.email} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, email: value })} />
          <Field label="Telefono" value={profile.phone} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, phone: value })} />
          <Field label="Direccion" value={profile.address} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, address: value })} />
          <Field label="Cargo o especialidad" value={profile.position} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, position: value })} />
          <Field label="Contacto de emergencia" value={profile.emergency_contact} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, emergency_contact: value })} />
          <Field label="Telefono de emergencia" value={profile.emergency_phone} disabled={!canEdit} onChange={(value) => setProfile({ ...profile, emergency_phone: value })} />
        </div>
        {canEdit && <button className="primary"><i className="bi bi-floppy" /> Guardar perfil</button>}
      </form>
    </section>
  </>;
}

function Field({ label, type = "text", value, onChange, disabled }) {
  return <label>{label}<input type={type} value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></label>;
}
