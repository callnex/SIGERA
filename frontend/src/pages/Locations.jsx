import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, Badge, PageHeader } from "../components/UI.jsx";

const empty = { name: "", location_type: "kennel", capacity: 0, notes: "", is_active: true };

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  const selected = useMemo(() => locations.find((location) => location.id === selectedId) || locations[0], [locations, selectedId]);

  const load = () => api.get("/locations/")
    .then(({ data }) => {
      setLocations(data);
      setError("");
      if (!selectedId && data.length) setSelectedId(data[0].id);
    })
    .catch(() => setError("No fue posible cargar las ubicaciones."));

  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/locations/${editingId}/`, form);
      } else {
        await api.post("/locations/", form);
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch {
      setError("No fue posible guardar la ubicacion.");
    }
  }

  function startEdit(location) {
    setEditingId(location.id);
    setSelectedId(location.id);
    setForm({
      name: location.name,
      location_type: location.location_type,
      capacity: location.capacity || 0,
      notes: location.notes || "",
      is_active: location.is_active,
    });
  }

  async function remove(location) {
    if (!window.confirm(`Eliminar el area ${location.name}?`)) return;
    try {
      await api.delete(`/locations/${location.id}/`);
      setSelectedId(null);
      load();
    } catch {
      setError("No fue posible eliminar el area. Verifica que no tenga animales asignados.");
    }
  }

  return (
    <>
      <PageHeader title="Ubicaciones y capacidad" subtitle="Organiza caniles, gaterias, cuarentena y area medica." />
      {error && <div className="alert error">{error}</div>}
      <section className="locations-board">
        <form className="panel form-section location-form-panel" onSubmit={save}>
          <div className="section-title"><i className="bi bi-pin-map" /><div><h2>{editingId ? "Editar ubicacion" : "Nueva ubicacion"}</h2><p>Crea zonas y controla capacidad operativa.</p></div></div>
          <label>Nombre<input value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Pabellon A" /></label>
          <div className="two-cols">
            <label>Tipo<select value={form.location_type} onChange={(event) => setForm({ ...form, location_type: event.target.value })}><option value="kennel">Canil</option><option value="cattery">Gateria</option><option value="medical">Area medica</option><option value="quarantine">Cuarentena</option><option value="other">Otra</option></select></label>
            <label>Capacidad<input type="number" min="0" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label>
          </div>
          <label>Notas<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={!!form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Area activa</label>
          <div className="form-actions">
            {editingId && <button className="secondary" type="button" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar</button>}
            <button className="primary">{editingId ? "Guardar cambios" : "Crear ubicacion"}</button>
          </div>
        </form>

        <section className="panel location-list-panel">
          <div className="section-title"><i className="bi bi-grid-3x3-gap" /><div><h2>Areas del refugio</h2><p>Selecciona un area para ver animales y acciones.</p></div></div>
          <div className="location-card-list">
            {locations.map((location) => (
              <button key={location.id} type="button" className={`location-card ${selected?.id === location.id ? "active" : ""}`} onClick={() => setSelectedId(location.id)}>
                <span><strong>{location.name}</strong><small>{location.location_type_label}</small></span>
                <span className="location-capacity">{location.occupancy}/{location.capacity || "-"}</span>
                <Badge tone={location.is_active ? "green" : "gray"}>{location.is_active ? "Activa" : "Cerrada"}</Badge>
              </button>
            ))}
          </div>
        </section>

        <section className="panel location-detail-panel">
          {selected ? (
            <>
              <div className="section-title location-detail-title">
                <i className="bi bi-geo-alt" />
                <div><h2>{selected.name}</h2><p>{selected.notes || "Sin notas registradas."}</p></div>
                <div className="location-actions">
                  <button className="secondary small" type="button" onClick={() => startEdit(selected)}><i className="bi bi-pencil" /> Editar</button>
                  {editingId === selected.id && <button className="danger-button small" type="button" onClick={() => remove(selected)}><i className="bi bi-trash" /> Eliminar</button>}
                </div>
              </div>
              <div className="location-detail-stats">
                <Detail label="Tipo" value={selected.location_type_label} />
                <Detail label="Ocupacion" value={`${selected.occupancy}/${selected.capacity || "Sin limite"}`} />
                <Detail label="Estado" value={selected.is_active ? "Activa" : "Cerrada"} />
              </div>
              <h3>Animales en esta area</h3>
              <div className="location-animal-list">
                {(selected.animals || []).length ? selected.animals.map((animal) => (
                  <Link to={`/admin/animales/${animal.id}`} key={animal.id} className="location-animal">
                    <AnimalPhoto src={mediaUrl(animal.photo_url)} name={animal.name} />
                    <span><strong>{animal.name}</strong><small>{animal.species} - {animal.status}</small></span>
                    <i className="bi bi-arrow-right" />
                  </Link>
                )) : <p className="empty-state">No hay animales asignados a esta area.</p>}
              </div>
            </>
          ) : <p className="empty-state">Aun no hay areas registradas.</p>}
        </section>
      </section>
    </>
  );
}

function Detail({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
