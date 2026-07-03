import { useEffect, useMemo, useState } from "react";
import { State } from "country-state-city";
import { api, mediaUrl } from "../api/client";
import { PageHeader } from "../components/UI.jsx";

const empty = {
  name: "",
  organization_document: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  country: "CO",
  region: "Bogota D.C.",
  capacity: 0,
  operating_hours: "",
  public_description: "",
  adoption_policy: "",
  notification_email: "",
  notify_stock_alerts: true,
  notify_medical_alerts: true,
  logo: null,
  logo_url: "",
};

const latinCountries = [
  ["AR", "Argentina"], ["BO", "Bolivia"], ["BR", "Brasil"], ["CL", "Chile"], ["CO", "Colombia"],
  ["CR", "Costa Rica"], ["CU", "Cuba"], ["DO", "Republica Dominicana"], ["EC", "Ecuador"],
  ["SV", "El Salvador"], ["GT", "Guatemala"], ["HT", "Haiti"], ["HN", "Honduras"], ["MX", "Mexico"],
  ["NI", "Nicaragua"], ["PA", "Panama"], ["PY", "Paraguay"], ["PE", "Peru"], ["PR", "Puerto Rico"],
  ["UY", "Uruguay"], ["VE", "Venezuela"],
].sort((a, b) => a[1].localeCompare(b[1], "es"));

function cleanName(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function ShelterSettings() {
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/shelter-settings/")
      .then(({ data }) => setForm({ ...empty, ...data }))
      .catch(() => setError("No fue posible cargar la configuracion."));
  }, []);

  const countryCode = form.country || "CO";
  const regions = useMemo(() => State.getStatesOfCountry(countryCode)
    .map((state) => cleanName(state.name))
    .sort((a, b) => a.localeCompare(b, "es")), [countryCode]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setCountry = (value) => setForm((current) => ({ ...current, country: value, region: "" }));

  async function save(event) {
    event.preventDefault();
    const payload = new FormData();
    [
      "name", "organization_document", "contact_name", "email", "phone", "address", "country", "region",
      "capacity", "operating_hours", "public_description", "adoption_policy", "notification_email",
      "notify_stock_alerts", "notify_medical_alerts",
    ].forEach((field) => payload.append(field, form[field]));
    if (form.logo instanceof File) payload.append("logo", form.logo);
    try {
      const { data } = await api.patch("/shelter-settings/", payload);
      setForm({ ...empty, ...data });
      setMessage("Configuracion guardada.");
      setError("");
    } catch {
      setError("No fue posible guardar la configuracion.");
    }
  }

  return <>
    <PageHeader title="Configuracion del refugio" subtitle="Datos institucionales, capacidad, reglas de adopcion y notificaciones." />
    {message && <div className="alert success">{message}</div>}
    {error && <div className="alert error">{error}</div>}
    <form className="settings-grid" onSubmit={save}>
      <section className="panel form-section">
        <div className="section-title">
          <i className="bi bi-buildings" />
          <div>
            <h2>Identidad institucional</h2>
            <p>Informacion visible para el equipo y el catalogo publico.</p>
          </div>
        </div>
        <div className="two-cols">
          <Field label="Nombre del refugio" value={form.name} onChange={(value) => set("name", value)} />
          <Field label="Documento o NIT" value={form.organization_document} onChange={(value) => set("organization_document", value)} />
          <Field label="Responsable principal" value={form.contact_name} onChange={(value) => set("contact_name", value)} />
          <Field label="Correo institucional" type="email" value={form.email} onChange={(value) => set("email", value)} />
          <Field label="Telefono" value={form.phone} onChange={(value) => set("phone", value)} />
          <Field label="Capacidad total" type="number" value={form.capacity} onChange={(value) => set("capacity", value)} />
          <label>
            Pais
            <span className="settings-country-field">
              <span className={`css-flag flag-${String(countryCode).toLowerCase()}`} aria-hidden="true" />
              <select value={countryCode} onChange={(event) => setCountry(event.target.value)}>
                {latinCountries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </span>
          </label>
          <label>
            Departamento, estado o provincia
            <select value={form.region || ""} onChange={(event) => set("region", event.target.value)}>
              <option value="">Selecciona una region</option>
              {regions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </label>
        </div>
        <label>Direccion<input value={form.address} onChange={(event) => set("address", event.target.value)} /></label>
        <label>Horario de atencion<input value={form.operating_hours} onChange={(event) => set("operating_hours", event.target.value)} placeholder="Lunes a viernes, 8:00 a.m. a 5:00 p.m." /></label>
        <label>Descripcion publica<textarea value={form.public_description} onChange={(event) => set("public_description", event.target.value)} /></label>
      </section>
      <aside className="panel settings-aside">
        <div className="shelter-logo-uploader">
          <div className="shelter-logo">{form.logo_url ? <img src={mediaUrl(form.logo_url)} alt="Logo del refugio" /> : <i className="bi bi-image" />}</div>
          <input id="shelter-logo-input" className="visually-hidden" type="file" accept="image/*" onChange={(event) => set("logo", event.target.files[0])} />
          <label className="image-upload-overlay" htmlFor="shelter-logo-input"><i className="bi bi-camera" /> Cambiar logo</label>
        </div>
        <span className="badge blue">Codigo: {form.code || "..."}</span>
      </aside>
      <section className="panel form-section">
        <div className="section-title">
          <i className="bi bi-heart-pulse" />
          <div>
            <h2>Adopciones y notificaciones</h2>
            <p>Define como se comunica y opera el refugio.</p>
          </div>
        </div>
        <label>Politica de adopcion<textarea value={form.adoption_policy} onChange={(event) => set("adoption_policy", event.target.value)} placeholder="Criterios, documentos y proceso de adopcion." /></label>
        <div className="two-cols">
          <Field label="Correo para alertas" type="email" value={form.notification_email} onChange={(value) => set("notification_email", value)} />
          <div className="notification-toggles">
            <label className="check"><input type="checkbox" checked={!!form.notify_stock_alerts} onChange={(event) => set("notify_stock_alerts", event.target.checked)} /> Alertas de inventario</label>
            <label className="check"><input type="checkbox" checked={!!form.notify_medical_alerts} onChange={(event) => set("notify_medical_alerts", event.target.checked)} /> Alertas medicas</label>
          </div>
        </div>
        <button className="primary"><i className="bi bi-floppy" /> Guardar configuracion</button>
      </section>
    </form>
  </>;
}

function Field({ label, type = "text", value, onChange }) {
  return <label>{label}<input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>;
}
