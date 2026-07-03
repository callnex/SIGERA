import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, PageHeader } from "../components/UI.jsx";

const empty = {
  code: "",
  name: "",
  species: "dog",
  breed: "",
  sex: "female",
  size: "medium",
  approximate_age: "",
  weight_kg: "",
  color: "",
  intake_date: new Date().toISOString().slice(0, 10),
  intake_reason: "",
  location: "",
  location_ref: "",
  country: "CO",
  region: "Bogota D.C.",
  status: "intake",
  behavior_notes: "",
  public_description: "",
  personality_tags: "",
  vaccinated: false,
  sterilized: false,
  dewormed: false,
  adoption_ready: false,
  is_public: false,
};

export default function AnimalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) api.get(`/animals/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  useEffect(() => {
    api.get("/locations/").then((res) => setLocations(res.data)).catch(() => setLocations([]));
  }, []);

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (!["photo", "photo_url", "medical_records", "location_name", "shelter", "created_at", "updated_at"].includes(key) && value !== null) {
        payload.append(key, value);
      }
    });
    if (form.photo instanceof File) payload.append("photo", form.photo);
    try {
      if (id) await api.patch(`/animals/${id}/`, payload);
      else await api.post("/animals/", payload);
      navigate("/admin/animales");
    } catch {
      setError("No fue posible guardar el perfil del animal.");
    }
  }

  async function removeAnimal() {
    if (!window.confirm(`Eliminar el registro de ${form.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/animals/${id}/`);
      navigate("/admin/animales");
    } catch {
      setError("No se puede eliminar este animal porque tiene registros relacionados.");
    }
  }

  const photo = form.photo instanceof File ? URL.createObjectURL(form.photo) : mediaUrl(form.photo_url);

  return (
    <>
      <PageHeader title={id ? "Editar perfil animal" : "Registrar animal"} subtitle="Ingresa los datos del animal para crear o actualizar su expediente." />
      {error && <div className="alert error">{error}</div>}
      <form className="animal-editor-grid" onSubmit={submit}>
        <aside className="panel actions-panel animal-editor-actions">
          <div className="animal-editor-photo">
            <AnimalPhoto src={photo} name={form.name} />
            <input id="animal-photo-input" className="visually-hidden" type="file" accept="image/*" onChange={(event) => setForm({ ...form, photo: event.target.files[0] })} />
            <label className="animal-photo-upload" htmlFor="animal-photo-input">
              <i className="bi bi-camera" /> {photo ? "Cambiar foto" : "Subir foto"}
            </label>
          </div>
          <div className="animal-editor-summary">
            <h2>{form.name || "Nuevo animal"}</h2>
            <p>{form.code || "Código pendiente"} · {form.approximate_age || "Edad por definir"}</p>
            <div className="check-grid">
              {form.adoption_ready && <span className="badge blue">Apto para adopción</span>}
              {form.is_public && <span className="badge green">Publicado</span>}
            </div>
          </div>
          <button className="primary">Guardar registro</button>
          <button type="button" className="secondary" onClick={() => navigate(-1)}>Cancelar</button>
          {id && <button type="button" className="danger-button" onClick={removeAnimal}><i className="bi bi-trash3" /> Eliminar Registro de Animal</button>}
        </aside>

        <div className="animal-editor-sections">
          <section className="panel form-section">
            <div className="section-title"><i className="bi bi-person-lines-fill" /><div><h2>Información básica</h2><p>Datos de identificación del animal dentro del refugio.</p></div></div>
            <div className="two-cols">
              {["code", "name", "breed", "approximate_age", "weight_kg", "color"].map((key) => (
                <label key={key}>{labels[key]}
                  <input type={key === "weight_kg" ? "number" : "text"} step={key === "weight_kg" ? "0.01" : undefined} value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={["code", "name"].includes(key)} />
                </label>
              ))}
              <label>Especie<select value={form.species} onChange={(event) => setForm({ ...form, species: event.target.value })}><option value="dog">Perro</option><option value="cat">Gato</option><option value="other">Otro</option></select></label>
              <label>Sexo<select value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })}><option value="female">Hembra</option><option value="male">Macho</option><option value="unknown">Desconocido</option></select></label>
              <label>Tamano<select value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })}><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option></select></label>
            </div>
          </section>

          <section className="panel form-section">
            <div className="section-title"><i className="bi bi-house-heart" /><div><h2>Ingreso al refugio</h2><p>Ubicación, estado y datos visibles en adopción.</p></div></div>
            <div className="two-cols">
              <label>Fecha de ingreso<input type="date" value={form.intake_date} onChange={(event) => setForm({ ...form, intake_date: event.target.value })} /></label>
              <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="intake">Ingresado</option><option value="observation">En observación</option><option value="treatment">En tratamiento</option><option value="available">Disponible</option><option value="adoption_process">En proceso de adopción</option><option value="adopted">Adoptado</option><option value="deceased">Fallecido</option><option value="lost">Perdido</option></select></label>
              <label>Motivo de ingreso<input value={form.intake_reason || ""} onChange={(event) => setForm({ ...form, intake_reason: event.target.value })} /></label>
              <label>Ubicación<select value={form.location_ref || ""} onChange={(event) => {
                const location = locations.find((item) => String(item.id) === event.target.value);
                setForm({ ...form, location_ref: event.target.value || null, location: location?.name || form.location });
              }}><option value="">Sin asignar</option>{locations.filter((location) => location.is_active).map((location) => <option value={location.id} key={location.id}>{location.name} ({location.occupancy}/{location.capacity || "-"})</option>)}</select></label>
              <label>Pais<select value={form.country || "CO"} onChange={(event) => setForm({ ...form, country: event.target.value })}>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
              <label>Departamento o provincia<input value={form.region || ""} onChange={(event) => setForm({ ...form, region: event.target.value })} /></label>
            </div>
            <label>Comportamiento y observaciones<textarea value={form.behavior_notes || ""} onChange={(event) => setForm({ ...form, behavior_notes: event.target.value })} /></label>
            <label>Descripción publica<textarea value={form.public_description || ""} onChange={(event) => setForm({ ...form, public_description: event.target.value })} /></label>
            <label>Etiquetas de personalidad<input value={form.personality_tags || ""} onChange={(event) => setForm({ ...form, personality_tags: event.target.value })} placeholder="Sociable, tranquila, buena con ninos" /></label>
            <div className="check-grid"><label className="check"><input type="checkbox" checked={!!form.vaccinated} onChange={(event) => setForm({ ...form, vaccinated: event.target.checked })} /> Vacunado</label><label className="check"><input type="checkbox" checked={!!form.sterilized} onChange={(event) => setForm({ ...form, sterilized: event.target.checked })} /> Esterilizado</label><label className="check"><input type="checkbox" checked={!!form.dewormed} onChange={(event) => setForm({ ...form, dewormed: event.target.checked })} /> Desparasitado</label></div>
            <label className="check"><input type="checkbox" checked={!!form.adoption_ready} onChange={(event) => setForm({ ...form, adoption_ready: event.target.checked })} /> Apto para adopción</label>
            <label className="check"><input type="checkbox" checked={!!form.is_public} onChange={(event) => setForm({ ...form, is_public: event.target.checked })} /> Publicar en catálogo</label>
          </section>
        </div>
      </form>
    </>
  );
}

const labels = { code: "Codigo", name: "Nombre", breed: "Raza", approximate_age: "Edad aproximada", weight_kg: "Peso (kg)", color: "Color" };
const countries = [["AR", "Argentina"], ["BO", "Bolivia"], ["BR", "Brasil"], ["CL", "Chile"], ["CO", "Colombia"], ["CR", "Costa Rica"], ["CU", "Cuba"], ["DO", "Republica Dominicana"], ["EC", "Ecuador"], ["SV", "El Salvador"], ["GT", "Guatemala"], ["HT", "Haiti"], ["HN", "Honduras"], ["MX", "Mexico"], ["NI", "Nicaragua"], ["PA", "Panama"], ["PY", "Paraguay"], ["PE", "Peru"], ["PR", "Puerto Rico"], ["UY", "Uruguay"], ["VE", "Venezuela"]];
