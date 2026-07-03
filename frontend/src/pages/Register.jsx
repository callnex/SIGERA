import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const latinAmericanDialingCountries = [
  { countryCode: "AR", dial: "+54", name: "Argentina" },
  { countryCode: "BO", dial: "+591", name: "Bolivia" },
  { countryCode: "BR", dial: "+55", name: "Brasil" },
  { countryCode: "CL", dial: "+56", name: "Chile" },
  { countryCode: "CO", dial: "+57", name: "Colombia" },
  { countryCode: "CR", dial: "+506", name: "Costa Rica" },
  { countryCode: "CU", dial: "+53", name: "Cuba" },
  { countryCode: "DO", dial: "+1", name: "Republica Dominicana" },
  { countryCode: "EC", dial: "+593", name: "Ecuador" },
  { countryCode: "SV", dial: "+503", name: "El Salvador" },
  { countryCode: "GT", dial: "+502", name: "Guatemala" },
  { countryCode: "HT", dial: "+509", name: "Haiti" },
  { countryCode: "HN", dial: "+504", name: "Honduras" },
  { countryCode: "MX", dial: "+52", name: "Mexico" },
  { countryCode: "NI", dial: "+505", name: "Nicaragua" },
  { countryCode: "PA", dial: "+507", name: "Panama" },
  { countryCode: "PY", dial: "+595", name: "Paraguay" },
  { countryCode: "PE", dial: "+51", name: "Peru" },
  { countryCode: "PR", dial: "+1", name: "Puerto Rico" },
  { countryCode: "UY", dial: "+598", name: "Uruguay" },
  { countryCode: "VE", dial: "+58", name: "Venezuela" },
].sort((a, b) => a.name.localeCompare(b.name, "es"));

const latinAmericanCountries = latinAmericanDialingCountries.map(({ countryCode, name }) => ({ code: countryCode, name }));

const adopterInitial = {
  first_name: "",
  last_name: "",
  email: "",
  phone_country: "CO",
  phone: "",
  document_type: "CC",
  document: "",
  password: "",
  password_confirm: "",
};

const shelterInitial = {
  shelter_name: "",
  contact_first_name: "",
  contact_last_name: "",
  email: "",
  phone_country: "CO",
  phone: "",
  document_type: "NIT",
  document: "",
  address_country: "CO",
  address_region: "",
  address_city: "",
  address_line: "",
  address_complement: "",
  password: "",
  password_confirm: "",
};

export default function Register() {
  const [accountType, setAccountType] = useState("shelter");
  const [adopter, setAdopter] = useState(adopterInitial);
  const [shelter, setShelter] = useState(shelterInitial);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const form = accountType === "adopter" ? adopter : shelter;
  const setForm = accountType === "adopter" ? setAdopter : setShelter;

  function selectType(type) {
    setAccountType(type);
    setError("");
    setSuccess(null);
  }

  function update(name, value) {
    setForm({ ...form, [name]: value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.password_confirm) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    const { password_confirm, phone_country, ...payload } = form;
    const dialingCountry = latinAmericanDialingCountries.find((country) => country.countryCode === phone_country);
    payload.phone = `${dialingCountry?.dial || ""} ${payload.phone}`.trim();
    if (accountType === "shelter") {
      payload.organization_document = `${payload.document_type}: ${payload.document}`;
      payload.address = [
        payload.address_line,
        payload.address_complement,
        payload.address_city,
        payload.address_region,
        latinAmericanCountries.find((country) => country.code === payload.address_country)?.name || payload.address_country,
      ].filter(Boolean).join(", ");
      delete payload.document_type;
      delete payload.document;
      delete payload.address_country;
      delete payload.address_region;
      delete payload.address_city;
      delete payload.address_line;
      delete payload.address_complement;
    }
    try {
      const endpoint = accountType === "adopter" ? "/auth/register/adopter/" : "/auth/register/shelter/";
      const response = await api.post(endpoint, payload);
      setSuccess(response.data);
    } catch (requestError) {
      const data = requestError.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "No fue posible crear la cuenta. Intentalo nuevamente.");
    }
  }

  if (success) {
    return (
      <main className="register-page">
        <section className="registration-success">
          <span className="success-icon"><i className="bi bi-check2-circle" /></span>
          <p className="eyebrow">Registro completado</p>
          <h1>{success.account_type === "shelter" ? "Tu refugio ya tiene acceso" : "Tu cuenta esta lista"}</h1>
          <p>{success.message}</p>
          {success.shelter_code && (
            <div className="shelter-code">
              <span>Codigo de acceso del refugio</span>
              <strong>{success.shelter_code}</strong>
              <small>Conservalo: lo usaras como usuario al iniciar sesion.</small>
            </div>
          )}
          <Link className="primary" to="/login">Ir a iniciar sesion <i className="bi bi-arrow-right" /></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="register-page">
      <section className="register-heading">
        <span className="home-kicker">Registro SIGERA</span>
        <h1>Crea el acceso que necesitas</h1>
        <p>Elige el tipo de cuenta para continuar con un proceso de adopcion o administrar tu refugio.</p>
      </section>

      <section className="register-layout">
        <aside className="register-type-picker" aria-label="Tipo de registro">
          <button className={accountType === "shelter" ? "selected" : ""} type="button" onClick={() => selectType("shelter")}>
            <i className="bi bi-buildings" />
            <span><strong>Represento un refugio</strong><small>Accede a animales, salud, inventario y adopciones.</small></span>
          </button>
          <button className={accountType === "adopter" ? "selected" : ""} type="button" onClick={() => selectType("adopter")}>
            <i className="bi bi-heart" />
            <span><strong>Quiero adoptar</strong><small>Registra tus datos y explora animales disponibles.</small></span>
          </button>
          <p><i className="bi bi-shield-check" /> Tus datos se usan unicamente para gestionar tu cuenta y los procesos autorizados.</p>
        </aside>

        <form className="register-form" onSubmit={submit}>
          <div className="register-form-title">
            <span><i className={`bi ${accountType === "adopter" ? "bi-person-heart" : "bi-house-heart"}`} /></span>
            <div>
              <h2>{accountType === "adopter" ? "Datos del adoptante" : "Datos del refugio"}</h2>
              <p>{accountType === "adopter" ? "El documento se registra ahora. El archivo se pedira al iniciar una adopcion." : "Al finalizar recibiras un codigo unico para ingresar al sistema."}</p>
            </div>
          </div>
          {error && <div className="alert error">{error}</div>}
          {accountType === "adopter" ? <AdopterFields form={form} update={update} /> : <ShelterFields form={form} update={update} />}
          <label className="check register-terms"><input type="checkbox" required /> Acepto el tratamiento de mis datos para la gestion de la cuenta.</label>
          <button className="primary" type="submit">{accountType === "adopter" ? "Crear cuenta de adoptante" : "Registrar refugio"} <i className="bi bi-arrow-right" /></button>
          <p className="register-login">Ya tienes una cuenta? <Link to="/login">Inicia sesion</Link></p>
        </form>
      </section>
    </main>
  );
}

function AdopterFields({ form, update }) {
  return <div className="register-fields">
    <div className="two-cols">
      <Input label="Nombres" value={form.first_name} onChange={(value) => update("first_name", value)} />
      <Input label="Apellidos" value={form.last_name} onChange={(value) => update("last_name", value)} />
      <Input label="Correo electronico" type="email" value={form.email} onChange={(value) => update("email", value)} />
      <PhoneField label="Teléfono" country={form.phone_country} value={form.phone} update={update} />
      <label>Tipo de documento<select value={form.document_type} onChange={(event) => update("document_type", event.target.value)}><option>CC</option><option>CE</option><option>Pasaporte</option><option>Otro</option></select></label>
      <Input label="Numero de documento" value={form.document} onChange={(value) => update("document", value)} />
    </div>
    <PasswordFields form={form} update={update} />
  </div>;
}

function ShelterFields({ form, update }) {
  return <div className="register-fields">
    <section className="register-subsection">
      <h3>Información de contacto</h3>
      <div className="two-cols">
      <Input label="Nombre del refugio" value={form.shelter_name} onChange={(value) => update("shelter_name", value)} />
      <Input label="Nombres de la persona responsable" value={form.contact_first_name} onChange={(value) => update("contact_first_name", value)} />
      <Input label="Apellidos de la persona responsable" value={form.contact_last_name} onChange={(value) => update("contact_last_name", value)} />
      <Input label="Correo electrónico" type="email" value={form.email} onChange={(value) => update("email", value)} />
      <PhoneField label="Teléfono de contacto" country={form.phone_country} value={form.phone} update={update} />
      <label>Tipo de documento<select value={form.document_type} onChange={(event) => update("document_type", event.target.value)}><option>NIT</option><option>RUT</option><option>Registro legal</option><option>Otro</option></select></label>
      <Input label="Documento" value={form.document} onChange={(value) => update("document", value)} />
      </div>
    </section>
    <section className="register-subsection">
      <h3>Ubicación del refugio</h3>
      <div className="two-cols">
        <CountryField label="País" value={form.address_country} options={latinAmericanCountries} onChange={(value) => update("address_country", value)} />
        <Input label="Departamento, estado o provincia" value={form.address_region} onChange={(value) => update("address_region", value)} />
        <Input label="Ciudad o municipio" value={form.address_city} onChange={(value) => update("address_city", value)} />
        <Input label="Dirección" value={form.address_line} onChange={(value) => update("address_line", value)} />
        <Input label="Complemento de dirección" required={false} value={form.address_complement} onChange={(value) => update("address_complement", value)} />
      </div>
    </section>
    <PasswordFields form={form} update={update} />
  </div>;
}

function PasswordFields({ form, update }) {
  return <div className="two-cols password-fields">
    <Input label="Contrasena" type="password" minLength="8" value={form.password} onChange={(value) => update("password", value)} />
    <Input label="Confirmar contrasena" type="password" minLength="8" value={form.password_confirm} onChange={(value) => update("password_confirm", value)} />
  </div>;
}

function Input({ label, type = "text", value, onChange, required = true, minLength }) {
  return <label>{label}<input type={type} value={value} minLength={minLength} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function PhoneField({ label, country, value, update }) {
  const options = latinAmericanDialingCountries.map((item) => ({ code: item.countryCode, name: `${item.name} (${item.dial})` }));
  return <div className="country-field"><span>{label}</span><span className="phone-field"><CountryPicker ariaLabel={`Indicativo para ${label}`} value={country} options={options} onChange={(value) => update("phone_country", value)} /><input aria-label={`Número de ${label}`} type="tel" inputMode="tel" value={value} required onChange={(event) => update("phone", event.target.value)} /></span></div>;
}

function CountryField({ label, value, options, onChange }) {
  return <div className="country-field"><span>{label}</span><CountryPicker ariaLabel={label} value={value} options={options} onChange={onChange} /></div>;
}

function CountryPicker({ ariaLabel, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.code === value) || options[0];
  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const filtered = normalizedSearch ? options.filter((option) => option.name.toLocaleLowerCase("es").includes(normalizedSearch)) : options;

  return <span className="country-picker"><button className="country-picker-trigger" type="button" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen(!open)}><Flag code={selected.code} /><span>{selected.name}</span><i className="bi bi-chevron-down" /></button>{open && <span className="country-picker-menu"><input aria-label={`Buscar ${ariaLabel}`} autoFocus placeholder="Buscar país" value={search} onChange={(event) => setSearch(event.target.value)} />{filtered.map((option) => <button type="button" key={option.code} onClick={() => { onChange(option.code); setOpen(false); setSearch(""); }}><Flag code={option.code} /><span>{option.name}</span></button>)}</span>}</span>;
}

function Flag({ code }) {
  return <img className="country-flag" src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" loading="lazy" />;
}
