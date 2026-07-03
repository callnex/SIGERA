import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, Badge, PageHeader } from "../components/UI.jsx";

export default function Adopters() {
  const [adopters, setAdopters] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/adopters/").then((res) => setAdopters(res.data));
  }, []);

  return (
    <>
      <PageHeader title="Gestion de Adoptantes" subtitle="Directorio de personas con adopciones activas o en proceso." />
      <section className="table-panel adopter-table">
        <table>
          <thead><tr><th>Nombre</th><th>Documento</th><th>Contacto</th><th>Animales adoptados</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {adopters.map((adopter) => (
              <tr key={adopter.id}>
                <td><strong>{adopter.full_name}</strong><small>{adopter.housing_type || "Datos de vivienda pendientes"}</small></td>
                <td>{adopter.document_type || "Documento"}<small>{adopter.document}</small></td>
                <td>{adopter.phone}<small>{adopter.email}</small></td>
                <td>{adopter.adopted_animals?.length ? adopter.adopted_animals.map((animal) => <Badge key={animal.id} tone="gray">{animal.name}</Badge>) : "Sin adopciones formalizadas"}</td>
                <td><Badge>{adopter.adopted_animals?.length ? "Activo" : "En proceso"}</Badge></td>
                <td><button className="secondary small" onClick={() => setSelected(adopter)}><i className="bi bi-person-lines-fill" /> Ver ficha</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <section className="panel adopter-detail">
          <div className="section-title">
            <i className="bi bi-person-vcard" />
            <div><h2>{selected.full_name}</h2><p>Informacion entregada para los procesos de adopcion.</p></div>
            <button className="secondary small" onClick={() => setSelected(null)}>Cerrar</button>
          </div>
          <div className="adopter-detail-grid">
            <Detail label="Tipo y numero de documento" value={`${selected.document_type || "Documento"} - ${selected.document}`} />
            <Detail label="Correo electronico" value={selected.email} />
            <Detail label="Telefono" value={selected.phone} />
            <Detail label="Direccion" value={selected.address} />
            <Detail label="Tipo de vivienda" value={selected.housing_type} />
            <Detail label="Tenencia de la vivienda" value={selected.owns_or_rents} />
            <Detail label="Tiene otras mascotas" value={selected.has_pets ? "Si" : "No"} />
            <Detail label="Experiencia previa" value={selected.experience || "No registrada"} />
          </div>
          {selected.identity_document && <a className="secondary small" href={mediaUrl(selected.identity_document)} target="_blank" rel="noreferrer"><i className="bi bi-file-earmark-person" /> Ver documento de identidad</a>}
          <div className="adopter-motivation">
            <strong>Solicitudes y motivacion</strong>
            {selected.applications?.length ? (
              <div className="adopter-animal-links">
                {selected.applications.map((application) => (
                  <article className="adopter-animal-card" key={application.id}>
                    <AnimalPhoto src={mediaUrl(application.animal_photo_url)} name={application.animal_name} />
                    <div>
                      <div className="adopter-animal-head">
                        <strong>{application.animal_name}</strong>
                        <Badge tone="blue">{application.status}</Badge>
                      </div>
                      <small>{application.animal_species}{application.animal_breed ? ` · ${application.animal_breed}` : ""} · {application.animal_status}</small>
                      <p>{application.motivation || "Sin motivacion registrada."}</p>
                      <Link className="secondary small" to={`/admin/animales/${application.animal_id}`}><i className="bi bi-eye" /> Ver perfil del animal</Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p>Sin solicitudes relacionadas.</p>}
          </div>
        </section>
      )}
    </>
  );
}

function Detail({ label, value }) {
  return <div><span>{label}</span><strong>{value || "No registrado"}</strong></div>;
}
