import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, Badge, FileUpload, PageHeader } from "../components/UI.jsx";

const emptyForm = (animal = "") => ({ animal, record_type: "consultation", date: new Date().toISOString().slice(0, 10), diagnosis: "", medication: "", dosage: "", health_status: "healthy", next_event: "", next_event_date: "", notes: "", attachment: null });

export default function MedicalRecords() {
  const [params] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm(params.get("animal") || ""));

  const load = async () => {
    const [animalRes, recordRes] = await Promise.all([api.get("/animals/"), api.get("/medical-records/")]);
    setAnimals(animalRes.data);
    setRecords(recordRes.data);
  };

  useEffect(() => { load().catch(() => setError("No fue posible cargar el historial medico.")); }, []);
  const selectedAnimal = useMemo(() => animals.find((animal) => String(animal.id) === String(selected?.animal)), [animals, selected]);

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([field, value]) => { if (field !== "attachment" && value !== null) payload.append(field, value); });
    if (form.attachment instanceof File) payload.append("attachment", form.attachment);
    try {
      await api.post("/medical-records/", payload);
      setForm(emptyForm(form.animal));
      await load();
    } catch {
      setError("No fue posible guardar el registro medico.");
    }
  }

  async function exportMedicalPdf() {
    const animalId = selectedAnimal?.id || selected?.animal;
    if (!animalId) {
      setError("Selecciona un registro medico asociado a un animal para exportar.");
      return;
    }
    try {
      const response = await api.get(`/animals/${animalId}/medical-expedient.pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `expediente_medico_${selectedAnimal.name || "animal"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1200);
      setError("");
    } catch {
      setError("No fue posible exportar el expediente medico.");
    }
  }

  return <>
    <PageHeader title="Historial Medico" subtitle="Registra intervenciones, vacunas y tratamientos." />
    {error && <div className="alert error">{error}</div>}
    <section className="medical-grid">
      <form className="panel form-section" onSubmit={submit}>
        <div className="section-title"><i className="bi bi-clipboard2-plus" /><div><h2>Registrar intervencion</h2><p>Actualiza el expediente clinico y los proximos controles.</p></div></div>
        <div className="two-cols">
          <label>Animal<select value={form.animal} onChange={(event) => setForm({ ...form, animal: event.target.value })} required><option value="">Seleccionar</option>{animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.name}</option>)}</select></label>
          <label>Tipo<select value={form.record_type} onChange={(event) => setForm({ ...form, record_type: event.target.value })}><option value="consultation">Consulta</option><option value="vaccine">Vacuna</option><option value="deworming">Desparasitacion</option><option value="treatment">Tratamiento</option><option value="surgery">Cirugia</option></select></label>
          <label>Fecha<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label>Estado<select value={form.health_status} onChange={(event) => setForm({ ...form, health_status: event.target.value })}><option value="healthy">Saludable</option><option value="treatment">En tratamiento</option><option value="recovery">En recuperacion</option><option value="critical">Critico</option><option value="not_ready">No apto para adopcion</option><option value="ready">Apto para adopcion</option></select></label>
          <label>Medicamento<input value={form.medication} onChange={(event) => setForm({ ...form, medication: event.target.value })} /></label>
          <label>Dosis<input value={form.dosage} onChange={(event) => setForm({ ...form, dosage: event.target.value })} /></label>
        </div>
        <label>Diagnostico<input value={form.diagnosis} onChange={(event) => setForm({ ...form, diagnosis: event.target.value })} required /></label>
        <div className="two-cols"><label>Proximo evento<input value={form.next_event} onChange={(event) => setForm({ ...form, next_event: event.target.value })} placeholder="Refuerzo de vacuna" /></label><label>Fecha del proximo evento<input type="date" value={form.next_event_date} onChange={(event) => setForm({ ...form, next_event_date: event.target.value })} /></label></div>
        <label>Observaciones<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <FileUpload id="medical-attachment" accept="image/*,.pdf" file={form.attachment} onChange={(file) => setForm({ ...form, attachment: file })} title="Archivo clinico" helper="Adjunta PDF, foto o soporte medico" icon="bi-cloud-arrow-up" />
        <button className="primary"><i className="bi bi-floppy" /> Guardar registro</button>
      </form>
      <aside className="panel medical-history-list">
        <div className="section-title"><i className="bi bi-clock-history" /><div><h2>Historial reciente</h2><p>Selecciona un registro para ver el expediente.</p></div></div>
        {records.length ? records.map((record) => <button className={`timeline timeline-button ${selected?.id === record.id ? "active" : ""}`} type="button" key={record.id} onClick={() => setSelected(record)}><strong>{record.record_type_label}</strong><span>{record.diagnosis}</span><small>{record.date}{record.next_event ? ` - Proximo: ${record.next_event}` : ""}</small></button>) : <p className="empty-state">No hay intervenciones registradas.</p>}
      </aside>
    </section>
    {selected && <section className="panel medical-record-detail">
      <div className="section-title"><i className="bi bi-file-medical" /><div><h2>Detalle de la intervencion</h2><p>Expediente de {selectedAnimal?.name || "animal"}.</p></div><div className="detail-actions">{selectedAnimal && <Link className="secondary small" to={`/admin/animales/${selectedAnimal.id}`}><i className="bi bi-eye" /> Ver perfil del animal</Link>}<button className="secondary small" type="button" onClick={exportMedicalPdf}><i className="bi bi-file-earmark-pdf" /> Exportar PDF</button><button className="secondary small" type="button" onClick={() => setSelected(null)}>Cerrar</button></div></div>
      <div className="medical-detail-grid">
        <div className="medical-animal-summary"><AnimalPhoto src={mediaUrl(selectedAnimal?.photo_url)} name={selectedAnimal?.name} /><div><h3>{selectedAnimal?.name}</h3><p>{selectedAnimal?.species_label} {selectedAnimal?.breed ? `- ${selectedAnimal.breed}` : ""}</p><Badge tone={selected.health_status === "critical" ? "red" : selected.health_status === "treatment" ? "orange" : "green"}>{selected.health_status_label}</Badge></div></div>
        <Detail label="Intervencion" value={selected.record_type_label} /><Detail label="Fecha y profesional" value={`${selected.date}${selected.veterinarian_name ? ` - ${selected.veterinarian_name}` : ""}`} />
        <Detail label="Diagnostico" value={selected.diagnosis} /><Detail label="Medicacion y dosis" value={`${selected.medication || "No aplica"}${selected.dosage ? ` - ${selected.dosage}` : ""}`} />
        <Detail label="Proximo evento" value={`${selected.next_event || "Sin programar"}${selected.next_event_date ? ` - ${selected.next_event_date}` : ""}`} />
      </div>
      {selected.notes && <div className="medical-notes"><strong>Observaciones clinicas</strong><p>{selected.notes}</p></div>}
      {selected.attachment_url && <a className="secondary small" href={mediaUrl(selected.attachment_url)} target="_blank" rel="noreferrer"><i className="bi bi-paperclip" /> Abrir archivo clinico</a>}
    </section>}
  </>;
}

function Detail({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
