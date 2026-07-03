import { useState } from "react";
import logoPaw from "../assets/logo-paw-blue.png";

const contactChannels = [
  {
    icon: "bi-envelope",
    label: "Correo electrónico",
    value: "nicolamrta@gmail.com",
    note: "Respondemos en un plazo de 1 a 2 días hábiles.",
    href: "mailto:nicolamrta@gmail.com",
  },
  {
    icon: "bi-telephone",
    label: "Línea de atención",
    value: "+57 3224095727",
    note: "Lunes a viernes, de 8:00 a.m. a 5:00 p.m.",
    href: "tel:+573224095727",
  },
  {
    icon: "bi-geo-alt",
    label: "Ubicación",
    value: "Bogota D.C., Colombia",
    note: "Atención remota para refugios de Latinoamerica.",
  },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  function submit(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <main className="contact-page">
      <section className="contact-layout">
        <div className="contact-intro">
          <span className="contact-kicker">Contacto SIGERA</span>
          <h1>Hablemos sobre tu refugio</h1>
          <p>Estamos para ayudarte a organizar la operación diaria de tu refugio y resolver tus dudas sobre la plataforma.</p>
          <div className="contact-channels">
            {contactChannels.map((channel) => {
              const content = <><span><i className={`bi ${channel.icon}`} /></span><div><small>{channel.label}</small><strong>{channel.value}</strong><p>{channel.note}</p></div></>;
              return channel.href ? <a className="contact-channel" href={channel.href} key={channel.label}>{content}</a> : <div className="contact-channel" key={channel.label}>{content}</div>;
            })}
          </div>
          <div className="contact-logo"><img src={logoPaw} alt="Logo de SIGERA" /><span>SIGERA</span></div>
        </div>

        <form className="contact-form" onSubmit={submit}>
          <div className="contact-form-heading"><span><i className="bi bi-chat-dots" /></span><div><h2>Envíanos un mensaje</h2><p>Cuéntanos lo que necesitas y nos pondremos en contacto contigo.</p></div></div>
          {sent && <div className="alert success"><i className="bi bi-check2-circle" /> Mensaje preparado. Configura tu correo de soporte para recibir estas solicitudes.</div>}
          <div className="two-cols">
            <label>Nombres<input name="firstName" required /></label>
            <label>Apellidos<input name="lastName" required /></label>
          </div>
          <div className="two-cols">
            <label>Correo electrónico<input name="email" type="email" required /></label>
            <label>Telefono<input name="phone" type="tel" /></label>
          </div>
          <label>Asunto<select name="subject" defaultValue=""><option value="" disabled>Selecciona una opción</option><option>Información sobre SIGERA</option><option>Registro de un refugio</option><option>Soporte técnico</option><option>Alianzas y colaboraciones</option></select></label>
          <label>Mensaje<textarea name="message" placeholder="Escribe aqui tu mensaje..." required /></label>
          <button className="primary" type="submit">Enviar mensaje <i className="bi bi-send" /></button>
          <small className="contact-privacy"><i className="bi bi-shield-check" /> Usaremos tus datos unicamente para responder tu solicitud.</small>
        </form>
      </section>
    </main>
  );
}
