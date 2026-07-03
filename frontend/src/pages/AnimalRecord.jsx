import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../api/auth.jsx";
import { AnimalPhoto, Badge } from "../components/UI.jsx";

const countries = {
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  DO: "Republica Dominicana",
  EC: "Ecuador",
  SV: "El Salvador",
  GT: "Guatemala",
  HT: "Haiti",
  HN: "Honduras",
  MX: "Mexico",
  NI: "Nicaragua",
  PA: "Panama",
  PY: "Paraguay",
  PE: "Peru",
  PR: "Puerto Rico",
  UY: "Uruguay",
  VE: "Venezuela",
};

export default function AnimalRecord() {
  const { user } = useAuth();
  const { id } = useParams();
  const [animal, setAnimal] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    api.get(`/animals/${id}/`).then((res) => setAnimal(res.data));
  }, [id]);

  const country = useMemo(() => {
    if (!animal) return "Sin país registrado";
    return countries[animal.country] || animal.country || "Sin país registrado";
  }, [animal]);

  if (!animal) return <p>Cargando...</p>;

  const canManageAnimals = ["admin", "vet"].includes(user?.profile?.role);
  const canReadMedical = ["admin", "vet"].includes(user?.profile?.role);
  const medicalRecords = animal.medical_records || [];
  const adoptionProcesses = animal.adoption_processes || [];

  return (
    <section className="record-grid animal-record-layout">
      <aside className="panel animal-profile animal-profile-feature">
        <div className="animal-profile-photo-frame">
          <AnimalPhoto src={mediaUrl(animal.photo_url)} name={animal.name} />
          <span className="animal-status-overlay">{animal.status_label}</span>
        </div>
        <div className="animal-profile-body">
          <div className="animal-profile-heading">
            <div className="animal-profile-title-row">
              <div>
                <h1>{animal.name}</h1>
                <p>{animal.species_label} - {animal.sex_label} - {animal.approximate_age || "Edad sin registrar"}</p>
              </div>
              {canManageAnimals && <Link className="secondary small animal-edit-link" to={`/admin/animales/${animal.id}/editar`}><i className="bi bi-pencil" /> Editar</Link>}
            </div>
            <p className="animal-profile-breed">{animal.breed || "Sin raza registrada"}</p>
          </div>

          <h3>Datos basicos</h3>
          <div className="basic-data-list">
            <DataRow icon="bi-heart-pulse" label="Especie" value={animal.species_label} />
            <DataRow icon="bi-award" label="Raza" value={animal.breed || "Sin raza registrada"} />
            <DataRow icon="bi-calendar3" label="Edad" value={animal.approximate_age || "Sin dato"} />
            <DataRow icon="bi-gender-ambiguous" label="Sexo" value={animal.sex_label} />
            <DataRow icon="bi-palette" label="Color" value={animal.color || "Sin dato"} />
            <DataRow icon="bi-geo-alt" label="Ubicacion" value={animal.location || animal.location_name || "Sin ubicación"} />
            <DataRow icon="bi-globe-americas" label="Pais" value={<CountryValue code={animal.country} name={country} />} />
          </div>
        </div>
      </aside>

      <div className="record-content">
        <div className="tabs animal-record-tabs">
          <button className={activeTab === "general" ? "active" : ""} type="button" onClick={() => setActiveTab("general")}>Información general</button>
          {canReadMedical && <button className={activeTab === "medical" ? "active" : ""} type="button" onClick={() => setActiveTab("medical")}>Historial médico</button>}
          <button className={activeTab === "adoption" ? "active" : ""} type="button" onClick={() => setActiveTab("adoption")}>Proceso de adopción</button>
        </div>

        {activeTab === "general" && (
          <>
            <section className="panel">
              <div className="two-cols">
                <p><strong>Fecha de ingreso</strong><br />{animal.intake_date}</p>
                <p><strong>Motivo de ingreso</strong><br /><Badge tone="gray">{animal.intake_reason || "Sin dato"}</Badge></p>
              </div>
              <hr />
              <h2>Comportamiento y notas</h2>
              <p>{animal.behavior_notes || animal.public_description || "No hay observaciones registradas."}</p>
            </section>
            <MedicalSummary records={medicalRecords} />
          </>
        )}

        {activeTab === "medical" && (
          <section className="panel animal-tab-panel">
            <div className="section-title"><i className="bi bi-clipboard2-pulse" /><div><h2>Historial médico</h2><p>Registros clínicos asociados a este animal.</p></div></div>
            {medicalRecords.length ? (
              <div className="animal-record-list">
                {medicalRecords.map((record) => (
                  <article key={record.id}>
                    <div><strong>{record.record_type_label}: {record.diagnosis}</strong><small>{record.date} - {record.veterinarian_name || "Sin veterinario"}</small></div>
                    <Badge tone={record.health_status === "critical" ? "red" : "blue"}>{record.health_status_label}</Badge>
                    {(record.medication || record.dosage || record.notes) && <p>{[record.medication && `Medicamento: ${record.medication}`, record.dosage && `Dosis: ${record.dosage}`, record.notes].filter(Boolean).join(" - ")}</p>}
                  </article>
                ))}
              </div>
            ) : <p className="empty-state"><i className="bi bi-clipboard-check" /> Este animal no tiene ningún historial médico registrado.</p>}
          </section>
        )}

        {activeTab === "adoption" && (
          <section className="panel animal-tab-panel">
            <div className="section-title"><i className="bi bi-heart" /><div><h2>Proceso de adopción</h2><p>Solicitudes, entrevistas y seguimiento asociados.</p></div></div>
            {adoptionProcesses.length ? (
              <div className="animal-record-list adoption-record-list">
                {adoptionProcesses.map((process) => (
                  <article key={process.id}>
                    <div><strong>{process.adopter_name}</strong><small>{process.adopter_email}</small></div>
                    <Badge tone="blue">{process.status}</Badge>
                    <p>{process.motivation || "Sin motivacion registrada."}</p>
                    <small>
                      {[
                        process.official_adoption_date && `Adopcion: ${process.official_adoption_date}`,
                        process.interview_date && `Entrevista: ${process.interview_date}`,
                        process.home_visit_date && `Visita: ${process.home_visit_date}`,
                        process.follow_up_due_date && `Seguimiento: ${process.follow_up_due_date}`,
                      ].filter(Boolean).join(" - ") || "Sin fechas registradas."}
                    </small>
                  </article>
                ))}
              </div>
            ) : <p className="empty-state"><i className="bi bi-heart" /> Este animal no tiene ningún proceso de adopción registrado.</p>}
          </section>
        )}
      </div>
    </section>
  );
}

function DataRow({ icon, label, value }) {
  return (
    <div className="basic-data-row">
      <span><i className={`bi ${icon}`} />{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CountryValue({ code, name }) {
  return <span className="country-value"><span aria-hidden="true" className={`css-flag flag-${String(code || "").toLowerCase()}`} />{name}</span>;
}

function MedicalSummary({ records }) {
  return (
    <section className="panel">
      <h2>Resumen médico</h2>
      {records.length ? (
        <table>
          <thead><tr><th>Fecha</th><th>Procedimiento</th><th>Veterinario</th></tr></thead>
          <tbody>{records.slice(0, 4).map((record) => <tr key={record.id}><td>{record.date}</td><td>{record.record_type_label}: {record.diagnosis}</td><td>{record.veterinarian_name || "Sin asignar"}</td></tr>)}</tbody>
        </table>
      ) : <p className="empty-state"><i className="bi bi-clipboard-check" /> Sin registros médicos hasta el momento.</p>}
    </section>
  );
}
