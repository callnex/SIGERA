import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Badge, PageHeader, StatCard } from "../components/UI.jsx";

const hiddenMovementKey = "sigera_hidden_inventory_movements";

const emptyItemForm = {
  name: "",
  brand: "",
  category: "food",
  unit: "kg",
  current_stock: 0,
  minimum_stock: 0,
  supplier: "",
  storage_location: "",
  expiry_date: "",
  unit_cost: "",
  currency: "COP",
  stock_status_override: "",
  notes: "",
};

const categories = [
  { key: "all", label: "Todos", icon: "bi-grid" },
  { key: "food", label: "Alimentos", icon: "bi-basket" },
  { key: "medicine", label: "Medicamentos", icon: "bi-capsule" },
  { key: "cleaning", label: "Limpieza", icon: "bi-stars" },
  { key: "other", label: "Otros", icon: "bi-box" },
];

const currencies = ["COP", "USD", "EUR", "MXN", "ARS", "CLP", "PEN", "BRL"];
const stockStatusLabels = { critical: "Crítico", low: "Bajo", ok: "Óptimo" };

function readHiddenMovementIds() {
  try {
    return JSON.parse(localStorage.getItem(hiddenMovementKey) || "[]");
  } catch {
    return [];
  }
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState("");
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [filters, setFilters] = useState({ search: "", category: "all", status: "all" });
  const [movementFilters, setMovementFilters] = useState({ from: "", to: "" });
  const [hiddenMovementIds, setHiddenMovementIds] = useState(readHiddenMovementIds);

  const load = () => {
    api.get("/inventory-items/")
      .then((res) => { setItems(res.data); setError(""); })
      .catch(() => setError("No fue posible cargar el inventario. Intentalo nuevamente."));
    api.get("/inventory-movements/").then((res) => setMovements(res.data)).catch(() => setMovements([]));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    localStorage.setItem(hiddenMovementKey, JSON.stringify(hiddenMovementIds));
  }, [hiddenMovementIds]);

  async function createItem(event) {
    event.preventDefault();
    try {
      await api.post("/inventory-items/", {
        ...itemForm,
        current_stock: intValue(itemForm.current_stock),
        minimum_stock: intValue(itemForm.minimum_stock),
        expiry_date: itemForm.expiry_date || null,
        unit_cost: itemForm.unit_cost || null,
      });
      setItemForm(emptyItemForm);
      load();
    } catch {
      setError("No fue posible crear el artículo.");
    }
  }

  const filteredItems = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = filters.category === "all" || item.category === filters.category;
      const matchesStatus = filters.status === "all" || item.stock_status === filters.status;
      const matchesTerm = !term || `${item.name} ${item.brand} ${item.supplier}`.toLowerCase().includes(term);
      return matchesCategory && matchesStatus && matchesTerm;
    });
  }, [items, filters]);

  const groupedItems = categories
    .filter((category) => category.key !== "all")
    .map((category) => ({ ...category, items: filteredItems.filter((item) => item.category === category.key) }))
    .filter((category) => filters.category === "all" ? category.items.length : category.key === filters.category && category.items.length);

  const visibleMovements = useMemo(() => movements.filter((entry) => {
    if (hiddenMovementIds.includes(entry.id)) return false;
    return inDateRange(entry.created_at || entry.movement_date || entry.date, movementFilters.from, movementFilters.to);
  }), [movements, hiddenMovementIds, movementFilters]);

  const critical = items.filter((item) => item.stock_status === "critical").length;

  function clearMovements(days) {
    const now = new Date();
    const ids = movements.filter((entry) => {
      const value = entry.created_at || entry.movement_date || entry.date;
      const date = value ? new Date(value) : now;
      if (Number.isFinite(days)) return (now - date) / 86400000 <= days;
      return inDateRange(value, movementFilters.from, movementFilters.to);
    }).map((entry) => entry.id);
    setHiddenMovementIds((current) => Array.from(new Set([...current, ...ids])));
  }

  return (
    <>
      <PageHeader title="Inventario de Suministros" subtitle="Gestión de alimentos, medicamentos y artículos de limpieza." />
      {error && <div className="alert error">{error}</div>}
      <section className="stats-grid inventory-stats">
        <button type="button" onClick={() => setFilters({ ...filters, status: "all" })}><StatCard icon="bi-box" label="Artículos registrados" value={items.length} /></button>
        <button type="button" onClick={() => setFilters({ ...filters, status: "critical" })}><StatCard icon="bi-exclamation-triangle" label="Stock crítico" value={critical} tone="red" /></button>
        <button type="button" onClick={() => setFilters({ ...filters, status: "all" })}><StatCard icon="bi-truck" label="Movimientos" value={movements.length} tone="orange" /></button>
      </section>

      <details className="panel inventory-create">
        <summary><i className="bi bi-plus-circle" /> Registrar nuevo artículo</summary>
        <form className="form-section" onSubmit={createItem}>
          <div className="two-cols">
            <Field label="Nombre" value={itemForm.name} required onChange={(value) => setItemForm({ ...itemForm, name: value })} />
            <Field label="Marca" value={itemForm.brand} onChange={(value) => setItemForm({ ...itemForm, brand: value })} />
            <label>Categoria<select value={itemForm.category} onChange={(event) => setItemForm({ ...itemForm, category: event.target.value })}><option value="food">Alimentos</option><option value="medicine">Medicamentos</option><option value="cleaning">Limpieza</option><option value="other">Otros</option></select></label>
            <Field label="Unidad" value={itemForm.unit} required placeholder="kg, dosis, L" onChange={(value) => setItemForm({ ...itemForm, unit: value })} />
            <Field label="Stock inicial" type="number" min="0" step="1" value={itemForm.current_stock} onChange={(value) => setItemForm({ ...itemForm, current_stock: intValue(value) })} />
            <Field label="Stock minimo" type="number" min="0" step="1" value={itemForm.minimum_stock} onChange={(value) => setItemForm({ ...itemForm, minimum_stock: intValue(value) })} />
            <Field label="Proveedor" value={itemForm.supplier} onChange={(value) => setItemForm({ ...itemForm, supplier: value })} />
            <Field label="Ubicacion de almacenamiento" value={itemForm.storage_location} onChange={(value) => setItemForm({ ...itemForm, storage_location: value })} />
            <label>Vencimiento<input type="date" value={itemForm.expiry_date} onChange={(event) => setItemForm({ ...itemForm, expiry_date: event.target.value })} /></label>
            <label>Costo unitario<span className="currency-field"><select value={itemForm.currency} onChange={(event) => setItemForm({ ...itemForm, currency: event.target.value })}>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select><input type="number" min="0" step="0.01" value={itemForm.unit_cost} onChange={(event) => setItemForm({ ...itemForm, unit_cost: event.target.value })} /></span></label>
            <label>Estado de stock<select value={itemForm.stock_status_override} onChange={(event) => setItemForm({ ...itemForm, stock_status_override: event.target.value })}><option value="">Automático según mínimo</option><option value="ok">Óptimo</option><option value="low">Bajo</option><option value="critical">Crítico</option></select></label>
          </div>
          <label>Notas<textarea value={itemForm.notes} onChange={(event) => setItemForm({ ...itemForm, notes: event.target.value })} /></label>
          <button className="primary">Guardar artículo</button>
        </form>
      </details>

      <section className="panel inventory-controls">
        <div className="inventory-toolbar">
          <label className="search-field"><i className="bi bi-search" /><input placeholder="Buscar producto, marca o proveedor..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">Todos los estados</option>
            <option value="ok">Óptimo</option>
            <option value="low">Bajo</option>
            <option value="critical">Crítico</option>
          </select>
        </div>
        <div className="inventory-category-tabs">
          {categories.map((category) => (
            <button key={category.key} type="button" className={filters.category === category.key ? "active" : ""} onClick={() => setFilters({ ...filters, category: category.key })}>
              <i className={`bi ${category.icon}`} /> {category.label}
            </button>
          ))}
        </div>
      </section>

      <section className="inventory-sections">
        {groupedItems.map((category) => (
          <article className="table-panel inventory-category-section" key={category.key}>
            <div className="section-title"><i className={`bi ${category.icon}`} /><div><h2>{category.label}</h2><p>{category.items.length} productos filtrados.</p></div></div>
            <table>
              <thead><tr><th>Artículo</th><th>Stock actual</th><th>Mínimo</th><th>Ubicación / vencimiento</th><th>Costo</th><th>Estado</th></tr></thead>
              <tbody>{category.items.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong><small>{[item.brand, item.supplier].filter(Boolean).join(" - ") || "Sin proveedor"}</small></td>
                  <td>{formatInt(item.current_stock)} {item.unit}</td>
                  <td>{formatInt(item.minimum_stock)} {item.unit}</td>
                  <td>{item.storage_location || "-"}<small>{item.expiry_date || "Sin vencimiento"}</small></td>
                  <td>{item.unit_cost ? `${item.currency || "COP"} ${item.unit_cost}` : "-"}</td>
                  <td><Badge tone={item.stock_status === "critical" ? "red" : item.stock_status === "low" ? "orange" : "green"}>{stockStatusLabels[item.stock_status] || item.stock_status}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </article>
        ))}
      </section>
      <section className="panel movement-history">
        <div className="section-title"><i className="bi bi-clock-history" /><div><h2>Movimientos recientes</h2><p>Últimas entradas y salidas registradas.</p></div></div>
        <div className="history-controls movement-history-controls">
          <label>Desde<input type="date" value={movementFilters.from} onChange={(event) => setMovementFilters({ ...movementFilters, from: event.target.value })} /></label>
          <label>Hasta<input type="date" value={movementFilters.to} onChange={(event) => setMovementFilters({ ...movementFilters, to: event.target.value })} /></label>
          <button type="button" className="secondary small" onClick={() => setMovementFilters({ from: "", to: "" })}>Limpiar filtro</button>
          <button type="button" className="secondary small" onClick={() => clearMovements(7)}>Limpiar 7 dias</button>
          <button type="button" className="secondary small" onClick={() => clearMovements(30)}>Limpiar 30 dias</button>
          <button type="button" className="danger-button small" onClick={() => setHiddenMovementIds(movements.map((entry) => entry.id))}>Limpiar todo</button>
        </div>
        <div className="movement-history-list">
          {visibleMovements.slice(0, 6).map((entry) => (
            <article className="movement-history-entry" key={entry.id}>
              <Badge tone={entry.movement_type === "out" ? "orange" : "green"}>{entry.movement_type_label}</Badge>
              <strong>{entry.item_name}</strong>
              <span>{formatInt(entry.quantity)} {entry.reason ? `- ${entry.reason}` : "- Sin motivo"}</span>
            </article>
          ))}
          {!visibleMovements.length && <p className="empty-state">No hay movimientos para los filtros seleccionados.</p>}
        </div>
      </section>
    </>
  );
}

function Field({ label, type = "text", value, onChange, ...props }) {
  return <label>{label}<input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}

function intValue(value) {
  return Math.max(0, Number.parseInt(value || "0", 10) || 0);
}

function formatInt(value) {
  return Number.parseInt(value || "0", 10);
}

function inDateRange(value, from, to) {
  if (!value) return true;
  const date = new Date(value);
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}
