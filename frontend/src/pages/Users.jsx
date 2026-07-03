import { useEffect, useState } from "react";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../api/auth.jsx";
import { Badge, PageHeader } from "../components/UI.jsx";

const initialForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  phone: "",
  address: "",
  position: "",
  emergency_contact: "",
  emergency_phone: "",
  profile_photo: null,
  profile: { role: "volunteer" },
};
const editableProfile = ["phone", "address", "position", "emergency_contact", "emergency_phone"];

function emptyEdit(user) {
  return {
    id: user.id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    is_active: user.is_active,
    role: user.profile?.role || "volunteer",
    phone: user.profile?.phone || "",
    address: user.profile?.address || "",
    position: user.profile?.position || "",
    emergency_contact: user.profile?.emergency_contact || "",
    emergency_phone: user.profile?.emergency_phone || "",
    profile_photo: null,
    profile_photo_url: user.profile?.profile_photo_url || "",
  };
}

export default function Users() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/users/").then((res) => { setUsers(res.data); setError(""); }).catch(() => setError("No fue posible cargar los usuarios."));

  useEffect(() => { load(); }, []);

  async function create(event) {
    event.preventDefault();
    const payload = new FormData();
    ["username", "email", "first_name", "last_name", "password", ...editableProfile].forEach((field) => payload.append(field, form[field] ?? ""));
    payload.append("role", form.profile.role);
    if (form.profile_photo instanceof File) payload.append("profile_photo", form.profile_photo);
    try {
      await api.post("/users/", payload);
      setForm(initialForm);
      setMessage("Usuario creado correctamente.");
      load();
    } catch {
      setError("No fue posible crear el usuario. Revisa que el correo no este en uso.");
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    const payload = new FormData();
    ["first_name", "last_name", "email", "role", "is_active", ...editableProfile].forEach((field) => payload.append(field, editing[field] ?? ""));
    if (editing.profile_photo instanceof File) payload.append("profile_photo", editing.profile_photo);
    try {
      await api.patch(`/users/${editing.id}/`, payload);
      setEditing(null);
      setMessage("Usuario actualizado correctamente.");
      await load();
      if (editing.id === currentUser?.id) await refreshUser();
    } catch {
      setError("No fue posible actualizar el usuario.");
    }
  }

  async function removeUser(target) {
    if (target.id === currentUser?.id) {
      setError("No puedes eliminar tu propio usuario desde esta pantalla.");
      return;
    }
    if (!window.confirm(`Eliminar el usuario ${target.first_name || target.email}? Esta accion no se puede deshacer.`)) return;
    try {
      await api.delete(`/users/${target.id}/`);
      setEditing(null);
      setMessage("Usuario eliminado correctamente.");
      load();
    } catch {
      setError("No fue posible eliminar el usuario.");
    }
  }

  const editPhoto = editing?.profile_photo instanceof File ? URL.createObjectURL(editing.profile_photo) : mediaUrl(editing?.profile_photo_url);
  const createPhoto = form.profile_photo instanceof File ? URL.createObjectURL(form.profile_photo) : "";

  return <>
    <PageHeader title="Gestion de Usuarios" subtitle="Administra personal, voluntarios y veterinarios." />
    {message && <div className="alert success">{message}</div>}
    {error && <div className="alert error">{error}</div>}
    <form className="panel form-section staff-create" onSubmit={create}>
      <div className="section-title"><i className="bi bi-person-plus" /><div><h2>Nuevo usuario del equipo</h2><p>Asigna una credencial temporal y el nivel de acceso correspondiente.</p></div></div>
      <div className="staff-create-photo">
        <div className="profile-photo">{createPhoto ? <img src={createPhoto} alt="Foto de perfil" /> : <i className="bi bi-person" />}<input id="new-staff-photo" className="visually-hidden" type="file" accept="image/*" onChange={(event) => setForm({ ...form, profile_photo: event.target.files[0] })} /><label className="profile-photo-upload" htmlFor="new-staff-photo" title="Agregar foto de perfil"><i className="bi bi-camera" /></label></div>
        <div><strong>Foto de perfil</strong><p>Opcional para identificar rapidamente al usuario en el panel.</p></div>
      </div>
      <div className="two-cols">
        <label>Nombres<input value={form.first_name} required onChange={(event) => setForm({ ...form, first_name: event.target.value })} /></label>
        <label>Apellidos<input value={form.last_name} required onChange={(event) => setForm({ ...form, last_name: event.target.value })} /></label>
        <label>Correo electronico<input type="email" value={form.email} required onChange={(event) => setForm({ ...form, email: event.target.value, username: event.target.value })} /></label>
        <label>Contrasena temporal<input type="password" minLength="8" value={form.password} required onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <label>Telefono<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label>Direccion<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
        <label>Cargo o especialidad<input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} /></label>
        <label>Contacto de emergencia<input value={form.emergency_contact} onChange={(event) => setForm({ ...form, emergency_contact: event.target.value })} /></label>
        <label>Telefono de emergencia<input value={form.emergency_phone} onChange={(event) => setForm({ ...form, emergency_phone: event.target.value })} /></label>
      </div>
      <div className="staff-create-actions">
        <label>Rol<select value={form.profile.role} onChange={(event) => setForm({ ...form, profile: { role: event.target.value } })}><option value="admin">Administrador</option><option value="vet">Veterinario</option><option value="volunteer">Voluntario</option></select></label>
        <button className="primary"><i className="bi bi-person-plus" /> Crear usuario</button>
      </div>
    </form>
    <section className="user-grid">{users.map((staffUser) => {
      const photo = staffUser.profile?.profile_photo_url;
      return <article className="user-card" key={staffUser.id}>
        <div className="avatar">{photo ? <img src={mediaUrl(photo)} alt={`Foto de ${staffUser.first_name}`} /> : staffUser.first_name?.[0] || "S"}</div>
        <div className="user-card-heading"><h3>{staffUser.first_name} {staffUser.last_name}</h3><p>{staffUser.email}</p></div>
        <div className="user-meta-row"><Badge tone={staffUser.is_active ? "green" : "gray"}>{staffUser.is_active ? "Activo" : "Inactivo"}</Badge><Badge tone="blue">{staffUser.profile?.role_label}</Badge></div>
        <div className="user-card-actions">
          <button className="secondary small" onClick={() => setEditing(emptyEdit(staffUser))}><i className="bi bi-pencil" /> Editar</button>
        </div>
      </article>;
    })}</section>

    {editing && <section className="panel user-editor">
      <form onSubmit={saveEdit}>
        <div className="section-title user-editor-title">
          <i className="bi bi-person-vcard" />
          <div><h2>Editar usuario</h2><p>Actualiza datos, permisos y foto de perfil del usuario seleccionado.</p></div>
          <button type="button" className="secondary small" onClick={() => setEditing(null)}>Cerrar</button>
        </div>
        <div className="user-editor-layout">
          <aside className="user-editor-photo">
            <div className="profile-photo">{editPhoto ? <img src={editPhoto} alt="Foto de perfil" /> : <i className="bi bi-person" />}<input id="staff-photo-input" className="visually-hidden" type="file" accept="image/*" onChange={(event) => setEditing({ ...editing, profile_photo: event.target.files[0] })} /><label className="profile-photo-upload" htmlFor="staff-photo-input" title="Cambiar foto de perfil"><i className="bi bi-camera" /></label></div>
            <strong>{editing.first_name} {editing.last_name}</strong>
            <span>{editing.email}</span>
          </aside>
          <div className="two-cols">
            <label>Nombres<input value={editing.first_name} onChange={(event) => setEditing({ ...editing, first_name: event.target.value })} required /></label>
            <label>Apellidos<input value={editing.last_name} onChange={(event) => setEditing({ ...editing, last_name: event.target.value })} required /></label>
            <label>Correo electronico<input type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} required /></label>
            <label>Rol<select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value })}><option value="admin">Administrador</option><option value="vet">Veterinario</option><option value="volunteer">Voluntario</option></select></label>
            <label>Telefono<input value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} /></label>
            <label>Direccion<input value={editing.address} onChange={(event) => setEditing({ ...editing, address: event.target.value })} /></label>
            <label>Cargo o especialidad<input value={editing.position} onChange={(event) => setEditing({ ...editing, position: event.target.value })} /></label>
            <label>Contacto de emergencia<input value={editing.emergency_contact} onChange={(event) => setEditing({ ...editing, emergency_contact: event.target.value })} /></label>
            <label>Telefono de emergencia<input value={editing.emergency_phone} onChange={(event) => setEditing({ ...editing, emergency_phone: event.target.value })} /></label>
            <label>Estado<select value={editing.is_active ? "active" : "inactive"} onChange={(event) => setEditing({ ...editing, is_active: event.target.value === "active" })}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></label>
          </div>
        </div>
        <div className="user-editor-actions">
          <button type="button" className="danger-button" disabled={editing.id === currentUser?.id} onClick={() => removeUser(editing)}><i className="bi bi-trash" /> Eliminar usuario</button>
          <button className="primary"><i className="bi bi-floppy" /> Guardar cambios</button>
        </div>
      </form>
    </section>}
  </>;
}
