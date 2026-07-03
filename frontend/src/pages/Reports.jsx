import { useEffect, useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { api } from "../api/client";
import { PageHeader, StatCard } from "../components/UI.jsx";
import logoPaw from "../assets/logo-paw-blue.png";

export default function Reports() {
  const [summary, setSummary] = useState({ report_data: [] });
  const [reportType, setReportType] = useState("adoptions");
  useEffect(() => { api.get("/reports/summary/", { params: { type: reportType } }).then((res) => setSummary(res.data)); }, [reportType]);
  async function pdf() {
    const res = await api.get("/reports/adoptions.pdf", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte_adopciones_sigera.pdf";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeader title="Reportes Operativos" subtitle="Generacion y analisis de datos estadisticos del refugio." action={<button className="secondary" onClick={pdf}><i className="bi bi-download" /> Exportar PDF</button>} />
      <section className="stats-grid"><StatCard image={logoPaw} label="Animales totales" value={summary.animals_total ?? 0} /><StatCard icon="bi-heart" label="Adoptados este mes" value={summary.adopted_month ?? 0} /><StatCard icon="bi-box" label="Stock critico" value={summary.stock_critical ?? 0} tone="red" /></section>
      <section className="dashboard-grid"><div className="panel"><h2>Configurar reporte</h2><button className={`report-option ${reportType === "adoptions" ? "active" : ""}`} onClick={() => setReportType("adoptions")}>Adopciones por periodo</button><button className={`report-option ${reportType === "animals" ? "active" : ""}`} onClick={() => setReportType("animals")}>Animales registrados</button><button className={`report-option ${reportType === "inventory" ? "active" : ""}`} onClick={() => setReportType("inventory")}>Inventario critico</button></div><div className="panel chart-panel"><h2>{reportType === "adoptions" ? "Tendencia de adopciones" : reportType === "animals" ? "Animales por especie" : "Existencias criticas"}</h2><ResponsiveContainer width="100%" height={330}>{reportType === "adoptions" ? <BarChart data={summary.report_data || []}><XAxis dataKey="mes" /><YAxis allowDecimals={false} /><Legend /><Bar dataKey="perros" name="Perros" fill="#0b63f6" /><Bar dataKey="gatos" name="Gatos" fill="#6f93d7" /></BarChart> : <BarChart data={summary.report_data || []}><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Legend /><Bar dataKey="total" name={reportType === "animals" ? "Animales" : "Stock actual"} fill={reportType === "animals" ? "#0b63f6" : "#ff8a5c"} /><Bar dataKey="minimum" name="Minimo" fill="#6f93d7" /></BarChart>}</ResponsiveContainer></div></section>
    </>
  );
}
