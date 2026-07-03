import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Badge, FileUpload, PageHeader, StatCard } from "../components/UI.jsx";

export default function Adoptions() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [workflow, setWorkflow] = useState({ status: "review", decision_notes: "", interview_date: "", home_visit_date: "", follow_up_due_date: "", official_adoption_date: "", follow_up_notes: "", contract_document: null });

  const load = () => api.get("/adoption-applications/")
    .then((res) => { setApps(res.data); setError(""); })
    .catch(() => setError("No fue posible cargar las solicitudes de adopcion."));

  useEffect(() => { load(); }, []);

  async function formalize(id) {
    try {
      await api.post(`/adoption-applications/${id}/formalize/`, {});
      load();
    } catch {
      setError("No fue posible formalizar la adopcion.");
    }
  }

  function openWorkflow(application) {
    setSelected(application);
    setWorkflow({
      status: application.status,
      decision_notes: application.decision_notes || "",
      interview_date: dateTimeValue(application.interview_date),
      home_visit_date: dateTimeValue(application.home_visit_date),
      follow_up_due_date: application.follow_up_due_date || "",
      official_adoption_date: application.official_adoption_date || "",
      follow_up_notes: application.follow_up_notes || "",
      contract_document: null,
    });
  }

  async function saveWorkflow(event) {
    event.preventDefault();
    try {
      if (workflow.status === "formalized") {
        await api.post(`/adoption-applications/${selected.id}/formalize/`, { official_adoption_date: workflow.official_adoption_date || undefined });
      } else {
        const payload = new FormData();
        ["status", "decision_notes", "interview_date", "home_visit_date", "follow_up_due_date", "follow_up_notes"].forEach((field) => payload.append(field, workflow[field] || ""));
        if (workflow.contract_document instanceof File) payload.append("contract_document", workflow.contract_document);
        await api.patch(`/adoption-applications/${selected.id}/`, payload);
      }
      setSelected(null);
      load();
    } catch {
      setError("No fue posible actualizar el proceso de adopcion.");
    }
  }

  return (
    <>
      <PageHeader title="Solicitudes de Adopcion" subtitle="Gestion interna y seguimiento de procesos de adopcion." />
      {error && <div className="alert error">{error}</div>}
      <section className="stats-grid">
        <StatCard icon="bi-clipboard-check" label="Pendientes" value={apps.filter((app) => app.status === "pending").length} tone="orange" />
        <StatCard icon="bi-check-circle" label="Aprobadas" value={apps.filter((app) => app.status === "approved").length} />
        <StatCard icon="bi-arrow-clockwise" label="Formalizadas" value={apps.filter((app) => app.status === "formalized").length} tone="blue" />
      </section>
      <section className="table-panel">
        <table>
          <thead><tr><th>Animal</th><th>Solicitante</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{apps.map((application) => (
            <tr key={application.id}>
              <td><strong>{application.animal_detail?.name}</strong><small>{application.animal_detail?.species_label}</small></td>
              <td>{application.adopter_detail?.full_name}<small>{application.adopter_detail?.email}</small></td>
              <td>{new Date(application.created_at).toLocaleDateString()}</td>
              <td><Badge tone={application.status === "rejected" ? "red" : ["pending", "review", "interview", "home_visit"].includes(application.status) ? "orange" : "green"}>{application.status_label}</Badge></td>
              <td><button className="secondary small" onClick={() => openWorkflow(application)}>Gestionar</button>{application.status === "approved" && <button className="primary small" onClick={() => formalize(application.id)}>Formalizar</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
      {selected && (
        <section className="panel workflow-panel">
          <div className="section-title"><i className="bi bi-heart-pulse" /><div><h2>Proceso de {selected.animal_detail?.name}</h2><p>{selected.adopter_detail?.full_name} · {selected.adopter_detail?.email}</p></div></div>
          <form className="form-section" onSubmit={saveWorkflow}>
            <div className="two-cols">
              <label>Estado<select value={workflow.status} onChange={(event) => setWorkflow({ ...workflow, status: event.target.value })}><option value="pending">Pendiente</option><option value="review">En revision</option><option value="interview">Entrevista</option><option value="home_visit">Visita domiciliaria</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option><option value="formalized">Formalizar adopcion</option><option value="follow_up">Seguimiento</option></select></label>
              <label>Fecha oficial de adopcion<input type="date" value={workflow.official_adoption_date} onChange={(event) => setWorkflow({ ...workflow, official_adoption_date: event.target.value })} /></label>
              <label>Entrevista<input type="datetime-local" value={workflow.interview_date} onChange={(event) => setWorkflow({ ...workflow, interview_date: event.target.value })} /></label>
              <label>Visita domiciliaria<input type="datetime-local" value={workflow.home_visit_date} onChange={(event) => setWorkflow({ ...workflow, home_visit_date: event.target.value })} /></label>
              <label>Proximo seguimiento<input type="date" value={workflow.follow_up_due_date} onChange={(event) => setWorkflow({ ...workflow, follow_up_due_date: event.target.value })} /></label>
              <FileUpload id="adoption-contract" accept="application/pdf,image/*" file={workflow.contract_document} onChange={(file) => setWorkflow({ ...workflow, contract_document: file })} title="Contrato o soporte" helper="Adjunta contrato, soporte o imagen" icon="bi-file-earmark-arrow-up" />
            </div>
            <label>Decision, entrevista o motivo de rechazo<textarea value={workflow.decision_notes} onChange={(event) => setWorkflow({ ...workflow, decision_notes: event.target.value })} /></label>
            <label>Notas de seguimiento<textarea value={workflow.follow_up_notes} onChange={(event) => setWorkflow({ ...workflow, follow_up_notes: event.target.value })} /></label>
            <div className="inline-actions"><button className="primary">Guardar proceso</button><button className="secondary" type="button" onClick={() => setSelected(null)}>Cancelar</button></div>
          </form>
        </section>
      )}
    </>
  );
}

function dateTimeValue(value) { return value ? value.slice(0, 16) : ""; }
