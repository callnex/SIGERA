import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../api/auth.jsx";
import { AnimalPhoto, Badge, PageHeader } from "../components/UI.jsx";

export default function Animals() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState("");
  const canManageAnimals = ["admin", "vet"].includes(user?.profile?.role);
  useEffect(() => { api.get("/animals/", { params: { search } }).then((res) => setAnimals(res.data)); }, [search]);
  return (
    <>
      <PageHeader title="Gestión de Animales" subtitle="Administra el inventario y estado de los animales." action={canManageAnimals ? <Link className="primary small" to="/admin/animales/nuevo"><i className="bi bi-plus" /> Registrar animal</Link> : null} />
      <div className="table-panel">
        <div className="toolbar"><input placeholder="Buscar por nombre o codigo..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <table><thead><tr><th>Animal</th><th>Codigo</th><th>Especie / raza</th><th>Estado</th><th>Ubicación</th><th>Acciones</th></tr></thead>
          <tbody>{animals.map((a) => <tr key={a.id}><td className="animal-cell"><AnimalPhoto src={mediaUrl(a.photo_url)} name={a.name} /><strong>{a.name}</strong></td><td>{a.code}</td><td>{a.species_label}<small>{a.breed}</small></td><td><Badge tone={a.status === "adopted" ? "gray" : a.status === "treatment" ? "orange" : "green"}>{a.status_label}</Badge></td><td>{a.location || "-"}</td><td><Link to={`/admin/animales/${a.id}`}><i className="bi bi-eye" /></Link><Link to={`/admin/animales/${a.id}/editar`}><i className="bi bi-pencil" /></Link></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
