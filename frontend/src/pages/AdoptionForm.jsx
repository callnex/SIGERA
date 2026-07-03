import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../api/auth.jsx";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, Badge, FileUpload } from "../components/UI.jsx";

export default function AdoptionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [ok, setOk] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [form, setForm] = useState({
    full_name: "", document_type: "CC", document: "", identity_document: null, phone: "",
    email: "", password: "", address: "", housing_type: "", owns_or_rents: "",
    has_pets: false, experience: "", motivation: "",
  });
  const [identityDocumentName, setIdentityDocumentName] = useState("");

  useEffect(() => { api.get(`/catalog/${id}/`).then((res) => setAnimal(res.data)); }, [id]);

  useEffect(() => {
    const isAdopter = user?.profile?.role === "adopter";
    if (!isAdopter) return;
    setLoadingProfile(true);
    api.get("/adopter/me/")
      .then(({ data }) => {
        setForm((current) => ({
          ...current,
          full_name: data.full_name || `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim(),
          document_type: data.document_type || current.document_type,
          document: data.document || "",
          phone: data.phone || "",
          email: data.email || data.user?.email || "",
          address: data.address || "",
          housing_type: data.housing_type || "",
          owns_or_rents: data.owns_or_rents || "",
          has_pets: Boolean(data.has_pets),
          experience: data.experience || "",
        }));
        const existingDocument = data.identity_document ? data.identity_document.split("/").pop() : "";
        setIdentityDocumentName(existingDocument || "");
      })
      .finally(() => setLoadingProfile(false));
  }, [user]);

  async function submit(e) {
    e.preventDefault();
    const payload = new FormData();
    Object.entries({ ...form, animal: id }).forEach(([key, value]) => {
      if (value !== null) payload.append(key, value);
    });
    await api.post("/catalog/", payload);
    setOk(true);
    setTimeout(() => navigate("/catalogo"), 1800);
  }

  if (!animal) return <main className="public-page">Cargando...</main>;

  const isLoggedAdopter = user?.profile?.role === "adopter";

  return (
    <main className="public-page adoption-request-page">
      <Link to="/catalogo" className="back"><i className="bi bi-arrow-left" /> Volver al catalogo</Link>
      <section className="adoption-request-hero">
        <div>
          <span className="eyebrow">Solicitud de adopcion</span>
          <h1>Queremos conocer tu hogar</h1>
          <p>Completa tus datos para que el refugio pueda revisar tu perfil y continuar el proceso responsable de adopcion de <strong>{animal.name}</strong>.</p>
        </div>
        <article className="adoption-pet-card">
          <AnimalPhoto src={mediaUrl(animal.photo_url)} name={animal.name} />
          <div>
            <h2>{animal.name}</h2>
            <Badge tone="blue">{animal.sex_label}</Badge>
            <Badge tone="gray">{animal.breed || animal.species_label}</Badge>
            <Badge tone="gray">{animal.approximate_age}</Badge>
          </div>
        </article>
      </section>

      {ok && <div className="alert success">Solicitud enviada correctamente.</div>}
      {loadingProfile && <div className="alert success">Cargando tus datos guardados para completar la solicitud.</div>}

      <form className="adoption-request-layout public-form" onSubmit={submit}>
        <div className="adoption-form-stack">
          <section className="panel form-section adoption-form-shell">
            <div className="section-title"><i className="bi bi-person-vcard" /><div><h2>Tus datos</h2><p>Informacion de contacto e identificacion del solicitante.</p></div></div>
            <div className="two-cols">
              <Field label="Nombre completo" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <label>Tipo de documento<select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}><option>CC</option><option>CE</option><option>Pasaporte</option><option>Otro</option></select></label>
              <Field label="Numero de documento" value={form.document} onChange={(v) => setForm({ ...form, document: v })} />
              <Field label="Telefono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Correo electronico" value={form.email} type="email" onChange={(v) => setForm({ ...form, email: v })} />
              {!isLoggedAdopter ? <Field label="Contrasena para tu cuenta" value={form.password} type="password" onChange={(v) => setForm({ ...form, password: v })} /> : <div className="adoption-prefill-note"><strong>Cuenta vinculada</strong><span>Usaremos tu cuenta actual para esta solicitud.</span></div>}
            </div>
            <Field label="Direccion completa" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <FileUpload
              id="identity-document"
              accept="application/pdf,image/jpeg,image/png"
              file={form.identity_document}
              onChange={(file) => setForm({ ...form, identity_document: file })}
              title="Documento de identidad"
              helper={identityDocumentName ? `Documento actual: ${identityDocumentName}` : "Adjunta PDF, JPG, JPEG o PNG"}
              icon="bi-cloud-arrow-up"
            />
          </section>

          <section className="panel form-section adoption-form-shell">
            <div className="section-title"><i className="bi bi-house-heart" /><div><h2>Entorno y experiencia</h2><p>Datos para evaluar si el hogar se ajusta a las necesidades del animal.</p></div></div>
            <div className="two-cols">
              <Field label="Tipo de vivienda" value={form.housing_type} onChange={(v) => setForm({ ...form, housing_type: v })} />
              <Field label="Propietario o alquiler" value={form.owns_or_rents} onChange={(v) => setForm({ ...form, owns_or_rents: v })} />
            </div>
            <label className="check"><input type="checkbox" checked={form.has_pets} onChange={(e) => setForm({ ...form, has_pets: e.target.checked })} /> Tengo otras mascotas actualmente</label>
            <label>Experiencia previa<textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></label>
          </section>

          <section className="panel form-section adoption-form-shell">
            <div className="section-title"><i className="bi bi-chat-heart" /><div><h2>Motivacion</h2><p>Cuentale al refugio por que quieres iniciar esta adopcion.</p></div></div>
            <label>Por que quieres adoptar a {animal.name}?<textarea value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} required /></label>
            <button className="primary cta">Enviar solicitud <i className="bi bi-send" /></button>
          </section>
        </div>

        <aside className="panel adoption-side-card">
          <h2>Proceso responsable</h2>
          <p>El refugio revisara tu solicitud, validara la documentacion y te contactara para los siguientes pasos.</p>
          <ul>
            <li><i className="bi bi-check2-circle" /> Revision de datos</li>
            <li><i className="bi bi-check2-circle" /> Entrevista o visita</li>
            <li><i className="bi bi-check2-circle" /> Formalizacion de adopcion</li>
          </ul>
        </aside>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} required /></label>;
}
