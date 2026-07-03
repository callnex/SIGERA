import { useEffect, useState } from "react";
import { useAuth } from "../api/auth.jsx";
import { api, mediaUrl } from "../api/client";
import { FileUpload } from "../components/UI.jsx";
import logoPaw from "../assets/logo-paw-blue.png";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  emergency_contact: "",
  emergency_phone: "",
  housing_type: "",
  owns_or_rents: "",
  has_pets: "",
  experience: "",
};

export default function AdopterProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [identityDocument, setIdentityDocument] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/adopter/me/")
      .then(({ data }) => {
        setForm({
          first_name: data.user?.first_name || user?.first_name || "",
          last_name: data.user?.last_name || user?.last_name || "",
          email: data.user?.email || user?.email || "",
          phone: data.phone || "",
          address: data.address || "",
          emergency_contact: data.user?.profile?.emergency_contact || "",
          emergency_phone: data.user?.profile?.emergency_phone || "",
          housing_type: data.housing_type || "",
          owns_or_rents: data.owns_or_rents || "",
          has_pets: data.has_pets ? "yes" : "no",
          experience: data.experience || "",
        });
        setPreview(mediaUrl(data.user?.profile?.profile_photo_url || user?.profile?.profile_photo_url));
        setError("");
      })
      .catch(() => setError("No fue posible cargar tus datos."));
  }, [user]);

  useEffect(() => {
    if (!profilePhoto) return;
    const url = URL.createObjectURL(profilePhoto);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePhoto]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
    if (profilePhoto) payload.append("profile_photo", profilePhoto);
    if (identityDocument) payload.append("identity_document", identityDocument);
    try {
      await api.patch("/adopter/me/", payload, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshUser();
      setMessage("Perfil actualizado correctamente.");
    } catch {
      setError("No fue posible guardar tu perfil.");
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="adopter-page">
      <div className="adopter-section-header">
        <i className="bi bi-person-vcard" />
        <div>
          <h1>Mi perfil de adoptante</h1>
          <p>Manten tus datos completos para agilizar entrevistas, visitas y seguimiento.</p>
        </div>
      </div>
      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}
      <section className="adopter-profile-layout">
        <aside className="adopter-panel adopter-profile-card">
          <div className="adopter-profile-photo">
            <img src={preview || logoPaw} alt="Foto de perfil" />
            <label className="adopter-photo-upload">
              <input type="file" accept="image/*" onChange={(event) => setProfilePhoto(event.target.files[0] || null)} />
              <i className="bi bi-camera" />
            </label>
          </div>
          <h2>{form.first_name || "Adoptante"} {form.last_name}</h2>
          <span>Cuenta de adoptante</span>
          <p>{form.email}</p>
        </aside>
        <form className="adopter-panel adopter-profile-form" onSubmit={submit}>
          <div className="section-title">
            <i className="bi bi-pencil-square" />
            <div>
              <h2>Datos personales</h2>
              <p>Informacion usada por los refugios en tus procesos activos.</p>
            </div>
          </div>
          <div className="two-cols">
            <Field label="Nombres" value={form.first_name} onChange={(value) => update("first_name", value)} />
            <Field label="Apellidos" value={form.last_name} onChange={(value) => update("last_name", value)} />
            <Field label="Correo electronico" type="email" value={form.email} onChange={(value) => update("email", value)} />
            <Field label="Telefono" value={form.phone} onChange={(value) => update("phone", value)} />
            <label className="full-span">Direccion completa<input value={form.address} onChange={(event) => update("address", event.target.value)} /></label>
            <Field label="Contacto de emergencia" value={form.emergency_contact} onChange={(value) => update("emergency_contact", value)} />
            <Field label="Telefono de emergencia" value={form.emergency_phone} onChange={(value) => update("emergency_phone", value)} />
          </div>
          <div className="section-title compact-title">
            <i className="bi bi-house-heart" />
            <div>
              <h2>Entorno y experiencia</h2>
              <p>Ayuda al refugio a valorar compatibilidad.</p>
            </div>
          </div>
          <div className="two-cols">
            <label>Tipo de vivienda<select value={form.housing_type} onChange={(event) => update("housing_type", event.target.value)}><option value="">Selecciona</option><option value="apartment">Apartamento</option><option value="house">Casa</option><option value="farm">Finca</option></select></label>
            <label>Tenencia<select value={form.owns_or_rents} onChange={(event) => update("owns_or_rents", event.target.value)}><option value="">Selecciona</option><option value="own">Propia</option><option value="rent">Arrendada</option><option value="family">Familiar</option></select></label>
            <label>Tienes otras mascotas<select value={form.has_pets} onChange={(event) => update("has_pets", event.target.value)}><option value="no">No</option><option value="yes">Si</option></select></label>
            <label className="full-span">Experiencia con mascotas<textarea value={form.experience} onChange={(event) => update("experience", event.target.value)} /></label>
          </div>
          <FileUpload id="adopter-identity" accept=".pdf,image/*" file={identityDocument} onChange={setIdentityDocument} title="Documento de identidad" helper="PDF, JPG, JPEG o PNG" icon="bi-file-earmark-person" />
          <div className="adopter-form-actions">
            <button className="primary">Guardar perfil</button>
          </div>
        </form>
      </section>
    </section>
  );
}

function Field({ label, type = "text", value, onChange }) {
  return <label>{label}<input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>;
}
