import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { AnimalPhoto, Badge } from "../components/UI.jsx";

const countryLabels = {
  AR: "Argentina", BO: "Bolivia", BR: "Brasil", CL: "Chile", CO: "Colombia", CR: "Costa Rica",
  CU: "Cuba", DO: "Republica Dominicana", EC: "Ecuador", SV: "El Salvador", GT: "Guatemala",
  HT: "Haiti", HN: "Honduras", MX: "Mexico", NI: "Nicaragua", PA: "Panama", PY: "Paraguay",
  PE: "Peru", PR: "Puerto Rico", UY: "Uruguay", VE: "Venezuela",
};

export default function PublicAnimalDetail() {
  const { id } = useParams();
  const [animal, setAnimal] = useState(null);

  useEffect(() => {
    api.get(`/catalog/${id}/`).then((res) => setAnimal(res.data));
  }, [id]);

  const personalityTags = useMemo(
    () => animal?.personality_tags?.split(",").map((tag) => tag.trim()).filter(Boolean) || [],
    [animal],
  );

  if (!animal) return <main className="public-page">Cargando...</main>;

  const health = [
    animal.vaccinated && "Vacunado",
    animal.sterilized && "Esterilizado",
    animal.dewormed && "Desparasitado",
  ].filter(Boolean);
  const country = countryLabels[animal.country] || animal.country || "Pais por confirmar";
  const countryCode = String(animal.country || "").toLowerCase();
  const region = animal.region ? `${animal.region}, ` : "";

  return (
    <main className="public-page animal-public-profile">
      <Link to="/catalogo" className="back"><i className="bi bi-arrow-left" /> Volver al catalogo</Link>

      <section className="public-animal-hero">
        <div className="public-animal-photo">
          <AnimalPhoto src={mediaUrl(animal.photo_url)} name={animal.name} />
          <span className="public-photo-badge"><i className="bi bi-heart-pulse" /> {animal.status_label || "Disponible"}</span>
          <div className="public-photo-caption">
            <strong>{animal.name}</strong>
            <span>{animal.species_label} en {animal.shelter_name || "Refugio SIGERA"}</span>
          </div>
        </div>
        <article className="public-animal-info">
          <div className="public-animal-info-top">
            <span className="eyebrow">Listo para adopcion</span>
            <h1>{animal.name}</h1>
            <p className="public-animal-description">{animal.public_description || `${animal.name} espera una familia responsable que pueda darle cuidado, tiempo y un hogar estable.`}</p>
          </div>

          <div className="profile-facts">
            <Badge tone="blue"><i className="bi bi-gender-ambiguous" /> {animal.sex_label}</Badge>
            <Badge tone="blue"><i className="bi bi-heart-pulse" /> {animal.species_label}</Badge>
            <Badge tone="blue"><i className="bi bi-arrows-angle-expand" /> {animal.size_label}</Badge>
            <Badge tone="gray"><i className="bi bi-calendar3" /> {animal.approximate_age}</Badge>
            {animal.weight_kg && <Badge tone="gray"><i className="bi bi-speedometer2" /> {animal.weight_kg} kg</Badge>}
          </div>

          <div className="public-location-card">
            <i className="bi bi-geo-alt" />
            <div>
              <strong>{animal.shelter_name || "Refugio SIGERA"}</strong>
              <span><span className={`css-flag flag-${countryCode}`} aria-hidden="true" /> {region}{country}</span>
              <small>{animal.location || "Ubicacion interna por confirmar"}</small>
            </div>
          </div>

          <div className="public-match-panel">
            <h2>Un hogar ideal para {animal.name}</h2>
            <p>Busca una familia comprometida, con tiempo para acompanar su adaptacion y mantener comunicacion con el refugio durante el seguimiento.</p>
            <div>
              {health.length ? health.map((item) => <span key={item}><i className="bi bi-check2-circle" /> {item}</span>) : <span><i className="bi bi-info-circle" /> Salud en revision</span>}
            </div>
          </div>

          <Link className="primary cta" to={`/catalogo/${animal.id}/solicitud`}>
            <i className="bi bi-file-earmark-text" /> Iniciar solicitud de adopcion
          </Link>
        </article>
      </section>

      <section className="public-animal-grid">
        <article className="panel public-profile-card">
          <h2><i className="bi bi-card-checklist" /> Datos principales</h2>
          <div className="profile-detail-list">
            <div><span>Raza</span><strong>{animal.breed || "Mestizo"}</strong></div>
            <div><span>Edad</span><strong>{animal.approximate_age || "Por estimar"}</strong></div>
            <div><span>Estado</span><strong>{animal.status_label || "Disponible"}</strong></div>
            <div><span>Refugio</span><strong>{animal.shelter_name || "SIGERA"}</strong></div>
          </div>
        </article>
        <article className="panel public-profile-card">
          <h2><i className="bi bi-shield-check" /> Salud y cuidados</h2>
          <div className="health-pill-list">
            {health.length
              ? health.map((item) => <span key={item}><i className="bi bi-check2-circle" /> {item}</span>)
              : <span><i className="bi bi-info-circle" /> Sin registros publicos</span>}
          </div>
        </article>
        <article className="panel public-profile-card">
          <h2><i className="bi bi-stars" /> Personalidad</h2>
          <div className="health-pill-list">
            {personalityTags.length
              ? personalityTags.map((tag) => <span key={tag}>{tag}</span>)
              : <span>Tranquilo, sociable y en proceso de adaptacion.</span>}
          </div>
        </article>
      </section>
    </main>
  );
}
