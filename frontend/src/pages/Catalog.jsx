import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { State } from "country-state-city";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../api/auth.jsx";
import { AnimalPhoto } from "../components/UI.jsx";
import logoPaw from "../assets/logo-paw-blue.png";

const latinCountries = [
  ["AR", "Argentina"], ["BO", "Bolivia"], ["BR", "Brasil"], ["CL", "Chile"], ["CO", "Colombia"],
  ["CR", "Costa Rica"], ["CU", "Cuba"], ["DO", "Republica Dominicana"], ["EC", "Ecuador"],
  ["SV", "El Salvador"], ["GT", "Guatemala"], ["HT", "Haiti"], ["HN", "Honduras"], ["MX", "Mexico"],
  ["NI", "Nicaragua"], ["PA", "Panama"], ["PY", "Paraguay"], ["PE", "Peru"], ["PR", "Puerto Rico"],
  ["UY", "Uruguay"], ["VE", "Venezuela"],
].map(([code, name]) => ({ code, name }));

function detectedCountry() {
  if (typeof navigator === "undefined") return "";
  const locale = navigator.languages?.[0] || navigator.language || "";
  const match = locale.match(/-([A-Z]{2})$/i);
  const code = match?.[1]?.toUpperCase() || "";
  return latinCountries.some((country) => country.code === code) ? code : "";
}

const baseFilters = () => ({ species: "", sex: "", size: "", country: detectedCountry(), region: "" });
const normalizedRegion = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const countryName = (code) => latinCountries.find((country) => country.code === code)?.name || code;

export default function Catalog() {
  const { token, user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [filters, setFilters] = useState(baseFilters);
  const scopedToShelter = Boolean(token && user?.profile?.shelter);

  useEffect(() => {
    api.get("/catalog/", { params: { ...filters, ...(scopedToShelter ? { mine: "1" } : {}) } }).then((response) => setAnimals(response.data));
  }, [filters, scopedToShelter]);

  const regions = useMemo(() => (
    filters.country
      ? State.getStatesOfCountry(filters.country)
        .map((region) => ({ label: region.name, value: normalizedRegion(region.name) }))
        .sort((a, b) => a.label.localeCompare(b.label, "es"))
      : []
  ), [filters.country]);

  const visibleAnimals = useMemo(() => {
    const seen = new Set();
    return animals.filter((animal) => {
      if (seen.has(animal.id)) return false;
      seen.add(animal.id);
      return true;
    });
  }, [animals]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, ...(name === "country" ? { region: "" } : {}) }));
  }

  return (
    <main className="public-page">
      <section className="hero">
        <h1>Encuentra a tu nuevo mejor amigo</h1>
        <p>Descubre animales que esperan una segunda oportunidad. Tu adopción salva vidas.</p>
      </section>
      <section className="catalog-layout">
        <aside className="filters">
          <h2><i className="bi bi-filter" /> Filtros</h2>
          {scopedToShelter && <p className="filter-note"><i className="bi bi-building-check" /> Mostrando animales publicados por tu refugio.</p>}
          <label>Pais<select value={filters.country} onChange={(event) => updateFilter("country", event.target.value)}><option value="">Todos los países</option>{latinCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          <label>Departamento o provincia<select value={filters.region} onChange={(event) => updateFilter("region", event.target.value)}><option value="">Todas las regiones</option>{regions.map((region) => <option key={region.value} value={region.value}>{region.label}</option>)}</select></label>
          <label>Especie<select value={filters.species} onChange={(event) => updateFilter("species", event.target.value)}><option value="">Todas</option><option value="dog">Perros</option><option value="cat">Gatos</option><option value="other">Otros</option></select></label>
          <label>Sexo<select value={filters.sex} onChange={(event) => updateFilter("sex", event.target.value)}><option value="">Todos</option><option value="male">Macho</option><option value="female">Hembra</option></select></label>
          <label>Tamaño<select value={filters.size} onChange={(event) => updateFilter("size", event.target.value)}><option value="">Todos</option><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option></select></label>
          <button className="secondary" onClick={() => setFilters(baseFilters())}>Limpiar filtros</button>
        </aside>
        <div className="animal-cards">{visibleAnimals.map((animal) => <AnimalCard animal={animal} key={animal.id} />)}</div>
      </section>
    </main>
  );
}

function AnimalCard({ animal }) {
  const region = animal.region ? `${animal.region}, ` : "";
  const place = animal.country ? `${region}${countryName(animal.country)}` : region.replace(/, $/, "");
  return (
    <article className="animal-card">
      <div className="card-photo"><AnimalPhoto src={mediaUrl(animal.photo_url)} name={animal.name} /></div>
      <div className="card-body">
        <h2>{animal.name}</h2>
        <div className="animal-facts">
          <span><i className="bi bi-gender-ambiguous" /> {animal.sex_label}</span>
          <span>{animal.species === "dog" ? <img className="animal-fact-logo" src={logoPaw} alt="" /> : <i className="bi bi-balloon-heart" />} {animal.species_label}</span>
          <span><i className="bi bi-arrows-angle-expand" /> {animal.size_label}</span>
        </div>
        <div className="animal-health">{animal.vaccinated && <span><i className="bi bi-shield-check" /> Vacunado</span>}{animal.sterilized && <span><i className="bi bi-scissors" /> Esterilizado</span>}{animal.dewormed && <span><i className="bi bi-bug" /> Desparasitado</span>}</div>
        <div className="animal-location"><i className="bi bi-geo-alt" /><div><strong>{animal.shelter_name}{place ? ` - ${place}` : ""}</strong><span>{animal.location || "Ubicacion por confirmar"}</span></div></div>
        <p className="quote">{animal.public_description}</p>
        <Link className="accent" to={`/catalogo/${animal.id}/solicitud`}><i className="bi bi-heart" /> Iniciar adopción</Link>
        <Link className="primary" to={`/catalogo/${animal.id}`}>Ver perfil de {animal.name} <i className="bi bi-arrow-right" /></Link>
      </div>
    </article>
  );
}
